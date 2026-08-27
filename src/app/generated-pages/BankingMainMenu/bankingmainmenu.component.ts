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
import { Router } from '@angular/router';
import { BankingMainMenu } from './bankingmainmenu.model';
import { GXGeneratedPage } from '../GXGeneratedPage';
import { NavigationService } from '../../services/navigation/navigation.service';
import { InputField, GetScreenResponse } from '@ibm/applinx-rest-apis';
import { StorageService } from '../../services/storage.service';
import { ScreenHolderService } from '../../services/screen-holder.service';

@Component({
  selector: 'gx-bankingmainmenu',
  templateUrl: './bankingmainmenu.component.html',
  styleUrls: ['./bankingmainmenu.component.scss'],
  standalone: false
})
export class BankingMainMenuComponent extends GXGeneratedPage {
  constructor(
    private router: Router,
    private navigationService: NavigationService
  ) {
    super(BankingMainMenu);
  }

  get screen(): GetScreenResponse | null {
    return StorageService.injector.get(ScreenHolderService).getRuntimeScreen();
  }

  onOpenCombinedFlow(): void {
    const opt = new InputField();
    opt.name = 'actionOption';
    opt.value = '2';
    this.navigationService.setSendableField(opt);
    document.getElementById('enter')?.click();
    this.router.navigate(['TransferFunds']);
  }
}
