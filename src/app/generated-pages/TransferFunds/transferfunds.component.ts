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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { skip } from 'rxjs/operators';
import { TransferFunds } from './transferfunds.model';
import { GXGeneratedPage } from '../GXGeneratedPage';
import { NavigationService } from '../../services/navigation/navigation.service';
import { GetScreenResponse, InputField, Cursor, Position } from '@ibm/applinx-rest-apis';
import type { Subscription } from 'rxjs';
import { TransferFundsStateService } from './transferfunds-state.service';

/**
 * Combined generated component for ApplinxBankOfZ — TransferFunds multi-hop flow.
 *
 * The UI should render only on the TransferFunds route, but it still automates
 * temporary hops through BankingMainMenu and DisplayAccount behind the scenes.
 */
@Component({
  selector: 'gx-transferfunds',
  templateUrl: './transferfunds.component.html',
  styleUrls: ['./transferfunds.component.scss'],
  standalone: false
})
export class TransferFundsComponent extends GXGeneratedPage implements OnInit, OnDestroy {

  private screenSub: Subscription;

  constructor(
    public  navigationService: NavigationService,
    public  st: TransferFundsStateService
  ) {
    super(TransferFunds);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  override ngOnInit(): void {
    super.ngOnInit();

    this.screenSub = this.navigationService.screenObjectUpdated.subscribe(
      (screen: GetScreenResponse) => {
        if (!screen) return;
        const name = (screen as any).name ?? '';
        if (this.st.currentHop === 1 && name === 'BankingMainMenu') {
          this.populateDisplayAccount(screen.screenId ?? 0);
        }
        if (this.st.currentHop === 3 && name === 'BankingMainMenu') {
          this.populateTransferFunds(screen.screenId ?? 0);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.screenSub?.unsubscribe();
  }

  // ── Phase 1 — Balance Check ───────────────────────────────────────────────────

  onCheckBalance(): void {
    if (!this.st.sourceAccount.trim()) return;
    this.st.isLoading      = true;
    this.st.hostError      = '';
    this.st.balanceChecked = false;
    this.st.currentHop     = 1;
    this.populateDisplayAccount(this.navigationService.getScreenId());
  }

  private populateDisplayAccount(screenId: number): void {
    const opt = new InputField();
    opt.name  = 'actionOption';
    opt.value = '2';

    const acct = new InputField();
    acct.name  = 'accountNumber';
    acct.value = this.st.sourceAccount.trim();

    setTimeout(() => {
      this.navigationService.setScreenId(screenId);
      this.navigationService.setSendableField(opt);
      this.st.currentHop = 2;
      this.navigationService.sendKeysInternal('[enter]');

      const displayAccountSub = this.navigationService.screenObjectUpdated.pipe(skip(2)).subscribe((_screen: GetScreenResponse) => {
        displayAccountSub.unsubscribe();
        this.navigationService.getHostScreenNumber().subscribe((resp) => {
          this.navigationService.setScreenId(resp.screenNumber);
          this.navigationService.setSendableField(acct);

          const balanceSub = this.navigationService.screenObjectUpdated.pipe(skip(2)).subscribe((screen: GetScreenResponse) => {
            balanceSub.unsubscribe();
            if (!screen) return;
            this.readBalance(screen);
          });

          this.navigationService.sendKeysInternal('[enter]');
        });
      });
    }, 0);
  }

  // Hop 3 response: read balance from the DisplayAccount (populated) response.
  // Called from screenObjectUpdated subscription (not ngOnInit) because the
  // route does NOT change — same DisplayAccount screen with data filled in.
  private readBalance(screen: GetScreenResponse): void {
    this.st.currentHop = 0;
    this.st.isLoading  = false;

    const err = this.readField(screen, 'errorMessage');
    const hasBalanceData = !!this.readField(screen, 'availableBalance') || !!this.readField(screen, 'actualBalance');
    if (err && !hasBalanceData) {
      this.st.hostError = err;
      return;
    }

    this.st.availableBalance = this.readField(screen, 'availableBalance');
    this.st.actualBalance    = this.readField(screen, 'actualBalance');
    this.st.overdraftLimit   = this.readField(screen, 'overdraftLimit');
    this.st.balanceChecked   = true;
  }

  // ── Phase 2 — Transfer ────────────────────────────────────────────────────────

  onTransfer(): void {
    if (!this.canTransfer) return;
    this.st.isLoading  = true;
    this.st.hostError  = '';
    this.st.currentHop = 3;
    this.navigationService.tearDown();
    this.safeSend('[pf3]');
  }

  private populateTransferFunds(screenId: number): void {
    const opt = new InputField();
    opt.name  = 'actionOption';
    opt.value = '7';

    const fromAcct = new InputField();
    fromAcct.name  = 'fromAccountNumber';
    fromAcct.value = this.st.sourceAccount.trim();

    const toAcct = new InputField();
    toAcct.name  = 'toAccountNumber';
    toAcct.value = this.st.toAccount.trim();

    const amount = new InputField();
    amount.name  = 'transactionAmount';
    amount.value = this.st.amountInput.trim();

    setTimeout(() => {
      this.navigationService.setScreenId(screenId);
      this.navigationService.setSendableField(opt);

      const transferSub = this.navigationService.screenObjectUpdated.pipe(skip(2)).subscribe((_screen: GetScreenResponse) => {
        transferSub.unsubscribe();
        this.navigationService.getHostScreenNumber().subscribe((resp) => {
          this.navigationService.setScreenId(resp.screenNumber);
          this.navigationService.setSendableField(fromAcct);
          this.navigationService.setSendableField(toAcct);
          this.navigationService.setSendableField(amount);

          const resultSub = this.navigationService.screenObjectUpdated.pipe(skip(2)).subscribe((screen: GetScreenResponse) => {
            resultSub.unsubscribe();
            if (screen) {
              this.readTransferResult(screen);
            }
          });

          this.navigationService.sendKeysInternal('[enter]');
        });
      });

      this.navigationService.sendKeysInternal('[enter]');
    }, 0);
  }

  // Hop 6 response: read transfer result.
  // Called from screenObjectUpdated (same TransferFunds route with result data).
  private readTransferResult(screen: GetScreenResponse): void {
    this.st.currentHop = 0;
    this.st.isLoading  = false;

    const err = this.readField(screen, 'errorMessage');
    if (err) {
      this.st.hostError = err;
      return;
    }

    this.st.postTransferFromBalance = this.readField(screen, 'availableBalance');
    this.st.postTransferToBalance   = this.readField(screen, 'availableBalance_1');
    this.st.transferComplete        = true;
  }

  // ── UI navigation ─────────────────────────────────────────────────────────────

  onBack(): void {
    this.st.currentStep      = 0;
    this.st.balanceChecked   = false;
    this.st.availableBalance = '';
    this.st.actualBalance    = '';
    this.st.overdraftLimit   = '';
    this.st.toAccount        = '';
    this.st.amountInput      = '';
    this.st.hostError        = '';
    this.st.transferComplete = false;
  }

  onStartNewTransfer(): void {
    this.st.fullReset();
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  /**
   * Reset cursor to a safe host position before every programmatic send.
   * The global @HostListener('focusin') in app.component.ts sets the cursor
   * to whatever <input> the user last clicked, including invalid ids like
   * "cds-label-0" at row:0/col:0. Resetting to row:1/col:1 prevents session errors.
   */
  private safeSend(key: string): void {
    const safeCursor = new Cursor(new Position(1, 1));
    this.navigationService.setCursorPosition(safeCursor);
    this.navigationService.sendKeysInternal(key);
  }

  /**
   * Read a named field's content from a live sendKeys response.
   * The response fields carry a 'content' property with the actual host data.
   */
  private readField(screen: GetScreenResponse, name: string): string {
    const field = (screen as any).fields?.find((f: any) => f.name === name);
    return (field?.content ?? '').trim();
  }

  private parseBalance(raw: string): number {
    if (!raw || !raw.trim()) return 0;
    return parseFloat(raw.replace(/[^0-9.\-]/g, '')) || 0;
  }

  // ── Computed ──────────────────────────────────────────────────────────────────

  get availableBalanceValue(): number { return this.parseBalance(this.st.availableBalance); }
  get parsedAmount(): number          { return this.parseBalance(this.st.amountInput); }

  get amountExceedsBalance(): boolean {
    // Only warn when we actually have a balance value AND an amount entered.
    return this.st.balanceChecked
      && !!this.st.availableBalance
      && this.parsedAmount > 0
      && this.parsedAmount > this.availableBalanceValue;
  }

  get canTransfer(): boolean {
    return this.st.balanceChecked
      && !!this.st.availableBalance
      && this.st.toAccount.trim().length > 0
      && this.parsedAmount > 0
      && !this.amountExceedsBalance;
  }
}
