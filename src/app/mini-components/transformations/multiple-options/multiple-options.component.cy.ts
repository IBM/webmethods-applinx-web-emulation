//import { Component, ViewChild } from "@angular/core"
import { mount, MountConfig } from 'cypress/angular'
import { MultipleOptionsComponent } from "./multiple-options.component"

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Field, InfoService, MultipleOptionsTransformation, ScreenService } from '@ibm/applinx-rest-apis';
import { HttpClient, HttpClientXsrfModule, HttpHandler } from '@angular/common/http';
import { NavigationService } from '../../../../../src/app/services/navigation/navigation.service';
//import { NavigationService } from '../../../../../';
import { MessagesService } from '../../../../../src/app/services/messages.service';
import { SharedService } from '../../../../../src/app/services/shared.service';
import { ScreenHolderService } from '../../../../../src/app/services/screen-holder.service';
import { UserExitsEventThrowerService } from '../../../../../src/app/services/user-exits-event-thrower.service';
import { ScreenProcessorService } from '../../../../../src/app/services/screen-processor.service';
import { ScreenLockerService } from '../../../../../src/app/services/screen-locker.service';
import { ModalService, PlaceholderService } from 'carbon-components-angular';
import { JSMethodsService } from '../../../../../src/common/js-functions/js-methods.service';
import { KeyboardMappingService } from '../../../../../src/app/services/keyboard-mapping.service';
import { NGXLogger } from 'ngx-logger';
import { SimpleChange, SimpleChanges } from '@angular/core';

describe('MultipleOptionsComponent', () => {
    let component: MultipleOptionsComponent;

    /*
  let component: MultipleOptionsComponent;
  let fixture: ComponentFixture<MultipleOptionsComponent>;
  let screenService: ScreenService;
      const config: MountConfig<MultipleOptionsComponent> = {

        declarations: [MultipleOptionsComponent],
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
        { provide: 'IJSFunctionService', useClass: JSMethodsService },
        //  { provide: NavigationService, useClass: jasmine.createSpyObj('NavigationService', ['setCursorPosition', 'setSendableField']) },

        { provide: ScreenService, useClass: ScreenService },
        { provide: HttpClient, useClass: HttpClient },
        { provide: HttpHandler, useClass: HttpHandler }
      ]
    //    imports: [FormsModule],
     //   declarations: [ButtonComponent],
      //  providers: [LoginService]
    } 
//  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;
*/
  //beforeEach(() => {

      it('more', () => {
        let x: MultipleOptionsComponent;
         const transform: MultipleOptionsTransformation = {
      type: 'MultipleOptionsTransformation',
      multipleOptionsType: 'Combobox',
      items: [
        { key: 'one', value: 'one' },
        { key: 'two', value: 'two' },
        { key: 'three', value: 'three' }
      ],
      field: {
        row: {},
        content: 'two',
        position: 'top',
        index: 0,
        occurenceIndex: 0,
        setName: cy.stub(),
        setIndex: cy.stub(),
        setValue: cy.stub(),
        setPosition: cy.stub(),
      } as any
    };
    

        mount(MultipleOptionsComponent, {
      declarations: [MultipleOptionsComponent],
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
        { provide: 'IJSFunctionService', useClass: JSMethodsService },
        //  { provide: NavigationService, useClass: jasmine.createSpyObj('NavigationService', ['setCursorPosition', 'setSendableField']) },

        { provide: ScreenService, useClass: ScreenService },
        { provide: HttpClient, useClass: HttpClient },
        { provide: HttpHandler, useClass: HttpHandler }
      ]
    }).then(({component}) => {
        x = component;
        x.transform = transform;
        x.ngOnInit();
        expect(component.entries.length).to.equal(3);

    })
       
    })




/*
      it('can mount using WrapperComponent', () => {

        mount(MultipleOptionsComponent, config)
    })
*/
    //await TestBed.configureTestingModule({
    //cy.mount(MultipleOptionsComponent)
     // 
    })


