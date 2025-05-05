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
import { HttpHeaders } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { Language } from '@ibm/applinx-rest-apis';
import { MessagesService } from './messages.service';
import { ScreenHolderService } from './screen-holder.service';

// A service which is perpose is to store basic information that should be accessible across the entire application.
@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private language: Language;
  public static injector: Injector;

  constructor(private screenHolderService: ScreenHolderService,
              private logger: NGXLogger, private router: Router, private messages: MessagesService) {
                sessionStorage.clear();
              }

  isConnected(): boolean {
    if (sessionStorage.getItem('gx_token')) {
      return true;
    }
    return false;
  }
  setConnected(authToken: string): void {
    sessionStorage.setItem('gx_token', authToken);
    this.logger.setCustomHttpHeaders(
      new HttpHeaders({ "Authorization": this.getAuthToken() })
    );
    this.router.navigate(['instant']);
  }
  setNotConnected(): void {
    this.logger.debug(this.messages.get("SESSION_DISCONNECTED"));
    sessionStorage.removeItem('gx_token');
    this.screenHolderService.setRuntimeScreen(null);
    this.router.navigate(['webLogin']);
  }
  getAuthToken(): string {
    return 'Bearer ' + sessionStorage.getItem('gx_token');
  }
  setLanguage(lang: Language): void {
    this.language = lang;
  }
  getLanguage(): Language {
    return this.language;
  }
}
