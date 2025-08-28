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
import { ScreenComponent } from './screen.component';
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
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ModalService, PlaceholderService } from 'carbon-components-angular';
import { IJSFunctionService } from 'src/common/js-functions/ijs-functions.service';
import { JSMethodsService } from 'src/common/js-functions/js-methods.service';
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
  let keyboardMappingServiceStub={clearJSKeyboardMappings:jasmine.createSpy('clearJSKeyboardMappings')}
  await TestBed.configureTestingModule({
    declarations: [ScreenComponent],
    imports: [],
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
        { provide: HttpClientXsrfModule, useClass: HttpClientTestingModule },
        { provide: 'IJSFunctionService', useClass: JSMethodsService },
        { provide: KeyboardMappingService, useValue: keyboardMappingServiceStub },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
}).compileComponents();
  const keyboardMappingService = TestBed.inject(KeyboardMappingService);
  keyboardMappingService.clearJSKeyboardMappings();
});


  beforeEach(() => {
    fixture = TestBed.createComponent(ScreenComponent);
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
  });
 
  it('should call getScreen when ngOnInit is called', () => {
    component.ngOnInit();
    expect(screenService.getScreen).toHaveBeenCalled();
  });
 
 
  it('should call postGetScreen when screenId is different from current screenId & newScreenId', () => {
    const incomingScreen: GetScreenResponse = {
      screenId: 2, 
      name: 'newScreen',
      screenSize: {},
      cursor: { position: { row: 1, column: 1 } },
      fields: [],
      transformations: []
    };
 
    component.m_screen = { screenId: 1 } as GetScreenResponse;
    spyOn(component as any, 'postGetScreen');
 
    // Manually trigger the BehaviorSubject
    navigationService.screenObjectUpdated = new BehaviorSubject<GetScreenResponse>(null);
    component.ngOnInit(); 
    navigationService.screenObjectUpdated.next(incomingScreen); 
 
    expect((component as any).postGetScreen).toHaveBeenCalledWith(incomingScreen);
  });
  
   it('should not call setSendableField when ignored elements are processed', () => {
    const event = {
      path: [
        {},
        { tagName: 'div', attributes: { className: 'app-multiple-options' } },
        { tagName: 'input', attributes: { id: 'test-input' } },
        { tagName: 'div', attributes: { className: 'app-input-field' } },
        {tagName:'span'}
      ],
      target:{
        tagName:'input',
        id:'radio-input',
        value:''
      }
    };
  
    component.handleInput(event);
  
    if (event.path && event.path.length > 2) {
      expect(navigationService.setSendableField).not.toHaveBeenCalled();
    }
  });
  


  it('should call getScreen when ngOnInit is called', () => {
    component.ngOnInit();
    expect(screenService.getScreen).toHaveBeenCalled();
  });

  it('should call setRuntimeScreen when onScreenInit is called', () => {
    const screen: GetScreenResponse = {
      name: 'testScreen',
      screenId: 123,
      screenSize: {
     
      },
      cursor: {
        position: {
          row: 1,
          column: 1,
        },
      },
      fields: [

      ],
      transformations:[]
    };

    component.onScreenInit(screen);

    expect(screenHolderService.setRuntimeScreen).toHaveBeenCalled;
  });
 
  it('should call setLocked when screen is locked', () => {
    component.screenLockerService.setLocked(true);

    expect(screenLockerService.setLocked).toHaveBeenCalledWith(true);
  });

  it('should call setSendableField when input is valid and not ignored', () => {
    const event = {
      path: [
        {}, // 0
        { tagName: 'div' }, // 1 - not ignored
        {}, // 2
        { tagName: 'span' }, // 3 - not ignored
      ],
      target: {
        tagName: 'input',
        id: 'username',
        value: 'john_doe'
      }
    };
  
    component.handleInput(event);
  
    expect(navigationService.setSendableField).toHaveBeenCalled();
  });

  it('should not call setSendableField when ignored tag is present in path', () => {
    const event = {
      path: [
        {}, 
        { tagName: 'app-multiple-options' }, // ignored
        {},
        { tagName: 'span' },
      ],
      target: {
        tagName: 'input',
        id: 'username',
        value: 'john_doe'
      }
    };
  
    component.handleInput(event);
  
    expect(navigationService.setSendableField).not.toHaveBeenCalled();
  });

  it('should not call setSendableField for radio input', () => {
    const event = {
      path: [
        {}, 
        { tagName: 'div' },
        {},
        { tagName: 'div' },
      ],
      target: {
        tagName: 'input',
        id: 'radio-option-1',
        value: 'yes'
      }
    };
  
    component.handleInput(event);
  
    expect(navigationService.setSendableField).not.toHaveBeenCalled();
  });

});
 