//import { Component, ViewChild } from "@angular/core"
import { mount } from 'cypress/angular'
import { ScreenComponent } from "./screen.component"

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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationService } from '../services/navigation/navigation.service'; // replace with the actual path=
import { NGXLogger } from 'ngx-logger';
import { MessagesService } from '../services/messages.service';
import { SharedService } from '../services/shared.service';
import { ScreenHolderService } from '../services/screen-holder.service';
import { UserExitsEventThrowerService } from '../services/user-exits-event-thrower.service';
import { ScreenProcessorService } from '../services/screen-processor.service';
import { ScreenLockerService } from '../services/screen-locker.service';
import { ScreenService } from '@ibm/applinx-rest-apis';
import { GetScreenRequest, GetScreenResponse ,InputField, InfoService} from '@ibm/applinx-rest-apis';
import { BehaviorSubject, of } from 'rxjs';
import { HostListener } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClientXsrfModule } from '@angular/common/http';
import { ModalService, PlaceholderService } from 'carbon-components-angular';
import { IJSFunctionService } from '../../../src/common/js-functions/ijs-functions.service';
import { JSMethodsService } from '../../../src/common/js-functions/js-methods.service';
import { KeyboardMappingService } from '../services/keyboard-mapping.service';
 
 
describe('ScreenComponent', () => {
  let component: ScreenComponent;
  let fixture: ComponentFixture<ScreenComponent>;
  let navigationService: NavigationService;
  let screenService: ScreenService;
  let messages: MessagesService;
  let sharedService: SharedService;
  let screenHolderService: ScreenHolderService;
  let userExitsEventThrower: UserExitsEventThrowerService;
  let screenProcessorService: ScreenProcessorService;
  let screenLockerService: ScreenLockerService;
  let logger: NGXLogger;
  let isScreenUpdated$: BehaviorSubject<boolean>;
  let screenObjectUpdated$: BehaviorSubject<any>;


beforeEach(async () => {
  isScreenUpdated$ = new BehaviorSubject<boolean>(false);
  screenObjectUpdated$ = new BehaviorSubject<any>(null);
  //let keyboardMappingServiceStub={clearJSKeyboardMappings:jasmine.createSpy('clearJSKeyboardMappings')}
  await TestBed.configureTestingModule({
    declarations: [ScreenComponent],
    imports: [
      HttpClientTestingModule, // Add this line
      // other imports...
    ],
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
      { provide: NGXLogger, useValue: {} },
      {provide:HttpClientXsrfModule, useClass:HttpClientTestingModule},
      { provide: 'IJSFunctionService', useClass: JSMethodsService },
     // {provide:KeyboardMappingService,useValue:keyboardMappingServiceStub}
    ],
    
  }).compileComponents();
  //const keyboardMappingService = TestBed.inject(KeyboardMappingService);
  //keyboardMappingService.clearJSKeyboardMappings();
});


  beforeEach(() => {
    
    /*
    component = fixture.componentInstance;
    navigationService = TestBed.inject(NavigationService);
    screenService = TestBed.inject(ScreenService);
    messages = TestBed.inject(MessagesService);
    sharedService = TestBed.inject(SharedService);
    screenHolderService = TestBed.inject(ScreenHolderService);
    userExitsEventThrower = TestBed.inject(UserExitsEventThrowerService);
    screenProcessorService = TestBed.inject(ScreenProcessorService);
    screenLockerService = TestBed.inject(ScreenLockerService);
    logger = TestBed.inject(NGXLogger);
    spyOn(navigationService, 'setSendableField').and.callThrough();
    spyOn(screenService, 'getScreen').and.returnValue(of());
    spyOn(screenHolderService, 'setRuntimeScreen').and.callThrough();
    spyOn(screenHolderService, 'setRawScreenData').and.callThrough();
    spyOn(screenProcessorService, 'processTable').and.callThrough();
    spyOn(screenLockerService, 'setLocked').and.callThrough();
    */
  });

    it('can mount using WrapperComponent', () => {
        fixture = TestBed.createComponent(ScreenComponent);
        mount(ScreenComponent);
        //cy.get().should('exist');
    });      
});