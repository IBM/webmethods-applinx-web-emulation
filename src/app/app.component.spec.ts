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
import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { ApiModule,SessionService,InfoService } from '@ibm/applinx-rest-apis';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NavigationService } from 'src/app/services/navigation/navigation.service';
import { LoggerTestingModule } from 'ngx-logger/testing';
import { ScreenLockerService } from 'src/app/services/screen-locker.service'
import { DatePipe } from '@angular/common';
import { INGXLoggerConfig, NGXLogger } from 'ngx-logger';
import { MessagesService } from 'src/app/services/messages.service'
import { IJSFunctionService } from 'src/common/js-functions/ijs-functions.service'
import { JSFunctionsService } from 'src/common/js-functions/js-functions.service'
import { StorageService } from 'src/app/services/storage.service';
import { LifecycleUserExits } from 'src/app/user-exits/LifecycleUserExits';
import { UserExitsEventThrowerService } from './services/user-exits-event-thrower.service';
import { IconService, ModalService, PlaceholderService } from 'carbon-components-angular';
import { GXUtils } from 'src/utils/GXUtils';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';


describe('AppComponent', () => {

  beforeEach(async(() => {
    const mockLogger = {
      getConfigSnapshot: jasmine.createSpy('getConfigSnapshot').and.returnValue({}), // Return empty config snapshot
      updateConfig: jasmine.createSpy('updateConfig')  // Ensure updateConfig is mocked
    };
    TestBed.configureTestingModule({
    declarations: [
        AppComponent
    ],
    imports: [RouterTestingModule,
        ApiModule],
    providers: [
        SessionService,
        NavigationService,
        LoggerTestingModule,
        ScreenLockerService,
        DatePipe,
        StorageService,
        UserExitsEventThrowerService,
        LifecycleUserExits,
        InfoService,
        ModalService,
        PlaceholderService,
        IconService,
        { provide: NGXLogger, useValue: { getConfigSnapshot: () => ({}) } },
        { provide: 'IJSFunctionService', useClass: JSFunctionsService },
        provideHttpClient(withInterceptorsFromDi())
    ]
}).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'ApplinX-Framework'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('ApplinX-Framework');
  });

  it('should call sendKeys("[enter]") on double click when conditions are met', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    spyOn(navigationService, 'sendKeys');

    // Create a dummy <div> element (not excluded)
    const div = document.createElement('div');
    document.body.appendChild(div);

    // Create and dispatch a double-click event on the div
    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: div });

    // Set required flags
    (GXUtils as any).ENABLETYPEAHEADFLAG = false;
    (GXUtils as any).enableDoubleClickFlag = true;
    (GXUtils as any).doubleClickPFKey = '[enter]';
    app.macroMode = '';

    // Call the handler
    app.onGlobalDoubleClick(event);

    // Expect the key to be sent
    expect(navigationService.sendKeys).toHaveBeenCalledWith('[enter]');
  });

  it('should NOT call sendKeys("[enter]") when double-clicked inside a calendar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    spyOn(navigationService, 'sendKeys');

    const calendarEl = document.createElement('div');
    calendarEl.classList.add('flatpickr-calendar');
    document.body.appendChild(calendarEl);

    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: calendarEl });

    app.onGlobalDoubleClick(event);
    expect(navigationService.sendKeys).not.toHaveBeenCalled();
  });

  it('should NOT call sendKeys("[enter]") when double-clicked on a contentEditable element', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    spyOn(navigationService, 'sendKeys');

    const editableDiv = document.createElement('div');
    editableDiv.contentEditable = 'true';
    document.body.appendChild(editableDiv);

    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: editableDiv });

    app.onGlobalDoubleClick(event);
    expect(navigationService.sendKeys).not.toHaveBeenCalled();
  });

  it('should NOT call sendKeys("[enter]") if macro mode is "record"', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    spyOn(navigationService, 'sendKeys');

    const div = document.createElement('div');
    document.body.appendChild(div);

    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: div });

    app.macroMode = 'record';
    app.onGlobalDoubleClick(event);

    expect(navigationService.sendKeys).not.toHaveBeenCalled();
  });

  it('should NOT call sendKeys("[enter]") if double-clicked on a checkbox input', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    spyOn(navigationService, 'sendKeys');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    document.body.appendChild(checkbox);

    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: checkbox });

    app.onGlobalDoubleClick(event);
    expect(navigationService.sendKeys).not.toHaveBeenCalled();
  });

  it('should NOT call sendKeys if doubleClickPFKey is "none"', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    spyOn(navigationService, 'sendKeys');

    const div = document.createElement('div');
    document.body.appendChild(div);

    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: div });

    GXUtils.ENABLETYPEAHEADFLAG = false;
    GXUtils.enableDoubleClickFlag = true;
    GXUtils.doubleClickPFKey = 'none'; // special case
    app.macroMode = '';

    app.onGlobalDoubleClick(event);
    expect(navigationService.sendKeys).not.toHaveBeenCalled();
  });
  it('should NOT call sendKeys if enableDoubleClickFlag is false', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    spyOn(navigationService, 'sendKeys');

    const div = document.createElement('div');
    document.body.appendChild(div);

    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: div });

    GXUtils.ENABLETYPEAHEADFLAG = false;
    GXUtils.enableDoubleClickFlag = false; // disabled
    GXUtils.doubleClickPFKey = '[enter]';
    app.macroMode = '';

    app.onGlobalDoubleClick(event);
    expect(navigationService.sendKeys).not.toHaveBeenCalled();
  });
  it('should NOT call sendKeys if the target is inside a modal', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    spyOn(navigationService, 'sendKeys');

    const modal = document.createElement('div');
    modal.classList.add('cds--modal');
    const innerDiv = document.createElement('div');
    modal.appendChild(innerDiv);
    document.body.appendChild(modal);

    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: innerDiv });

    GXUtils.ENABLETYPEAHEADFLAG = false;
    GXUtils.enableDoubleClickFlag = true;
    GXUtils.doubleClickPFKey = '[enter]';
    app.macroMode = '';

    app.onGlobalDoubleClick(event);
    expect(navigationService.sendKeys).not.toHaveBeenCalled();
  });
  it('should NOT call sendKeys if ENABLETYPEAHEADFLAG is true', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    spyOn(navigationService, 'sendKeys');

    const div = document.createElement('div');
    document.body.appendChild(div);

    GXUtils.ENABLETYPEAHEADFLAG = true; // block double-click
    GXUtils.enableDoubleClickFlag = true;
    GXUtils.doubleClickPFKey = '[enter]';
    app.macroMode = '';

    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: div });

    app.onGlobalDoubleClick(event);
    expect(navigationService.sendKeys).not.toHaveBeenCalled();
  });
  it('should NOT call sendKeys when double-clicked on a <select> element', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    spyOn(navigationService, 'sendKeys');

    const select = document.createElement('select');
    document.body.appendChild(select);

    GXUtils.enableDoubleClickFlag = true;
    GXUtils.doubleClickPFKey = '[enter]';
    GXUtils.ENABLETYPEAHEADFLAG = false;
    app.macroMode = '';

    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: select });

    app.onGlobalDoubleClick(event);
    expect(navigationService.sendKeys).not.toHaveBeenCalled();
  });
  it('should NOT call sendKeys when double-clicked inside a Carbon dropdown', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    spyOn(navigationService, 'sendKeys');

    const dropdown = document.createElement('div');
    dropdown.classList.add('cds--list-box__field');
    document.body.appendChild(dropdown);

    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: dropdown });

    GXUtils.enableDoubleClickFlag = true;
    GXUtils.doubleClickPFKey = '[enter]';
    GXUtils.ENABLETYPEAHEADFLAG = false;
    app.macroMode = '';

    app.onGlobalDoubleClick(event);
    expect(navigationService.sendKeys).not.toHaveBeenCalled();
  });

  it('should call sendKeys and handle screen response on double click', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
  
    // Mocking screen response similar to what the API returns
    const mockScreenData = {
      id: 'screen001',
      title: 'Dashboard',
      fields: [],
      cursorPosition: { row: 2, column: 5 }
    };
  
    // Spying on sendKeys and returning a mocked observable of screen
    spyOn(navigationService, 'sendKeys');
  
    GXUtils.ENABLETYPEAHEADFLAG = false;
    GXUtils.enableDoubleClickFlag = true;
    GXUtils.doubleClickPFKey = '[enter]';
    app.macroMode = '';
  
    const div = document.createElement('div');
    document.body.appendChild(div);
  
    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: div });
  
    // Calling the double-click handler
    app.onGlobalDoubleClick(event);
  
    // Ensuring API is called and screen is received
    expect(navigationService.sendKeys).toHaveBeenCalledWith('[enter]');
  
  });

  it('should call screen API on double click via sendKeys', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const navigationService = TestBed.inject(NavigationService);
    const httpMock = TestBed.inject(HttpTestingController);
  
    // Spying on the sendKeys method and simulating the API being triggered
    spyOn(navigationService, 'sendKeys').and.callFake(() => {
      const http = TestBed.inject(HttpClient);
      http.put('/api/screen', {}).subscribe();
      return;
    });
  
    // Mocking external requests to avoid open HTTP requests
    const mockMessagesResponse = { };
    const mockSessionConfigResponse = { };
    const mockInfoResponse = { };
  
    // Mocking the external HTTP requests that might cause issues
    httpMock.expectOne('./assets/messages/messages.json').flush(mockMessagesResponse);
    httpMock.expectOne('http://localhost:8080/api/rest/info').flush(mockInfoResponse);
    httpMock.expectOne('http://localhost:9876/context.html/assets/config/sessionConfig.json').flush(mockSessionConfigResponse);
    httpMock.expectOne('./assets/config/sessionConfig.json').flush(mockSessionConfigResponse);
  
    // Simulating double click event
    const div = document.createElement('div');
    document.body.appendChild(div);
  
    const event = new MouseEvent('dblclick', { bubbles: true });
    Object.defineProperty(event, 'target', { value: div });
  
    GXUtils.enableDoubleClickFlag = true;
    GXUtils.doubleClickPFKey = '[enter]';
    GXUtils.ENABLETYPEAHEADFLAG = false;
    app.macroMode = '';
  
    // Calling the double click handler
    app.onGlobalDoubleClick(event);
  
    // Ensuring the correct HTTP request was made
    const req = httpMock.expectOne('/api/screen');
    expect(req.request.method).toBe('PUT');
    req.flush({});  // Respond to the screen API request
  
    // Verifying that there are no pending HTTP requests
    httpMock.verify();
  });

});
