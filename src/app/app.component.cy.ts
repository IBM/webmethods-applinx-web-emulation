import { mount } from 'cypress/angular';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { LoggerTestingModule } from 'ngx-logger/testing';
import { ApiModule, SessionService, InfoService } from '@ibm/applinx-rest-apis';
import { AppComponent } from './app.component';
import { NavigationService } from './services/navigation/navigation.service';
import { ScreenLockerService } from './services/screen-locker.service';
import { StorageService } from './services/storage.service';
import { UserExitsEventThrowerService } from './services/user-exits-event-thrower.service';
import { LifecycleUserExits } from './user-exits/LifecycleUserExits';
import { IconService, ModalService, PlaceholderService } from 'carbon-components-angular';
import { JSFunctionsService } from '../common/js-functions/js-functions.service';
import { GXUtils } from '../utils/GXUtils';

let loggerMock: any;
let importsList: any[];
let providersList: any[];

describe('AppComponent', () => {
  beforeEach(() => {
    loggerMock = {
      getConfigSnapshot: cy.stub().as('getConfigSnapshot').returns({}),
      updateConfig: cy.spy().as('updateConfig'),
    } as Partial<NGXLogger>;
    cy.spy(NavigationService.prototype as any, 'sendKeys').as('sendKeysSpy');
    importsList = [RouterTestingModule, ApiModule, HttpClientTestingModule];
    providersList = [
      SessionService,
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
      { provide: NGXLogger, useValue: loggerMock },
      { provide: 'IJSFunctionService', useClass: JSFunctionsService },
    ];
  });

  it('should create the app', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      expect(component).to.exist;
    });
  });

  it("should have as title 'ApplinX-Framework'", () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      expect(component.title).to.equal('ApplinX-Framework');
    });
  });

  it('should call sendKeys("[enter]") on double click when conditions are met', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      (GXUtils as any).ENABLETYPEAHEADFLAG = false;
      (GXUtils as any).enableDoubleClickFlag = true;
      (GXUtils as any).doubleClickPFKey = '[enter]';
      component.macroMode = '';
      const div = document.createElement('div');
      document.body.appendChild(div);
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: div });
      component.onGlobalDoubleClick(evt as any);
      cy.get('@sendKeysSpy').should('have.been.calledWith', '[enter]');
    });
  });

  it('should NOT call sendKeys("[enter]") when double-clicked inside a calendar', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      const calendarEl = document.createElement('div');
      calendarEl.classList.add('flatpickr-calendar');
      document.body.appendChild(calendarEl);
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: calendarEl });
      component.onGlobalDoubleClick(evt as any);
      cy.get('@sendKeysSpy').should('not.have.been.called');
    });
  });

  it('should NOT call sendKeys("[enter]") when double-clicked on a contentEditable element', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      const editable = document.createElement('div');
      editable.contentEditable = 'true';
      document.body.appendChild(editable);
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: editable });
      component.onGlobalDoubleClick(evt as any);
      cy.get('@sendKeysSpy').should('not.have.been.called');
    });
  });

  it('should NOT call sendKeys("[enter]") if macro mode is "record"', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      component.macroMode = 'record';
      const div = document.createElement('div');
      document.body.appendChild(div);
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: div });
      component.onGlobalDoubleClick(evt as any);
      cy.get('@sendKeysSpy').should('not.have.been.called');
    });
  });

  it('should NOT call sendKeys("[enter]") if double-clicked on a checkbox input', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      document.body.appendChild(checkbox);
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: checkbox });
      component.onGlobalDoubleClick(evt as any);
      cy.get('@sendKeysSpy').should('not.have.been.called');
    });
  });

  it('should NOT call sendKeys if doubleClickPFKey is "none"', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      (GXUtils as any).ENABLETYPEAHEADFLAG = false;
      (GXUtils as any).enableDoubleClickFlag = true;
      (GXUtils as any).doubleClickPFKey = 'none';
      component.macroMode = '';
      const div = document.createElement('div');
      document.body.appendChild(div);
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: div });
      component.onGlobalDoubleClick(evt as any);
      cy.get('@sendKeysSpy').should('not.have.been.called');
    });
  });

  it('should NOT call sendKeys if enableDoubleClickFlag is false', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      (GXUtils as any).ENABLETYPEAHEADFLAG = false;
      (GXUtils as any).enableDoubleClickFlag = false;
      (GXUtils as any).doubleClickPFKey = '[enter]';
      component.macroMode = '';
      const div = document.createElement('div');
      document.body.appendChild(div);
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: div });
      component.onGlobalDoubleClick(evt as any);

      cy.get('@sendKeysSpy').should('not.have.been.called');
    });
  });

  it('should NOT call sendKeys if the target is inside a modal', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      const modal = document.createElement('div');
      modal.classList.add('cds--modal');
      const inner = document.createElement('div');
      modal.appendChild(inner);
      document.body.appendChild(modal);
      (GXUtils as any).ENABLETYPEAHEADFLAG = false;
      (GXUtils as any).enableDoubleClickFlag = true;
      (GXUtils as any).doubleClickPFKey = '[enter]';
      component.macroMode = '';
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: inner });
      component.onGlobalDoubleClick(evt as any);
      cy.get('@sendKeysSpy').should('not.have.been.called');
    });
  });

  it('should NOT call sendKeys if ENABLETYPEAHEADFLAG is true', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      (GXUtils as any).ENABLETYPEAHEADFLAG = true;
      (GXUtils as any).enableDoubleClickFlag = true;
      (GXUtils as any).doubleClickPFKey = '[enter]';
      component.macroMode = '';
      const div = document.createElement('div');
      document.body.appendChild(div);
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: div });
      component.onGlobalDoubleClick(evt as any);

      cy.get('@sendKeysSpy').should('not.have.been.called');
    });
  });

  it('should NOT call sendKeys when double-clicked on a <select> element', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      (GXUtils as any).ENABLETYPEAHEADFLAG = false;
      (GXUtils as any).enableDoubleClickFlag = true;
      (GXUtils as any).doubleClickPFKey = '[enter]';
      component.macroMode = '';
      const select = document.createElement('select');
      document.body.appendChild(select);
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: select });
      component.onGlobalDoubleClick(evt as any);
      cy.get('@sendKeysSpy').should('not.have.been.called');
    });
  });

  it('should NOT call sendKeys when double-clicked inside a Carbon dropdown', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      (GXUtils as any).ENABLETYPEAHEADFLAG = false;
      (GXUtils as any).enableDoubleClickFlag = true;
      (GXUtils as any).doubleClickPFKey = '[enter]';
      component.macroMode = '';
      const dropdown = document.createElement('div');
      dropdown.classList.add('cds--list-box__field');
      document.body.appendChild(dropdown);
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: dropdown });
      component.onGlobalDoubleClick(evt as any);
      cy.get('@sendKeysSpy').should('not.have.been.called');
    });
  });

  it('should call sendKeys and handle screen response on double click', () => {
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      (GXUtils as any).ENABLETYPEAHEADFLAG = false;
      (GXUtils as any).enableDoubleClickFlag = true;
      (GXUtils as any).doubleClickPFKey = '[enter]';
      component.macroMode = '';
      const div = document.createElement('div');
      document.body.appendChild(div);
      const evt = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(evt, 'target', { value: div });
      component.onGlobalDoubleClick(evt as any);
      cy.get('@sendKeysSpy').should('have.been.calledWith', '[enter]');
    });
  });

  it('should call screen API on double click via sendKeys', () => {
    const httpClient = {
      put: cy.stub().as('httpPut').returns(of({})),
      get: cy.stub().as('httpGet').returns(of({}))
    };
    const userExitsEventThrower = {
      clearEventListeners: cy.stub().as('clearEventListeners'),
      addEventListener: cy.stub().as('addEventListener'),
      removeEventListener: cy.stub().as('removeEventListener'),
      fireGetScreen: cy.stub().as('fireGetScreen')
    };
    const navigationService = {
      sendKeys: cy.stub().as('sendKeys').callsFake(() => {
        httpClient.put('/api/screen', {}).subscribe();
      }),
      getRoutingHandler: () => ({
        hasRoute: cy.stub().as('hasRoute').returns(false)
      })
    };
    providersList.push(
      {provide: NavigationService, useValue: navigationService },
      { provide: UserExitsEventThrowerService, useValue: userExitsEventThrower },
      { provide: HttpClient, useValue: httpClient });
    mount(AppComponent, {
      declarations: [AppComponent],
      imports: importsList,
      providers: providersList,
    }).then(({ component }) => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      const event = new MouseEvent('dblclick', { bubbles: true });
      Object.defineProperty(event, 'target', { value: div });
      GXUtils.enableDoubleClickFlag = true;
      GXUtils.doubleClickPFKey = '[enter]';
      GXUtils.ENABLETYPEAHEADFLAG = false;
      component.macroMode = '';
      component.onGlobalDoubleClick(event);
      cy.get('@httpPut')
        .should('have.been.calledWith', '/api/screen', {});
    });
  });
});