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
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core'; 
import { CreateSessionRequest, CreateSessionResponse, GetScreenRequest, GetScreenResponse, SendKeysRequest } from '@ibm/applinx-rest-apis';
import { IUserExits } from '../user-exits/IUserExits';

@Injectable({
  providedIn: 'root'
})
export class UserExitsEventThrowerService {
  
  private _userExitsList: IUserExits[] = [];

  public clearEventListeners(): void {
    this._userExitsList = [];
  }

  public addEventListener(userExits: IUserExits) {
    this.userExitsList.push(userExits);
  }

  public get userExitsList(): IUserExits[] {
    return this._userExitsList ?? [];
  }

  public firePreConnect(createSessionRequest: CreateSessionRequest) {
    // VULN-005: authHeader parameter removed — do not pass credentials to user-exit implementations.
    this.userExitsList.forEach(u => u.preConnect(createSessionRequest));
  }
  public firePostConnect(createSessionResponse: CreateSessionResponse) {
    this.userExitsList.forEach(u => u.postConnect(createSessionResponse));
  }
  public fireOnConnectError(errorResponse: HttpErrorResponse) {
    this.userExitsList.forEach(u => u.onConnectError(errorResponse));
  }

  public firePreGetScreen(getScreenRequest: GetScreenRequest) {
    this.userExitsList.forEach(u => u.preGetScreen(getScreenRequest));
  }
  public firePostGetScreen(getScreenResponse: GetScreenResponse) {
    this.userExitsList.forEach(u => u.postGetScreen(getScreenResponse));
  }
  public fireOnGetScreenError(errorResponse: HttpErrorResponse) {
    this.userExitsList.forEach(u => u.onGetScreenError(errorResponse));
  }

  public firePreSendKey(sendKeysRequest: SendKeysRequest) {
    this.userExitsList.forEach(u => u.preSendKey(sendKeysRequest))
  }
  public firePostSendKey(sendKeysResponse: any) {
    this.userExitsList.forEach(u => u.postSendKey(sendKeysResponse));
  }
  public fireOnSendKeyError(errorResponse: HttpErrorResponse) {
    this.userExitsList.forEach(u => u.onSendKeyError(errorResponse));
  }

  public firePreDisconnect() {
    this.userExitsList.forEach(u => u.preDisconnect());
  }
  public firePostDisconnect(disconnectSessionResponse: any) {
    this.userExitsList.forEach(u => u.postDisconnect(disconnectSessionResponse));
  }
  public fireOnDisconnectError(errorResponse: HttpErrorResponse) {
    this.userExitsList.forEach(u => u.onDisconnectError(errorResponse));
  }

  public fireAfterViewInit() {
    setTimeout(() => this.userExitsList.forEach(u => u.afterViewInit()))
  }
}
