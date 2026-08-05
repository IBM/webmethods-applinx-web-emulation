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
import { Observable } from 'rxjs';
import { UserExitsEventThrowerService } from '../services/user-exits-event-thrower.service';
import { ConfigurationService } from './configuration.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { MessagesService } from './messages.service';
import { SessionService, CreateSessionResponse, CreateSessionRequest } from '@ibm/applinx-rest-apis';
@Injectable({
  providedIn: 'root'
})
export class OAuth2HandlerService {

  private isRedirect = false;

  constructor(private userExitsEventThrower: UserExitsEventThrowerService,
    private sessionService: SessionService, 
    private configurationService: ConfigurationService, private logger: NGXLogger, private messages: MessagesService) { }

  /**
   * Get idP login link from ApplinX REST API
   * Navigate to this login page
   */
  redirectToIDPLoginPage(): void {
    // VULN-003: generate and store a cryptographic state parameter before the IdP redirect.
    // Validated in canActivate() before the OIDC code is accepted.
    const state = crypto.randomUUID();
    sessionStorage.setItem('oidc_state', state);

    this.sessionService.connect().subscribe((res: CreateSessionResponse) => {
      this.isRedirect = true;
      this.logger.debug(this.messages.get("REDIRECTING_TO_3RD_OPENID_CONNECT_PROVIDER"));

      // VULN-007: validate the redirect URI before navigation.
      // Only allow https:// URIs — reject any other scheme or malformed URL.
      let redirectUri: string;
      try {
        const parsed = new URL(res.redirectUri);
        if (parsed.protocol !== 'https:') {
          throw new Error('Redirect URI must use https:');
        }
        redirectUri = parsed.href;
      } catch (e) {
        this.logger.error('Blocked unsafe redirectUri from ApplinX server: ' + res.redirectUri);
        this.userExitsEventThrower.fireOnConnectError(new HttpErrorResponse({ error: e }));
        sessionStorage.removeItem('oidc_state');
        return;
      }

      // Append state to IdP URL for CSRF validation on callback (VULN-003).
      const separator = redirectUri.includes('?') ? '&' : '?';
      window.location.href = redirectUri + separator + 'state=' + encodeURIComponent(state);
    }, (errorResponse: HttpErrorResponse) => {
      this.logger.error(this.messages.get("COULDNT_GET_REDIRCT)URI_FROM_REST_API"));
      sessionStorage.removeItem('oidc_state');
      this.userExitsEventThrower.fireOnConnectError(errorResponse);
    });
  }

  /**
   * Send code to ApplinX REST API session resource in order to connect a session.
   * @param code - Part of OpenIDConnect 'authorization code flow' protocol.
   *  This is a single use only code that obtained from idP (id-provider, vendor) 
   *  and sends to ApplinX REST API in order to connect a session.
   */
  sendCodeAndConnectSession(code: string, appName?: string, connPool?: string): Observable<CreateSessionResponse> {
    this.isRedirect = false;
    // VULN-009: do NOT persist the OIDC authorization code in sessionStorage.
    // The code is single-use and only needed as a local variable for the exchange call below.
    // Storing it in sessionStorage keeps a stale artifact accessible to any XSS running in the tab.
    
    const conf = this.configurationService
    const createSessionRequest = new CreateSessionRequest(conf.applicationName || appName, conf.connectionPool || connPool);
    createSessionRequest.sessionDescription = 'REST API Session via OpenIDConnect';
    if (this.configurationService.sessionOptions) {
      createSessionRequest.options = Object.assign(createSessionRequest.options, this.configurationService.sessionOptions);
    }

    // VULN-005: firePreConnect no longer accepts authHeader — credential not passed to user exits.
    this.userExitsEventThrower.firePreConnect(createSessionRequest);
    return this.sessionService.connect(createSessionRequest);
  }

  get isRedirectToIDP() {
    return this.isRedirect;
  }
}
