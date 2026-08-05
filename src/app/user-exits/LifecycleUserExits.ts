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
import { CreateSessionResponse, CreateSessionRequest, GetScreenRequest, SendKeysRequest, GetScreenResponse } from '@ibm/applinx-rest-apis';
//import { GXAdditionalKey, GXKeyCodes } from '../services/enum.service';
import { AbstractUserExits } from './AbstractUserExits';

export class LifecycleUserExits extends AbstractUserExits {
        
    preConnect(createSessionRequest: CreateSessionRequest) {
        // VULN-005: authHeader parameter removed.
        super.preConnect(createSessionRequest);
    }
    postConnect(createSessionRespose: CreateSessionResponse) {
        super.postConnect(createSessionRespose);
    }
    onConnectError(errorResponse: HttpErrorResponse) {
        super.onConnectError(errorResponse);
    }

    preGetScreen(getScreenRequest: GetScreenRequest) {
        super.preGetScreen(getScreenRequest);
    }
    postGetScreen(getScreenResponse: GetScreenResponse) {
        super.postGetScreen(getScreenResponse);
    }
    onGetScreenError(errorResponse: HttpErrorResponse) {
        super.onGetScreenError(errorResponse);
    }

    preSendKey(sendKeysRequest: SendKeysRequest) {
        super.preSendKey(sendKeysRequest);
    }
    postSendKey(sendKeysResponse: any) {
        super.postSendKey(sendKeysResponse);
    }
    onSendKeyError(errorResponse: HttpErrorResponse) {
        super.onSendKeyError(errorResponse);
    }

    preDisconnect() {
        super.preDisconnect();
    }
    postDisconnect(disconnectSessionRespose: CreateSessionResponse) {
        super.postDisconnect(disconnectSessionRespose);
    }
    onDisconnectError(errorResponse: HttpErrorResponse) {
        super.onDisconnectError(errorResponse);
    }

    afterViewInit() {
        super.afterViewInit();
        // Set content to unprotected field.     
        //this.getNavigationService().fillInput('<id>', '<value>');

        // Add KeyboardMapping.
         //this.addKeyboardMapping(GXAdditionalKey.NONE, GXKeyCodes.F4, () => alert(`Hello world`), true);
    }
}