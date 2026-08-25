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

import { Component } from '@angular/core';
import { LoginScreen } from './loginscreen.model';
import { GXGeneratedPage } from '../GXGeneratedPage';
import { NavigationService } from '../../services/navigation/navigation.service';

/**
 * Generated screen component for ApplinxBankOfZ — LoginScreen.
 *
 * Description: Mainframe login screen with system details and login options.
 * The only UNPROTECTED field is `menuOption`; the user selects the target
 * application and presses Connect, which sends [enter] with menuOption=CICSTS63.
 */
@Component({
  selector: 'gx-loginscreen',
  templateUrl: './loginscreen.component.html',
  styleUrls: ['./loginscreen.component.scss'],
  standalone: false
})
export class LoginScreenComponent extends GXGeneratedPage {

  /** Selected application option value — defaults to CICS Banking */
  selectedApp = 'CICSTS63';

  /** Available application options for the dropdown */
  readonly appOptions = [
    { content: 'CICS Banking (CICSTS63)', value: 'CICSTS63' },
    { content: 'TSO', value: 'TSO' },
    { content: 'IMS (IMS15APL)', value: 'IMS15APL' },
    { content: 'CNM01', value: 'CNM01' },
  ];

  constructor(private navigationService: NavigationService) {
    super(LoginScreen);
  }

  /** Read a named field's content from the merged generated page at runtime */
  private getFieldContent(name: string): string {
    const field = (this.generatedPage?.fields as any[])?.find((f: any) => f.name === name);
    return field?.content ?? '';
  }

  /** Live system time from the host (PROTECTED) */
  get currentTime(): string {
    return this.getFieldContent('currentTime');
  }

  /** Called by the Carbon dropdown when the user picks an application */
  onAppSelected(event: { item: { content: string; value: string } }): void {
    this.selectedApp = event.item.value;
    this.navigationService.fillInput('menuOption', event.item.value);
  }

  /** Submit: send [enter] to navigate to the selected application */
  onSubmit(): void {
    document.getElementById('enter')?.click();
  }
}
