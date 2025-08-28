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
import {  ElementRef, HostListener, OnDestroy, ViewChildren } from '@angular/core';
import { QueryList } from '@angular/core';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit, Output,
  SimpleChanges,
} from '@angular/core';
import { GXAdditionalKey, GXKeyCodes } from '../services/enum.service';
import { KeyboardMappingService } from '../services/keyboard-mapping.service';
import {NavigationService} from '../services/navigation/navigation.service';
import { TabAndArrowsService } from '../services/navigation/tab-and-arrows.service';
import {StorageService} from '../services/storage.service';
import {popup} from '../../assets/JSfunctions/scripts';
import {cancel} from '../../assets/JSfunctions/scripts';
import {GXUtils} from 'src/utils/GXUtils'
import { Field, GetScreenRequest,
  GetScreenResponse,
  HostKeyTransformation,
  ScreenService, InputField, ScreenBounds } from '@ibm/applinx-rest-apis';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ScreenHolderService } from '../services/screen-holder.service';
import { UserExitsEventThrowerService } from '../services/user-exits-event-thrower.service';
import { NGXLogger } from 'ngx-logger';
import { MessagesService } from '../services/messages.service';
import { SharedService } from '../services/shared.service'
import { ScreenProcessorService } from '../services/screen-processor.service';
import { ScreenLockerService } from '../services/screen-locker.service'

@Component({
    selector: 'app-screen',
    templateUrl: './screen.component.html',
    styleUrls: ['./screen.component.scss'],
    standalone: false
})
export class ScreenComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @HostListener('input', ['$event'])
  handleInput(event: any): void {
    const ignore = ['app-multiple-options', 'app-input-field'];
    if (ignore.includes(event.path?.[1]?.tagName?.toLowerCase()) || ignore.includes(event.path?.[3]?.tagName?.toLowerCase())) {
      return;
    } 
    const tag = event.target.tagName;
    const id = event.target.id;
    const val = event.target.value;
    if (tag?.toLowerCase() === 'input' && id?.length > 0 && !id.includes("radio")) {
      const input = new InputField();
      input.setName(id);
      input.setValue(val);
      this.navigationService.setSendableField(input);
    }
  }

  @Input('screen') m_screen: GetScreenResponse; // The final processed screen that should be displayed
  @Input() isChildWindow = false;
  @Input() isLastChildWindow = false;
  @Input() index: number;
  @Output() hostKeysEmitter = new EventEmitter<HostKeyTransformation[]>();
  @Output() generatedPageEmitter = new EventEmitter<GetScreenResponse>();
  @ViewChildren('gridContainer') grid:  QueryList<any>;

  @Input() isGeneratedPage = false;
  hostKeyTransforms: HostKeyTransformation[] = [];
  childWindows: GetScreenResponse[] = [];
  screenWidthArray: Array<any>;

  getScreenSubscription: Subscription;
  isScreenUpdatedSubscription: Subscription;
  screenObjectUpdatedSubscription: Subscription;
  gridChangedSubscription: Subscription;
  inputFields: any = [];
  intensifiedScr: boolean = false;

  constructor(private screenService: ScreenService, private navigationService: NavigationService,
              private storageService: StorageService, private tabAndArrowsService: TabAndArrowsService,
              private keyboardMappingService: KeyboardMappingService, private userExitsEventThrower: UserExitsEventThrowerService,
              private ref: ElementRef, private router: Router, private screenHolderService: ScreenHolderService,
              private logger: NGXLogger, private messages: MessagesService,         
              private screenProcessorService: ScreenProcessorService, public screenLockerService: ScreenLockerService,
              private sharedService: SharedService,) {}
              
  ngAfterViewInit(): void {
    if (!this.isChildWindow) {
      this.gridChangedCallback();
      this.gridChangedSubscription = this.grid.changes.subscribe(() => this.gridChangedCallback());
    }
  }

  private gridChangedCallback() {
    setTimeout(() => {
      const screenArea = this.ref.nativeElement.querySelector('#gx_screenArea');
      if (screenArea) {
        const elements = screenArea.querySelectorAll('input, select');
        this.tabAndArrowsService.buildNavigationMatrix(elements, this.m_screen.screenSize, this.navigationService.getCursorPosition().position);
      }
      if (!this.isGeneratedPage) {
        setTimeout(() => this.hostKeysEmitter.emit(this.hostKeyTransforms));
        this.screenHolderService.screenInitialized.next(true);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((this.isChildWindow || this.isGeneratedPage) && this.m_screen) {
      this.onScreenInit(this.m_screen);
    }
  }

  ngOnInit(): void {
    if (!this.isChildWindow) {
      this.isScreenUpdatedSubscription = this.navigationService.isScreenUpdated.subscribe(value => {
        if (value === true) {
          this.navigationService.isScreenUpdated.next(false);
          this.getScreen();
          this.getRawScreenData();
        }
      });
    }

    this.screenObjectUpdatedSubscription = this.navigationService.screenObjectUpdated.subscribe(newScreen => {
      if (newScreen) {
        if(newScreen.screenId !== this.m_screen.screenId){
          this.postGetScreen (newScreen);
        }
        this.navigationService.screenObjectUpdated.next(null);
            this.getRawScreenData()
      }
    });


    if (!this.isChildWindow && !this.isGeneratedPage) {
      const currentScreen: GetScreenResponse = this.screenHolderService.getRuntimeScreen();
      if (!currentScreen) {
        this.getScreen();
      } else {
        this.onScreenInit(currentScreen);
      }
    }
  }

  getScreen(): void {    
    const req = new GetScreenRequest();
    this.userExitsEventThrower.firePreGetScreen(req);
    this.getScreenSubscription = this.screenService
    .getScreen(this.storageService.getAuthToken(), req)
    .subscribe(
      screen => {
        this.postGetScreen(screen);
        this.screenHolderService.setRawScreenData(screen)   
      },    
      error => {
        this.logger.error(this.messages.get("FAILED_TO_GET_SCREEN_FROM_REST_API"));
        this.userExitsEventThrower.fireOnGetScreenError(error);
      });
  }

  public getRawScreenData(): void {    
    const req = new GetScreenRequest();
    this.userExitsEventThrower.firePreGetScreen(req);
    this.getScreenSubscription = this.screenService.getScreen(this.storageService.getAuthToken(), req).subscribe(
      screen => this.screenHolderService.setRawScreenData(screen),   
      error => {
        this.logger.error(this.messages.get("FAILED_TO_GET_SCREEN_FROM_REST_API"));
        this.userExitsEventThrower.fireOnGetScreenError(error);
      });
  }

  private postGetScreen(screen: GetScreenResponse): void {
    this.hostKeyTransforms = [];
    this.userExitsEventThrower.firePostGetScreen(screen);
    this.screenHolderService.setRuntimeScreen(screen);
    const screenName = screen.name;
    this.logger.debug(this.messages.get("GET_SCREEN") + screenName);

    if (!GXUtils.isStringEmptyWithTrim(screenName) && this.navigationService.getRoutingHandler().hasRoute(screenName))
      this.redirectToRoute(screenName);
    else if (this.isGeneratedPage && !this.screenHolderService.isCurrentScreenWindow())
      this.router.navigate(['instant']);
    else {
      this.processScreen(screen);
    }
  }

  private setVisibleLines(screen: GetScreenResponse) {
    let inVisibleFieldsDetails = screen.fields.filter(element => element && !element.visible && element.protected);
    inVisibleFieldsDetails.forEach(element => {
      if (element.content.trim() == "") {
        element.visible = true
      }
    })
    }

  private processScreen(screen: GetScreenResponse): void {
      this.setVisibleLines(screen);
      if (this.screenHolderService.isCurrentScreenWindow() && !this.isChildWindow && 
           !(this.screenHolderService.getPreviousScreen().name == GXUtils.MENU && screen.name == GXUtils.UNKNOWN)) {
      this.shiftFieldsToMainWindow(screen);
      if (screen.windows.length === 1) {
        this.childWindows = [screen];
      } else {
        this.getChildWindows().push(screen);
      }
    } else {
      if (this.hasChildWindows()) this.childWindows = [];
      if (!this.isChildWindow) this.onScreenInit(screen);
    }
    if(!this.sharedService.getPlayMacroFlag()){
      // if ((GXUtils.ENABLETYPEAHEADFLAG) &&(screen?.screenId != this.screenHolderService.getPreviousScreen()?.screenId )) {
        if (GXUtils.ENABLETYPEAHEADFLAG){
        this.checkForTypeAheadChars();   // Getting the user input
        // Reading the typeAhead content
        let pageArray = GXUtils.getPageArray();
        if (pageArray.length > 0){
          let currentPage = pageArray.filter(page => !page.visited)[0];
          if (currentPage) {
            let typeAheadEntries = currentPage.inputs.filter(item => item.active);
            // Get the TypeAhead Fields currentPageInputFields2
            let inputFieldArray = this.getTypeAheadFields(screen);
            let typeaheadCount = 0;
            let inputfieldCount = 0;
            if ((inputFieldArray.length==0 && typeAheadEntries.length == 0) || 
                (inputFieldArray.length>0 && typeAheadEntries.length == 0)){
              // do nothing
            }else if ((typeAheadEntries.length >= inputFieldArray.length) && 
                    !(inputFieldArray.length==0 && typeAheadEntries.length > 0)) {
              while(typeaheadCount < typeAheadEntries.length){
                inputFieldArray[inputfieldCount].content = this.checkDataType(inputFieldArray[inputfieldCount].datatype, typeAheadEntries[typeaheadCount].value);
                typeAheadEntries[typeaheadCount].active = false;
                const input = new InputField();
                input.setName(inputFieldArray[inputfieldCount].name);
                input.setValue(inputFieldArray[inputfieldCount].content);
                this.navigationService.setSendableField(input);  
                typeaheadCount++;
                inputfieldCount++;
                if (inputfieldCount == inputFieldArray.length){
                  inputfieldCount = 0;
                }

              }
            }else if (inputFieldArray.length==0 && typeAheadEntries.length > 0){
              do{
                typeAheadEntries[typeaheadCount].active = false;
                typeaheadCount++;
              }while (typeaheadCount < typeAheadEntries.length)
            }else if(inputFieldArray.length>0 && typeAheadEntries.length>0 && 
                      typeAheadEntries.length < inputFieldArray.length) {
              do {
                while (typeaheadCount < typeAheadEntries.length) {
                        inputFieldArray[inputfieldCount].content = this.checkDataType(inputFieldArray[inputfieldCount].datatype, typeAheadEntries[typeaheadCount].value);
                        typeAheadEntries[typeaheadCount].active = false;
                        const input = new InputField();
                        input.setName(inputFieldArray[inputfieldCount].name);
                        input.setValue(inputFieldArray[inputfieldCount].content);
                        this.navigationService.setSendableField(input);
                        inputfieldCount++;
                        typeaheadCount++;
                    } 
                    inputfieldCount++;
                } while (inputfieldCount < inputFieldArray.length) 
            }
            currentPage.visited = true;
            this.getCursorLocation(screen, inputFieldArray, typeAheadEntries);
            if (currentPage.nextPage) {
              //console.log("Going to next page!!!!!!!!!!!!!!")
              this.screenLockerService.setShowScreenSpinner(false);
              currentPage.nextPage = false;
              this.navigationService.sendKeys('[enter]')
            } else if (!currentPage.nextPage && currentPage.funcKey) {
              //this.screenLockerService.setLocked(false);
              // this.screenLockerService.setScreenIdUpdated(true);
               this.screenLockerService.setShowScreenSpinner(false);
              // this.screenLockerService.setScreenSpinnerHandler(null);
              this.navigationService.sendKeys(currentPage.funcKey)
            }
          }
        }
      }else{
        if(this.navigationService.isScreenUpdated.value){
          this.navigationService.isScreenUpdated.next(true);
        }
      } 
     }
  }

  checkDataType(fieldDataType, data){
    let returnString = "";
    if (data) {
      for (let i = 0; i < data.length; i++) {
        if (fieldDataType == GXUtils.dataTypes.NUMERIC) {
          if ((/[0-9,.]/.test(data[i]))) {
            returnString += data[i]
          }
        }
        else if (fieldDataType == GXUtils.dataTypes.DIGITS_ONLY) {
          if ((/[0-9]/.test(data[i]))) {
            returnString += data[i]
          }
        }
        else if (fieldDataType == GXUtils.dataTypes.SIGNED_NUMERIC) {
          if ((/[0-9.,+-]/.test(data[i]))) {
            returnString += data[i]
          }
        }
        else if (fieldDataType == GXUtils.dataTypes.ALPHA_ONLY) {
          if ((/[a-zA-Z]/.test(data[i]))) {
            returnString += data[i]
          }
        }
        else {
          returnString = data;
        }
      }
    }
    return returnString
  }

  getCursorLocation(screen, inputFieldArray, typeAheadEntries){
      let typeAheadArrayLength = typeAheadEntries.length;
      let textboxArrayLength = inputFieldArray.length;
      let focusIndex = 0;
      if (textboxArrayLength>typeAheadArrayLength){
        focusIndex = GXUtils.getImplicitFlag()?typeAheadArrayLength-1:typeAheadArrayLength;
      }else if(textboxArrayLength==typeAheadArrayLength){
        focusIndex = GXUtils.getImplicitFlag()?typeAheadArrayLength-1:typeAheadArrayLength-textboxArrayLength;
      }else if (textboxArrayLength<typeAheadArrayLength){
        let totalFocusIndex = GXUtils.getImplicitFlag()?typeAheadArrayLength-1:typeAheadArrayLength;
        focusIndex = totalFocusIndex%textboxArrayLength;
      }
      if(textboxArrayLength>0){
        screen.cursor.fieldName = inputFieldArray[focusIndex].name;
        screen.cursor.position = inputFieldArray[focusIndex].position;
      }
  }

  private checkForTypeAheadChars(){
    let typeAheadCharsArray = GXUtils.getTypeAheadCharsArray();
    if (typeAheadCharsArray.length>0 ){
      let event = {};
      event["code"] = GXUtils.IMPLICITTAB;
      GXUtils.appendTypeAheadStringArray(event);
    }
    let typeAheadStringArray = GXUtils.getTypeAheadStringArray();
    if (typeAheadStringArray.length > 0){
      GXUtils.appendTypeAheadPageArray();  
    }
  }

  private getTypeAheadFields(screen){
    return screen.fields.filter(entry => {
      if(entry){
        return entry.protected == false ;
      }
    }); 
  }

  private redirectToRoute(screenName: string): void {
    if (this.screenHolderService.isCurrentScreenWindow()) {
      /**
       * This is a workaround, when getting to generated page window we should send
       * another getScreen request with the 'GX_VAR_HOST_WINDOW_ENABLED' baseObjectConstant
       * set to 'true'.
       */    
      const req = new GetScreenRequest();
      req.options.GX_VAR_HOST_WINDOW_ENABLED = 'true';
      this.screenService
       .getScreen(this.storageService.getAuthToken(), req)
       .subscribe(
         screen => this.screenHolderService.setRuntimeScreen(screen),
         error => this.logger.error(error),
         () => this.redirect(screenName));
    } else {
      this.redirect(screenName);
    }
  }

  private redirect(screenName: string): void {
    if (GXUtils.removeSlash(this.router.url) === screenName) {
      this.navigationService.redirectToSamePath(screenName);
    } else {
      this.router.navigate([screenName]);
    }
  }

  onScreenInit(screen: GetScreenResponse): void {
    screen = screen || this.screenHolderService.getRuntimeScreen();
    this.keyboardMappingService.clearJSKeyboardMappings();//JSKeyboardMapping have to be clean for each page.
    screen.transformations.forEach((transform) => {
      if (transform.type.startsWith('HostKey'))
        this.hostKeyTransforms.push(transform);
      else if (transform.type.startsWith('Table')) 
        this.screenProcessorService.processTable(screen.fields, screen.transformations || [], transform);
    });
    this.screenWidthArray = new Array(screen.screenSize.columns);
    this.storageService.setLanguage(screen.language);
    this.navigationService.setScreenId(screen.screenId);
    this.navigationService.setScreenSize(screen.screenSize);
    this.navigationService.setCursorPosition(screen.cursor);
    screen.fields = this.screenProcessorService.processRegionsToHide(screen.fields, screen.transformations);
    this.m_screen = screen;
    this.addOrRemoveBorder(this.m_screen);
    this.screenLockerService.setLocked(false);
    //Example of injecting keyboard mapping
    // this.keyboardMappingService.addKeyboardMapping(GXAdditionalKey.NONE, GXKeyCodes.F3, popup, true, cancel);
  }

  /**
   * Get Index of Screen Type
   */
  addOrRemoveBorder(m_screen: any) {
  let windowTitles = false;
  m_screen.windows?.forEach(win => {
    if(win?.title === 'ADDITIONAL OPTIONS' || win?.title === 'SECURITY NOTES' || win?.title === ' Help for SYSEXT Utility ') {
      windowTitles = true;
    }
  })

  m_screen?.fields.forEach((field: any, i: number) => {
    if(field?.isIntensified === true || field?.background === 'LightRed') {
      this.intensifiedScr = true;
    } else if(windowTitles) {
      this.intensifiedScr = false;
    }
  })
}

  /*
   * Find fields (like messageLine) which are out of child-window bounds. their position is in main screen.
   * Shift these fields to the main screen.
  */
   private shiftFieldsToMainWindow(screen: GetScreenResponse): void {
    const lastWindowIndex = screen.windows.length - 1;
    const windowBounds = screen.windows[lastWindowIndex].bounds;
    const mainScreenFields = new Map<string, number>();
    const currentWindowName = screen.name;
    this.m_screen.fields = this.m_screen.fields.filter(f => f);
    let currentScreenFields = screen.fields
    let prevScreenFields = this.m_screen.fields
    let prevScreenFieldsArray = [];
    let currentScreenFieldsArray = [];

    prevScreenFields.forEach((prevElement, index) => {
      if(prevElement){
          prevScreenFieldsArray.push({key:this.fieldToString(prevElement), value:prevElement.content, index: index})
      }
    });
    currentScreenFields.forEach((currentElement, index) => {
      currentScreenFieldsArray.push({key:this.fieldToString(currentElement), value:currentElement.content, index: index})
    });
    this.m_screen.fields.forEach((fld, i) => mainScreenFields.set(this.fieldToString(fld), i));

    // NEED TO FIX TABLE ITEMS POSITION AND MAYBE OTHER TRANSFORMATIONS
    screen.fields.forEach((field, i, fields) => {
      if (this.isFieldOutOfBounds(field, windowBounds)) {
            const index = mainScreenFields.get(this.fieldToString(field));
            if (!isNaN(index)) {
              this.m_screen.fields[index] = null;
              prevScreenFieldsArray.forEach((entry, prevIndex) =>{
                let selectedIndex = currentScreenFieldsArray.map(e => e.key).indexOf(entry.key);
                if ( selectedIndex == -1){
                  this.m_screen.fields[prevIndex] = null;
                }
              })
            }
            this.m_screen.fields.push(field);
            fields[i] = null;
      } else {
        const fld = fields[i];
        fld.positionInWindow = {row: fld.position.row - windowBounds.startRow + 1,  
                                column: fld.position.column - windowBounds.startCol + 1};
      }
    });
    if (currentWindowName != GXUtils.nationalityWin) {
          screen.transformations.forEach((transform) => {
            if(transform.position){    
                transform.position = {row: transform.position.row - windowBounds.startRow + 1, 
                                      column: transform.position.column - windowBounds.startCol +1};
            }  
            transform.regionsToHide?.forEach(region => {
              region.topLeft.row = 0;
              region.topLeft.column = 0;
              region.bottomRight.row = 0;
              region.bottomRight.column = 0;
              transform.regionsToHide.push(region);
        });
        });
}
   }
  
  private isFieldOutOfBounds(field: Field, bounds: ScreenBounds): boolean {
    return field.position.row < bounds.startRow || 
            field.position.row > bounds.endRow || 
            field.position.column < bounds.startCol ||  
           (field.position.column+field.length > bounds.endCol+1)
  }

  getChildWindows(): GetScreenResponse[] {
    if (!this.childWindows) {
      this.childWindows = [];
    }
    return this.childWindows;
  }

  hasChildWindows(): boolean {
    return (this.childWindows && this.childWindows.length > 0);
  }
  
  get titlePosition() {
    const template = {
      'grid-row': '1 / 1', 
    }
    template['grid-column-start'] = Math.round(this.m_screen.windows[this.index].bounds.cols/2 - this.m_screen.windows[this.index].title.length/2);
    template['grid-column-end'] = Math.round(this.m_screen.windows[this.index].bounds.cols/2 - this.m_screen.windows[this.index].title.length/2 + this.m_screen.windows[this.index].title.length);
    return template;
  }

  public set screen(screen: GetScreenResponse) {
    if (screen == null || screen == undefined) {
      console.error(`Cannot set screen value of ${screen}`);
      return;
    }
    this.m_screen = screen;
  }

  private fieldToString(fld: Field): string {
    return fld.position.row + ',' + fld.position.column
  }

  ngOnDestroy(): void {
    if (this.getScreenSubscription) {
      this.getScreenSubscription.unsubscribe();
    }
    if (this.isScreenUpdatedSubscription) {
      this.isScreenUpdatedSubscription.unsubscribe();
    }
    if (this.screenObjectUpdatedSubscription) {
      this.screenObjectUpdatedSubscription.unsubscribe();
    }

    if (this.gridChangedSubscription) {
      this.gridChangedSubscription.unsubscribe();
    }
    if (this.navigationService.getScreenId()) {
      clearInterval(this.navigationService.getScreenId())
    }
    if (!this.isChildWindow) this.hostKeysEmitter.emit(null);
  }

}
