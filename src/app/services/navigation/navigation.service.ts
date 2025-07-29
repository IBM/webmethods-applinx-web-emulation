/*
 * Copyright IBM Corp. 2024, 2025
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ 

import { Injectable } from '@angular/core';
import { GXUtils } from 'src/utils/GXUtils'
import { BehaviorSubject, Observable } from 'rxjs';
import { ScreenLockerService } from '../screen-locker.service';
import { Router } from '@angular/router';
import { UserExitsEventThrowerService } from '../user-exits-event-thrower.service';
import { NGXLogger } from 'ngx-logger';
import { HttpErrorResponse } from '@angular/common/http';
import { StorageService } from '../storage.service';
import { MessagesService } from '../messages.service';
import { Position, Size, InputField, Cursor, ScreenService, InfoService, SendKeysRequest, GetInfoResponse, GetScreenResponse, ReturnScreen, GetScreenRequest } from '@ibm/applinx-rest-apis';
import { TabAndArrowsService } from './tab-and-arrows.service';
import { StatusCodes } from 'http-status-codes';
import { GetScreenNumberResponse } from '@ibm/applinx-rest-apis/lib/model/getScreenNumberResponse';
import { GXConst } from '../enum.service';
import { SharedService } from '../shared.service';

@Injectable({
  providedIn: 'root', 
})

export class NavigationService {
  errorMessage: string;
  isAutoLogin: boolean;
  authMethod: string;
  private routingHandler: RoutingHandler;
  private screenId: number;
  private screenSize: Size;
  private sendableFields: Map<string, InputField>;
  private cursorPosition: Cursor;
  CHECK_HOST_SCREEN_UPDATE_INTERVAL:number = 5000;
  CHECK_HOST_SCREEN_UPDATE_TIMEOUT:number = 500;
  isConnectedtoHost: BehaviorSubject<boolean> = new BehaviorSubject(true); // if false - shows disconnection message or redirects to login page
  isScreenUpdated: BehaviorSubject<boolean> = new BehaviorSubject(false);
  screenObjectUpdated: BehaviorSubject<GetScreenResponse> = new BehaviorSubject(null);
  private isThereError: boolean = false; // if true - stops sampling screen every 5 seconds
  constructor(private screenService: ScreenService, 
              private screenLockerService: ScreenLockerService, private router: Router,
              private infoService: InfoService, 
              private logger: NGXLogger,
              private storageService: StorageService,
              private tabAndArrowsService: TabAndArrowsService,
              private userExitsEventThrower: UserExitsEventThrowerService,
              private messages: MessagesService,
              private sharedService: SharedService,
              ) {
    this.sendableFields = new Map<string, InputField>();
    this.setRoutingHandler();
    //this.checkHostScreenUpdate();
    this.getAuthMethod();
  }

  setIsAutoLogin (isAutoLogin:boolean): void {
    this.isAutoLogin = isAutoLogin;
  }

  checkHostScreenUpdate (): void {
    setInterval( () => { 
      this.checkScreenUpdated();
   }, this.CHECK_HOST_SCREEN_UPDATE_INTERVAL);
  }


  

  checkScreenUpdated () {
    if (this.isThereError || !this.storageService.isConnected()) {
      return;
    } 
    const req = new GetScreenRequest();                           
    if (this.getScreenId()){
      this.getHostScreenNumber().subscribe (
        screenNumberResponse => {
          if (screenNumberResponse.screenNumber >  this.getScreenId() ) {      
            this.isScreenUpdated.next(true);                      
          }
        },
        (error: HttpErrorResponse) => {
          this.errorHandler(error, true);
          this.logger.error(this.messages.get("FAILED_TO_GET_SCREEN_FROM_REST_API"));
          this.userExitsEventThrower.fireOnGetScreenError(error);
        });
    }
  }

  errorHandler(errorResponse: HttpErrorResponse, nonActivityFlow: boolean) {
    if (errorResponse.error.message.indexOf("Disconnected by host") > -1 ||
      errorResponse.error.message.indexOf("Session was disconnected by Host") > -1 ||
      errorResponse.error.message.indexOf("Not connected to Server (Software caused connection abort: recv failed)") > -1) {
        if (nonActivityFlow) {
          this.errorMessage = 'The session has timed out due to inactivity.';
          this.isConnectedtoHost.next(false);
          this.isThereError = true;
          this.sharedService.isSnackBarPresent()?this.sharedService.closeSnackBar():"";
        }
        else if ((this.isAuthDisabled() && this.isAutoLogin) ) { // show disconnect message                
          this.errorMessage = 'The session has been disconnected from the host.';          
          this.isConnectedtoHost.next(false);
          this.isThereError = true;
        }
        else { // redirect to webLogin
          this.storageService.setNotConnected();
        }  
      }
    }

  getHostScreenNumber (): Observable<GetScreenNumberResponse>{  
    let token = this.storageService.getAuthToken();     
    if ( this.storageService.isConnected())  
      return this.screenService.getScreenNumber(token);    
  }

  sendKeys(sendKey: string): void {
    if (this.screenLockerService.isLocked()) {
      return; // windows is loading...
    }
    this.getHostScreenNumber().subscribe (
      screenNumberResponse => {
        if (screenNumberResponse.screenNumber  > this.getScreenId()) {
          //Host screen id is newer than current screen, probably intermidiate screen , updating the current screen without sending key
          this.isScreenUpdated.next(true); 
          return;
        }
        this.sendKeysInternal (sendKey)
      },
    );
  }

  checkForIntermidateScreen() {
    setTimeout( () => { 
      this.checkScreenUpdated();
     }, this.CHECK_HOST_SCREEN_UPDATE_TIMEOUT);
  }

  sendKeysInternal (sendKey: string): void {
    this.screenLockerService.setScreenIdUpdated(false);
    this.screenLockerService.setLocked(true);
    const shouldReturnScreen = true;
    const returnScreen = new ReturnScreen (shouldReturnScreen);
    const sendKeysRequest = new SendKeysRequest(sendKey, this.cursorPosition, this.screenSize, Array.from(this.sendableFields.values()),returnScreen);//,returnScreen
    this.userExitsEventThrower.firePreSendKey(sendKeysRequest); 
    this.tearDown();     
    this.screenService.updateScreen(sendKeysRequest, this.screenId, this.storageService.getAuthToken()).subscribe(newScreen => {
      // this.tearDown();      
      this.userExitsEventThrower.firePostSendKey(newScreen);
      this.screenObjectUpdated.next (newScreen);      
      this.checkForIntermidateScreen();
      if(this.sharedService.getMacroRecordFlag()){
        this.sharedService.recordMacro(sendKeysRequest);
      }
      
    }, errorResponse => {
       // this.logger.error(errorResponse);
        this.errorHandler(errorResponse, false);
        this.userExitsEventThrower.fireOnSendKeyError(errorResponse);   
        this.screenLockerService.setLocked(false);
    });
  }

  getAuthMethod(): void {
    this.infoService.getInfo().subscribe((response: GetInfoResponse) => {
        this.authMethod = response.auth;
    });
  }

  isAuthDisabled (): boolean {
    return (this.authMethod == GXConst.DISABLED);
  }

  /**
   * Set content to unprotected field (input).
   * @param id - distinct id of the element.
   * @param value - the content to set.
   */
  public fillInput(id: string, value: any): void {
    if (!id) return;
    const el = document.getElementById(id) as HTMLInputElement;
    if (!el) return;
    el.value = value;
    const inputField = new InputField();
    inputField.name = id;
    inputField.value = value;
    this.setSendableField(inputField);
  }

  public getScreenId(): number {
    return this.screenId;
  }

  isThereErrorSetter(status: boolean): void {
    this.isThereError = status;
  }

  setScreenId(id: number): void {
    this.screenId = id;
    this.screenLockerService.setScreenIdUpdated(true);
  }

  setScreenSize(size: Size): void {
    this.screenSize = size;
  }

  setSendableField(inputField: InputField): void {
    this.sendableFields.set(this.getFieldId(inputField), inputField);
  }

  private getFieldId(inputField: InputField): string {
    return inputField.name || GXUtils.posToString(inputField.position);
  }

  setCursorPosition(cursor: Cursor, positionInWindow?: Position): void {
    this.cursorPosition = cursor;
    if (positionInWindow || cursor.position) {
      this.tabAndArrowsService.setMatrixPosition(positionInWindow || cursor.position);
    }
  }

  getCursorPosition(): Cursor {
    return this.cursorPosition;
  }

  getRoutingHandler(): RoutingHandler {
    return this.routingHandler;
  }

  private setRoutingHandler(): void {
    this.routingHandler = new RoutingHandler();
    const routes = new Set<string>();
    for (let i = 0; i < this.router.config.length; i++) {
      routes.add(GXUtils.removeSlash(this.router.config[i].path));
    }
    this.routingHandler.routes = routes;
  }

  redirectToSamePath(uri: string): void {
    this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => this.router.navigate([uri]));
  }
  
  handleScreenIdMismatch(errorResponse: HttpErrorResponse): void {
    let token = this.storageService.getAuthToken();     
    if ( this.storageService.isConnected()) 
      this.infoService.getInfo(token).subscribe((response: GetInfoResponse) => {
        if (response.sessionConnected && this.getScreenId() !== response.screenId) {
            this.logger.info(this.messages.get("SCREENID_MISMATCH_OCCURED_DURING_SENDKEYS_CALL"));
            this.setScreenId(response.screenId);
            this.tearDown();
            this.isScreenUpdated.next(true);
        } else {
          this.logger.error(errorResponse.message, errorResponse.error);
        }
      });
  }

  tearDown(): void {
    this.sendableFields.clear();
    this.tabAndArrowsService.tearDown();
  }

}

class RoutingHandler {
  routes: Set<string>;
  
  hasRoute(route: string): boolean {
    return this.routes.has(route);
  }
}