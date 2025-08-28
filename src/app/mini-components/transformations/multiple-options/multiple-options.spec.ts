import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MultipleOptionsComponent } from './multiple-options.component';
import { Field, InfoService, MultipleOptionsTransformation, ScreenService } from '@ibm/applinx-rest-apis';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { NavigationService } from 'src/app/services/navigation/navigation.service';
import { MessagesService } from 'src/app/services/messages.service';
import { SharedService } from 'src/app/services/shared.service';
import { ScreenHolderService } from 'src/app/services/screen-holder.service';
import { UserExitsEventThrowerService } from 'src/app/services/user-exits-event-thrower.service';
import { ScreenProcessorService } from 'src/app/services/screen-processor.service';
import { ScreenLockerService } from 'src/app/services/screen-locker.service';
import { ModalService, PlaceholderService } from 'carbon-components-angular';
import { JSMethodsService } from 'src/common/js-functions/js-methods.service';
import { KeyboardMappingService } from 'src/app/services/keyboard-mapping.service';
import { NGXLogger } from 'ngx-logger';
import { SimpleChange, SimpleChanges } from '@angular/core';

describe('MultipleOptionsComponent', () => {
  let component: MultipleOptionsComponent;
  let fixture: ComponentFixture<MultipleOptionsComponent>;
  let screenService: ScreenService;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleOptionsComponent);
    component = fixture.componentInstance;
    screenService = TestBed.inject(ScreenService);
    //  navigationServiceSpy = TestBed.inject(NavigationService) as jasmine.SpyObj<NavigationService>;
  });

  it('should set entries and radioValue correctly on ngOnInit', () => {
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
        setName: jasmine.createSpy(),
        setIndex: jasmine.createSpy(),
        setValue: jasmine.createSpy(),
        setPosition: jasmine.createSpy(),
      } as any
    };

    component.transform = transform;
    component.ngOnInit()
    expect(component.entries.length).toEqual(3);


    const transform2: MultipleOptionsTransformation = {
      ...transform,
      multipleOptionsType: 'Radio Buttons',
      field: {
        row: 0,
        content: 'two',
        position: 'top',
        index: 0,
        occurenceIndex: 0,
        setName: jasmine.createSpy(),
        setIndex: jasmine.createSpy(),
        setValue: jasmine.createSpy(),
        setPosition: jasmine.createSpy(),
      } as any
    };
    const changes = { transform: new SimpleChange(transform, transform2, false) }
    component.transform = transform2;
    component.ngOnInit();
    expect(component.radioValue).toEqual('two');
  });

  it('should set inputField name, index, value, and position correctly', () => {
    const field: Field = {
      name: 'testName',
      multiple: true,
      index: 1,
      content: 'testContent',
      position: { row: 1, column: 2 },
      setPosition: void 0,
    }
    const changes: SimpleChanges = {
      transform: {
        currentValue: { field },
        previousValue: { field: null },
        firstChange: true,
        isFirstChange: () => true
      }
    };

    component.ngOnChanges(changes);

    expect(component.inputField.name).toEqual('testName');
    expect(component.inputField.index).toEqual(1);
    expect(component.inputField.value).toEqual('testContent');
    expect(component.inputField.position).toEqual({ row: 1, column: 2 });
  });
  it('should return an array of keys from the input array', () => {
    const inputArray = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
      { key: 'key3', value: 'value3' }
    ];

    const result = component.getItemsKeys(inputArray);

    expect(result).toEqual(['key1', 'key2', 'key3']);
  });

  it('should return an empty array when the input array is empty', () => {
    const inputArray: any[] = [];

    const result = component.getItemsKeys(inputArray);

    expect(result).toEqual([]);
  });

  it('should return an array of keys when the input array contains objects with a "key" property', () => {
    const inputArray = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
      { key: 'key3', value: 'value3' }
    ];

    const result = component.getItemsKeys(inputArray);

    expect(result).toEqual(['key1', 'key2', 'key3']);
  });

  it('should return the length of the longest string in the input array', () => {
    const inputArray = ['short', 'a very long string that should be the longest', 'medium'];

    const result = component.getLongestString(inputArray);

    expect(result).toEqual(45);
  });

  it('should return the length of the longest string when the input array contains strings of different lengths', () => {
    const inputArray = ['short', 'medium', 'longest'];

    const result = component.getLongestString(inputArray);

    expect(result).toEqual(7);
  });

  it('should return the length of the longest string when the input array contains strings with the same length', () => {
    const inputArray = ['equal', 'length', 'strings'];

    const result = component.getLongestString(inputArray);

    expect(result).toEqual(7);
  });


});
