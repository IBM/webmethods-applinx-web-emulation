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
import { HttpErrorResponse } from "@angular/common/http";
import { GetScreenRequest, GetScreenResponse, CreateSessionRequest, SendKeysRequest, CreateSessionResponse } from "@ibm/applinx-rest-apis";

export interface IUserExits {
    
    /**
     * Occurs before and after connecting a session with host through LoginComponent.onConnect()
     */
    /**
     * NOTE (VULN-005): the authHeader parameter has been removed from preConnect().
     * Passing plaintext-equivalent Basic auth credentials (base64 username:password) to all
     * registered user-exit implementations is a credential exposure risk. User exits that
     * need connection context should use createSessionRequest fields (applicationName, etc.)
     * only — never the raw auth credential.
     */
    preConnect(createSessionRequest: CreateSessionRequest);
    postConnect(createSessionRespose: CreateSessionResponse);
    onConnectError(errorResponse: HttpErrorResponse);

    /**
     * Occurs before and after getting host screen through ScreenComponent.getScreen()
     */
    preGetScreen(getScreenRequest: GetScreenRequest);
    postGetScreen(GetScreenResponse: GetScreenResponse);
    onGetScreenError(errorResponse: HttpErrorResponse);

    /**
     * Occurs before and after updating host screen through NavigationService.sendKeys(sendKey: string)
     */
    preSendKey(sendKeysRequest: SendKeysRequest);
    postSendKey(sendKeysResponse: any);
    onSendKeyError(errorResponse: HttpErrorResponse);
    
    /**
     * Occurs before and after disconnecting a session with host.
     */
    preDisconnect();
    postDisconnect(disconnectSessionRespose: CreateSessionResponse);
    onDisconnectError(errorResponse: HttpErrorResponse);
      
    /**
     * Occurs after screen fully initialized in the DOM.
     */
    afterViewInit();
}