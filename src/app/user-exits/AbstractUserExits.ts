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
import { NGXLogger } from 'ngx-logger';
import { InfoService } from '@ibm/applinx-rest-apis'
import { CreateSessionRequest, CreateSessionResponse, GetScreenRequest, SendKeysRequest, GetScreenResponse } from '@ibm/applinx-rest-apis';
import { KeyboardMappingService } from 'src/app/services/keyboard-mapping.service';
import { NavigationService } from 'src/app/services/navigation/navigation.service';
import { StorageService } from 'src/app/services/storage.service';
import { IUserExits } from './IUserExits';
import { StatusCodes } from 'http-status-codes';

export abstract class AbstractUserExits implements IUserExits {

    

    constructor(
				private infoService: InfoService,
				private navigationService: NavigationService,
				private storageService: StorageService,
				private keyboardMappingService: KeyboardMappingService,
				private logger: NGXLogger ) {
    }

    preConnect(createSessionRequest: CreateSessionRequest) {
        // VULN-005: authHeader parameter removed — credentials must not be distributed to user exits.
        // empty impl. to allow overriding specific methods
    }
    postConnect(createSessionRespose: CreateSessionResponse) {
        // empty impl. to allow overriding specific methods
    }
    onConnectError(errorResponse: HttpErrorResponse) {
        this.logger.error(errorResponse);
    }

    preGetScreen(getScreenRequest: GetScreenRequest) {
        // empty impl. to allow overriding specific methods
    }
    postGetScreen(GetScreenResponse: GetScreenResponse) {
        // empty impl. to allow overriding specific methods
    }
    onGetScreenError(errorResponse: HttpErrorResponse) {
        this.logger.error(errorResponse);
        if (errorResponse.status === StatusCodes.GONE) {
            this.storageService.setNotConnected();
        }
    }

    preSendKey(sendKeysRequest: SendKeysRequest) {
        // empty impl. to allow overriding specific methods
    }
    postSendKey(sendKeysResponse: any) {
        // empty impl. to allow overriding specific methods
    }
    onSendKeyError(errorResponse: HttpErrorResponse) {
        // handle screen id mismatch if occured.
        this.navigationService.handleScreenIdMismatch(errorResponse);
        if (errorResponse.status === StatusCodes.GONE) {
            this.storageService.setNotConnected();
        }
    }

    preDisconnect() {
        // empty impl. to allow overriding specific methods
    }
    postDisconnect(disconnectSessionRespose: CreateSessionResponse) {
        // empty impl. to allow overriding specific methods
    }
    onDisconnectError(errorResponse: HttpErrorResponse) {
        this.logger.error(errorResponse);
    }

    afterViewInit() {
        // empty impl. to allow overriding specific methods
    }

    protected addKeyboardMapping(additionalKey: string, keyCode: string, functionElement: any, overrideExisting: boolean, cancelMapFunction?: any) {
        this.keyboardMappingService.addKeyboardMapping(additionalKey, keyCode, functionElement, overrideExisting, cancelMapFunction);
    }


    getInfoService():InfoService {
        return this.infoService;
    }

    getNavigationService (): NavigationService{
        return this.navigationService;
    }

    getStorageService ():StorageService {
        return this.storageService;
    }

    getKeyboardMappingService ():KeyboardMappingService{
        return this.keyboardMappingService;
    }

    getLogger ():NGXLogger {
        return this.logger;
    }
   
}