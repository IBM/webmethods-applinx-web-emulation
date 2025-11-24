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

import { mount } from 'cypress/angular';
import { of, BehaviorSubject } from 'rxjs';
import { ScreenComponent } from './screen.component';
import { ScreenService, GetScreenResponse, InfoService } from '@ibm/applinx-rest-apis';
import { NavigationService } from '../services/navigation/navigation.service';
import { ScreenHolderService } from '../services/screen-holder.service';
import { UserExitsEventThrowerService } from '../services/user-exits-event-thrower.service';
import { ScreenProcessorService } from '../services/screen-processor.service';
import { ScreenLockerService } from '../services/screen-locker.service';
import { KeyboardMappingService } from '../services/keyboard-mapping.service';
import { NGXLogger } from 'ngx-logger';
import { MessagesService } from '../services/messages.service';
import { SharedService } from '../services/shared.service';

describe('ScreenComponent', () => {
  let componentRef: ScreenComponent;
  let screenService: any;
  let navigationService: any;
  let screenHolderService: any;
  let userExitsEventThrower: any;
  let screenProcessorService: any;
  let screenLockerService: any;
  let keyboardMappingService: any;
  let messages: any;
  let sharedService: any;
  let logger: any;
  let infoService: any;
  let screenObjectUpdated$: BehaviorSubject<GetScreenResponse | null>;
  let isScreenUpdated$: BehaviorSubject<boolean>;

  beforeEach(() => {
    isScreenUpdated$ = new BehaviorSubject<boolean>(true);
    screenObjectUpdated$ = new BehaviorSubject<GetScreenResponse | null>(null);
    sharedService = {};
    logger = {};
    screenService = {
      getScreen: cy.stub().as('getScreen').returns(of({}))
    };
    screenLockerService = { 
      setLocked: cy.spy().as('setLocked') 
    };
    keyboardMappingService = { 
      clearJSKeyboardMappings: cy.spy().as('clearJSKeyboardMappings') 
    };
    messages = { 
      get: cy.stub().as('messagesGet').returns('') 
    };
    infoService = { 
      setLanguage: cy.spy().as('setLanguage')
    };
    navigationService = {
      isScreenUpdated: isScreenUpdated$,
      screenObjectUpdated: screenObjectUpdated$,
      setScreenSize: cy.spy().as('setScreenSize'),
      setScreenId: cy.spy().as('setScreenId'),
      setCursorPosition: cy.spy().as('setCursorPosition'),
      setSendableField: cy.spy().as('setSendableField'),
    };
    screenHolderService = {
      getRuntimeScreen: cy.stub().as('getRuntimeScreen'),
      setRuntimeScreen: cy.spy().as('setRuntimeScreen'),
      setRawScreenData: cy.spy().as('setRawScreenData'),
    };
    userExitsEventThrower = {
      fireGetScreen: cy.spy().as('fireGetScreen'),
      firePreGetScreen: cy.stub().as('firePreGetScreen').returns,
      firePostGetScreen: cy.stub().as('firePostGetScreen').returns,
    };
    screenProcessorService = {
      processTable: cy.stub().as('processTable').returns([]),
      processRegionsToHide: cy.stub().as('processRegionsToHide').returns([]),
    };

    mount(ScreenComponent, {
      providers: [
        { provide: NavigationService, useValue: navigationService },
        { provide: ScreenService, useValue: screenService },
        { provide: MessagesService, useValue: messages },
        { provide: SharedService, useValue: sharedService },
        { provide: ScreenHolderService, useValue: screenHolderService },
        { provide: UserExitsEventThrowerService, useValue: userExitsEventThrower },
        { provide: ScreenProcessorService, useValue: screenProcessorService },
        { provide: ScreenLockerService, useValue: screenLockerService },
        { provide: NGXLogger, useValue: logger },
        { provide: KeyboardMappingService, useValue: keyboardMappingService },
        { provide: InfoService, useValue: infoService },
      ],
    }).then(({ component }) => {
      componentRef = component;
      keyboardMappingService.clearJSKeyboardMappings();
    });
  });

  it('should call getScreen when ngOnInit is called', () => {
    isScreenUpdated$.complete();
    screenObjectUpdated$.next({} as any);
    cy.get('@getScreen').should('have.been.called');
  });

  it('should call postGetScreen when screenId is different from current screenId & newScreenId', () => {
    const incoming: GetScreenResponse = {
      screenId: 2,
      name: 'newScreen',
      screenSize: { columns: 80, rows: 24 },
      cursor: { position: { row: 1, column: 1 } as any },
      fields: [],
      transformations: [],
      screenDirectionRTL: false as any,
      language: 'en' as any
    } as any;
    componentRef.m_screen = { screenId: 1 } as any;
    cy.spy(componentRef as any, 'postGetScreen').as('postGetScreen');
    screenObjectUpdated$.next(incoming);
    cy.get('@postGetScreen').should('have.been.calledWith', incoming);
  });

  it('should not call setSendableField when ignored elements are processed', () => {
    const event = {
      path: [
        {},
        { tagName: 'div', attributes: { className: 'app-multiple-options' } },
        { tagName: 'input', attributes: { id: 'test-input' } },
        { tagName: 'div', attributes: { className: 'app-input-field' } },
        { tagName: 'span' },
      ],
      target: { tagName: 'input', id: 'radio-input', value: '' },
    };
    componentRef.handleInput(event as any);
    cy.get('@setSendableField').should('not.have.been.called');
  });

  it('should call setLocked when screen is locked', () => {
    componentRef.screenLockerService.setLocked(true);
    cy.get('@setLocked').should('have.been.called');
  });

  it('should call setSendableField when input is valid and not ignored', () => {
    const event = {
      path: [
        {},
        { tagName: 'div' }, // not ignored
        {},
        { tagName: 'span' }, // not ignored
      ],
      target: { tagName: 'input', id: 'username', value: 'john_doe' },
    };
    componentRef.handleInput(event as any);
    cy.get('@setSendableField').should('have.been.called');
  });

  it('should not call setSendableField when ignored tag is present in path', () => {
    const event = {
      path: [
        {},
        { tagName: 'app-multiple-options' }, // ignored
        {},
        { tagName: 'span' },
      ],
      target: { tagName: 'input', id: 'username', value: 'john_doe' },
    };
    componentRef.handleInput(event as any);
    cy.get('@setSendableField').should('not.have.been.called');
  });

  it('should not call setSendableField for radio input', () => {
    const event = {
      path: [{}, { tagName: 'div' }, {}, { tagName: 'div' }],
      target: { tagName: 'input', id: 'radio-option-1', value: 'yes' },
    };
    componentRef.handleInput(event as any);
    cy.get('@setSendableField').should('not.have.been.called');
  });
});