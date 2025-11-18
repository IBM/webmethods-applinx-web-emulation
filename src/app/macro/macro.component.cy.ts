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

import { mount } from 'cypress/angular'
import { HttpClient, HttpHandler } from '@angular/common/http';
import { InfoService, MacroService, ScreenService } from '@ibm/applinx-rest-apis';
import { MessagesService } from '../services/messages.service';
import { SharedService } from '../services/shared.service';
import { ScreenHolderService } from '../services/screen-holder.service';
import { UserExitsEventThrowerService } from '../services/user-exits-event-thrower.service';
import { ScreenProcessorService } from '../services/screen-processor.service';
import { NavigationService } from '../services/navigation/navigation.service';
import { ScreenLockerService } from '../services/screen-locker.service';
import { ModalService, PlaceholderService } from 'carbon-components-angular';
import { JSMethodsService } from '../../../src/common/js-functions/js-methods.service';
import { KeyboardMappingService } from '../services/keyboard-mapping.service';
import { NGXLogger } from 'ngx-logger';
import { FormsModule } from '@angular/forms';
import { Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { DropdownModule } from 'carbon-components-angular/dropdown';
			
@Component({
  selector: 'app-macro',
  template: '<div>Test Template Override</div>'
})

class MacroComponent {}

describe('MacroComponent', () => {
  it('should create', () => {
    mount(MacroComponent, {
      providers: [
        NavigationService,
        ScreenService,
        MessagesService,
        SharedService,
        ScreenHolderService,
        UserExitsEventThrowerService,
        ScreenProcessorService,
        ScreenLockerService,
        ModalService,
        InfoService,
        JSMethodsService,
        PlaceholderService,
        KeyboardMappingService,
        MacroService,
        { provide: NGXLogger, useValue: {} },
        { provide: 'IJSFunctionService', useClass: JSMethodsService },
        { provide: HttpClient, useClass: HttpClient },
        { provide: HttpHandler, useClass: HttpHandler },
      ],
      imports: [FormsModule, DropdownModule],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
    }).then(({component}) => {
      expect(component).to.exist;
      cy.contains('div', 'Test Template Override').should('exist')
    })
  });
})