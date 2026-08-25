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

/**
 * Survives Angular route changes within the TransferFunds multi-hop flow.
 * Because TransferFundsComponent is mapped to three routes (TransferFunds,
 * BankingMainMenu, DisplayAccount), Angular destroys and recreates the
 * component on each hop. This service holds the state across those
 * recreations so the UI does not reset mid-flow.
 */
@Injectable({ providedIn: 'root' })
export class TransferFundsStateService {
  // Phase control
  currentStep    = 0;
  isLoading      = false;
  hostError      = '';
  transferComplete = false;
  balanceChecked = false;

  // Which hop we are currently executing (drives screenSub logic)
  // 0 = idle, 1 = going to BankingMainMenu (check balance), 2 = going to DisplayAccount,
  // 3 = reading balance, 4 = going to BankingMainMenu (transfer), 5 = going to TransferFunds,
  // 6 = submitting transfer
  currentHop = 0;

  // Phase 1 fields
  sourceAccount    = '';
  availableBalance = '';
  actualBalance    = '';
  overdraftLimit   = '';

  // Phase 2 fields
  toAccount    = '';
  amountInput  = '';
  postTransferFromBalance = '';
  postTransferToBalance   = '';

  reset(): void {
    this.currentStep         = 0;
    this.isLoading           = false;
    this.hostError           = '';
    this.transferComplete    = false;
    this.balanceChecked      = false;
    this.currentHop          = 0;
    this.availableBalance    = '';
    this.actualBalance       = '';
    this.overdraftLimit      = '';
    this.toAccount           = '';
    this.amountInput         = '';
    this.postTransferFromBalance = '';
    this.postTransferToBalance   = '';
  }

  fullReset(): void {
    this.sourceAccount = '';
    this.reset();
  }
}
