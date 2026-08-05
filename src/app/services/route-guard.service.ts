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
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { Observable, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { GXUtils } from 'src/utils/GXUtils';
import { CreateSessionResponse } from '@ibm/applinx-rest-apis';
import { ConfigurationService } from './configuration.service';
import { KeyboardMappingService } from './keyboard-mapping.service';
import { MessagesService } from './messages.service';
import { OAuth2HandlerService } from './oauth2-handler.service';
import { ScreenHolderService } from './screen-holder.service';
import { StorageService } from './storage.service';
import { UserExitsEventThrowerService } from './user-exits-event-thrower.service';
@Injectable({
  providedIn: 'root'
})
export class RouteGuardService  {

  constructor(private router: Router, private storageService: StorageService, 
    private screenHolderService: ScreenHolderService,
    private oAuth2handler: OAuth2HandlerService,
    private configurationService: ConfigurationService,
    private keyboardMappingService: KeyboardMappingService,
    private userExitsEventThrower: UserExitsEventThrowerService, private logger: NGXLogger, private messages: MessagesService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): 
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const isLoggedIn = this.storageService.isConnected();
    const screenName = this.screenHolderService.getRuntimeScreenName();
    const url = GXUtils.removeSlash(state.url);
    const idPcode = route.queryParams.code; // OpenIDConnect auth code.
    if (isLoggedIn && (url === 'instant' || url === screenName)) {
      return true;
    } else if (idPcode) {
      // VULN-003: validate OIDC state parameter to prevent CSRF authorization code injection.
      const receivedState = route.queryParams.state;
      const storedState = sessionStorage.getItem('oidc_state');
      sessionStorage.removeItem('oidc_state'); // consume state — single use
      if (!receivedState || !storedState || receivedState !== storedState) {
        this.logger.error('OIDC state mismatch — possible CSRF attack. Aborting code exchange.');
        this.router.navigate(['webLogin']);
        return false;
      }

      if (url === 'webLogin') {
        this.router.navigate(['instant', { queryParams: route.queryParams }]);
        return true;
      }
      return this.configurationService.getConfigObservable()
      .pipe(
        mergeMap((config) => {
          return this.oAuth2handler.sendCodeAndConnectSession(idPcode, config.applicationName, config.connectionPool).pipe(
            catchError((err) => {
              this.logger.error(this.messages.get("ERROR_WHEN_SENDING_OATH@_CODE_TO_APX_REST_API"));
              this.userExitsEventThrower.fireOnConnectError(err);
              return of(false);
            }),
            map((res: CreateSessionResponse) => {
              this.logger.debug(this.messages.get("SESSION_CONNECTED_SUCCESSFULLY_VIA_OPENID_CONNECT"));
              this.storageService.setConnected(res.token); 
              this.keyboardMappingService.initMapping(res.keyboardMapping);
              this.userExitsEventThrower.firePostConnect(res);                
              return true;
            })
          );
        })
      )
    } else if (url === 'webLogin' && !idPcode) {
      return true;
    } else {
      this.router.navigate(['webLogin']);
      return false; 
    }
  }
  
}