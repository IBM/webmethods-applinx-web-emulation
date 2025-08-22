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
import {Component, Input, OnInit} from '@angular/core';
import { ClickableTransformation, SendKeysEvent, UrlEvent } from '@ibm/applinx-rest-apis';

import {NavigationService} from '../../../services/navigation/navigation.service';

@Component({
    selector: 'app-clickable',
    templateUrl: './clickable.component.html',
    styleUrls: ['./clickable.component.scss'],
    standalone: false
})
export class ClickableComponent implements OnInit {

  @Input() transform: ClickableTransformation;

  constructor(private navigationService: NavigationService) { }

  ngOnInit(): void {
    
  }

  onClick(): void {
    if (this.transform.clickEvent.type === 'SendKeysEvent'){
      const sendKeysEvent = this.transform.clickEvent as SendKeysEvent;
      this.navigationService.sendKeys(sendKeysEvent.actionKey);
    } else if (this.transform.clickEvent.type === 'UrlEvent') {
      const urlEvent = this.transform.clickEvent as UrlEvent;
      window.location.href = urlEvent.targetUrl;
    }
  }
}
