//import { Component, ViewChild } from "@angular/core"
import { mount } from 'cypress/angular'
import { MacroComponent } from "./macro.component"

import { ComponentFixture, TestBed } from '@angular/core/testing';
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
import { Component, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA,Input } from '@angular/core';
import { DropdownModule } from 'carbon-components-angular/dropdown';

describe('MarcoComponent', () => {
  let component: MacroComponent;
  let fixture: ComponentFixture<MacroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MacroComponent],
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
    })
    /*
      .overrideComponent(MacroComponent, {
        set: {
          template: '<div>Test Template Override</div>', // ⬅️ dummy HTML to avoid rendering error
        },
      })
        */
      .compileComponents();
  });
 
/*
  beforeEach(() => {
    fixture = TestBed.createComponent(MacroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  */ 

    it('can mount using WrapperComponent', () => {
        mount(MacroComponent);
        //cy.get().should('exist');
    });      

});
