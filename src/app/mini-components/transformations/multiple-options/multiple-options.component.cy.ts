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
import { MultipleOptionsComponent } from './multiple-options.component';
import { Field, InfoService, ScreenService, MultipleOptionsTransformation } from '@ibm/applinx-rest-apis';
import { NavigationService } from '../../../../../src/app/services/navigation/navigation.service';
import { MessagesService } from '../../../../../src/app/services/messages.service';
import { SharedService } from '../../../../../src/app/services/shared.service';
import { ScreenHolderService } from '../../../../../src/app/services/screen-holder.service';
import { UserExitsEventThrowerService } from '../../../../../src/app/services/user-exits-event-thrower.service';
import { ScreenProcessorService } from '../../../../../src/app/services/screen-processor.service';
import { ScreenLockerService } from '../../../../../src/app/services/screen-locker.service';
import { KeyboardMappingService } from '../../../../../src/app/services/keyboard-mapping.service';
import { JSMethodsService } from '../../../../../src/common/js-functions/js-methods.service';
import { ModalService, PlaceholderService } from 'carbon-components-angular';
import { NGXLogger } from 'ngx-logger';
import { SimpleChanges } from '@angular/core';

describe('MultipleOptionsComponent (beforeEach + pure mount)', () => {
  let componentRef: MultipleOptionsComponent;
  let navigationService: any;
  let screenService: any;
  let messages: any;
  let sharedService: any;
  let screenHolderService: any;
  let userExitsEventThrower: any;
  let screenProcessorService: any;
  let screenLockerService: any;
  let keyboardMappingService: any;
  let logger: any;
  let infoService: any;

  beforeEach(() => {
    navigationService = {};
    logger = {};
    sharedService = {};
    screenHolderService = {};
    screenLockerService = { 
      setLocked: cy.spy() 
    };
    keyboardMappingService = { 
      clearJSKeyboardMappings: cy.spy() 
    };
    infoService = { 
      setLanguage: cy.spy() 
    };
    screenService = { 
      getScreen: cy.stub().returns(({})) 
    };
    messages = { 
      get: cy.stub().returns('') 
    };
    userExitsEventThrower = {
      fireGetScreen: cy.spy(),
      firePreGetScreen: cy.stub().returns,
      firePostGetScreen: cy.stub().returns,
    };
    screenProcessorService = {
      processTable: cy.stub().returns([]),
      processRegionsToHide: cy.stub().returns([]),
    };
    
    mount(MultipleOptionsComponent, {
      providers: [
        { provide: NavigationService, useValue: navigationService },
        { provide: ScreenService, useValue: screenService },
        { provide: MessagesService, useValue: messages },
        { provide: SharedService, useValue: sharedService },
        { provide: ScreenHolderService, useValue: screenHolderService },
        { provide: UserExitsEventThrowerService, useValue: userExitsEventThrower },
        { provide: ScreenProcessorService, useValue: screenProcessorService },
        { provide: ScreenLockerService, useValue: screenLockerService },
        { provide: KeyboardMappingService, useValue: keyboardMappingService },
        { provide: NGXLogger, useValue: logger },
        { provide: InfoService, useValue: infoService },
        ModalService,
        PlaceholderService,
        JSMethodsService,
        { provide: 'IJSFunctionService', useClass: JSMethodsService },
      ],
    }).then(({ component }) => {
      componentRef = component;
      keyboardMappingService.clearJSKeyboardMappings();
    });
  });

  it('should set entries and radioValue correctly on ngOnInit', () => {
    const comboboxTransform: MultipleOptionsTransformation = {
      type: 'MultipleOptionsTransformation',
      multipleOptionsType: 'Combobox',
      items: [
        { key: 'one', value: 'one' },
        { key: 'two', value: 'two' },
        { key: 'three', value: 'three' },
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
      } as any,
    };
    const radioTransform: MultipleOptionsTransformation = {
      type: 'MultipleOptionsTransformation',
      multipleOptionsType: 'Radio Buttons',
      field: {
        row: 0,
        content: 'two',
        position: 'top',
        index: 0,
        occurenceIndex: 0,
        setName: cy.stub(),
        setIndex: cy.stub(),
        setValue: cy.stub(),
        setPosition: cy.stub(),
      } as any,
    };
    componentRef.transform = comboboxTransform;
    componentRef.ngOnInit();
    expect(componentRef.entries.length).to.equal(3);
    componentRef.transform = radioTransform;
    componentRef.ngOnInit();
    expect(componentRef.radioValue).to.equal('two');
  });

  it('should set inputField name, index, value, and position correctly', () => {
    const field: Field = {
      name: 'testName',
      multiple: true,
      index: 1,
      content: 'testContent',
      position: { row: 1, column: 2 },
      setPosition: () => {},
    };
    const changes: SimpleChanges = {
      transform: {
        currentValue: { field },
        previousValue: { field: null },
        firstChange: true,
        isFirstChange: () => true,
      },
    };
    componentRef.ngOnChanges(changes);
    expect(componentRef.inputField.name).to.equal('testName');
    expect(componentRef.inputField.index).to.equal(1);
    expect(componentRef.inputField.value).to.equal('testContent');
    expect(componentRef.inputField.position?.row).to.equal(1);
    expect(componentRef.inputField.position?.column).to.equal(2);
  });

  it('should return an array of keys from the input array', () => {
    const inputArray = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
      { key: 'key3', value: 'value3' },
    ];
    const result = componentRef.getItemsKeys(inputArray);
    expect(result).to.deep.equal(['key1', 'key2', 'key3']);
  });

  it('should return an empty array when the input array is empty', () => {
    const inputArray: any[] = [];
    const result = componentRef.getItemsKeys(inputArray);
    expect(result).to.have.length(0);
  });

  it('should return an array of keys when the input array contains objects with a "key" property', () => {
    const inputArray = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
      { key: 'key3', value: 'value3' },
    ];
    const result = componentRef.getItemsKeys(inputArray);
    expect(result).to.deep.equal(['key1', 'key2', 'key3']);
  });

  it('should return the length of the longest string in the input array', () => {
    const inputArray = ['short', 'a very long string that should be the longest', 'medium'];
    const result = componentRef.getLongestString(inputArray);
    expect(result).to.equal(45);
  });

  it('should return the length of the longest string when the input array contains strings of different lengths', () => {
    const inputArray = ['short', 'medium', 'longest'];
    const result = componentRef.getLongestString(inputArray);
    expect(result).to.equal(7);
  });

  it('should return the length of the longest string when the input array contains strings with the same length', () => {
    const inputArray = ['equal', 'length', 'strings'];
    const result = componentRef.getLongestString(inputArray);
    expect(result).to.equal(7);
  });
});