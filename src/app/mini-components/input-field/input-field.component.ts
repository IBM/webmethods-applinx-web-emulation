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
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Field, InputField, Cursor, Position } from '@ibm/applinx-rest-apis';
import { Subscription } from 'rxjs/internal/Subscription';
import { TabAndArrowsService } from 'src/app/services/navigation/tab-and-arrows.service';
import { ScreenHolderService } from 'src/app/services/screen-holder.service';
import { GXUtils } from 'src/utils/GXUtils';
import { NavigationService } from '../../services/navigation/navigation.service';
import { StorageService } from '../../services/storage.service';

enum GXDataTypes {
  ALPHANUMERIC = 'ALPHANUMERIC',
  NUMERIC = 'NUMERIC',
  ALPHA_ONLY = 'ALPHA_ONLY', //(AS/400)
  DIGITS_ONLY = 'DIGITS_ONLY',  //(AS/400)
  SIGNED_NUMERIC = 'SIGNED_NUMERIC',  //(AS/400)
  KATAKANA_SHIFT = 'KATAKANA_SHIFT',  //(AS/400 Japanese katakana only field)
  DBCS_ONLY = 'DBCS_ONLY',
  DBCS_CAN_CREATE_SISO = 'DBCS_CAN_CREATE_SISO',
  REVERSED = 'REVERSED'  //(AS/400 Hebrew field)
}

// enum GXDataTypesAllowedChars {
//   NUMERIC = '[0-9.,]*',//"01234567890.,"
//   DIGITS_ONLY = '[0-9]*', //0123456789"
//   SIGNED_NUMERIC = '[0-9.,+-]*', //"01234567890.,-+"
//   ALPHA_ONLY = '[a-zA-Z]*',
//   ANY = '.*'
// }

@Component({
    selector: 'app-input-field',
    templateUrl: './input-field.component.html',
    styleUrls: ['./input-field.component.scss'],
    standalone: false
})
export class InputFieldComponent implements OnChanges, OnInit, OnDestroy {

  @ViewChild('inputElement') inputElement: ElementRef;
  @Input() field: Field;
  inputField: InputField;
  fgClass: string;
  bgClass: string;
  screenInitializedSubscription: Subscription;

  @HostListener('keypress', ['$event'])
  onKeyPress(event: any): void {
    let pressedKey = event.key;
    let fieldDataType = this.field.datatype;
    if (((fieldDataType == GXDataTypes.NUMERIC) && ((!/[0-9,.]/.test(pressedKey)))) || 
        ((fieldDataType == GXDataTypes.DIGITS_ONLY) && ((!/[0-9]/.test(pressedKey)))) ||
        ((fieldDataType == GXDataTypes.SIGNED_NUMERIC) && ((!/[0-9.,+-]/.test(pressedKey)))) ||
        ((fieldDataType == GXDataTypes.ALPHA_ONLY) && ((!/[a-zA-Z]/.test(pressedKey))))){
      event.preventDefault();
    } 
  }

  constructor(private navigationService: NavigationService, public storageService: StorageService,
    private tabAndArrowsService: TabAndArrowsService, private doms: DomSanitizer,
    private screenHolderService: ScreenHolderService) { }

  ngOnInit(): void {
    if (!this.isFieldCursorPosition(this.navigationService.getCursorPosition())) {
      return;
    }
    this.screenInitializedSubscription = this.screenHolderService.screenInitialized.subscribe(initialized => {
      if (initialized) {
        if (this.field.positionInWindow) {
          this.tabAndArrowsService.setMatrixPosition(this.field.positionInWindow);
        }
        setTimeout(() => this.inputElement.nativeElement.focus(), 30);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.field.content && this.field.content.trim() === '') {
      this.field.content = '';
    }
    const field: Field | any = changes.field.currentValue;
    this.inputField = new InputField();
    if (field.name?.length > 0) {
      this.inputField.setName(field.name);
    }
    if (field.multiple) {
      this.inputField.setIndex(field.index);
    }
    this.inputField.setValue(field.content);
    if (field.position) {
      this.inputField.setPosition(field.position);
    }

    if (this.field.foreground || field.fgColor) {
      this.fgClass = GXUtils.getFgCssClass(this.field.foreground ? this.field.foreground : field.fgColor, this.field.isIntensified ? this.field.isIntensified : field.highIntensified);
      // console.log("@@@@@@@@@@@@@@ fgClass = ", this.fgClass);
    }
    if (this.field.background || field.bgColor) {
      this.bgClass = GXUtils.getBgCssClass(this.field.background ? this.field.background : field.bgColor);
      // console.log("############## bgClass = ", this.bgClass);

    }
  }

  onValueChange(value: string): void {
    this.inputField.setValue(value);
    this.navigationService.setSendableField(this.inputField);
    this.updateCursorPosition();
  }

  private getActiveCursor(): Cursor {
    return new Cursor(this.computeCursorPosition(), this.inputField.name, this.inputField.index)
  }

  private updateCursorPosition(): void {
    this.navigationService.setCursorPosition(this.getActiveCursor(), this.field.positionInWindow);
  }

  onFocus(): void {
    this.updateCursorPosition();
  }

  private computeCursorPosition() {
    if (this.inputElement.nativeElement.selectionStart != null) {
      return new Position(this.inputField.position.row, this.inputField.position.column + this.inputElement.nativeElement.selectionStart);
    }
    return this.inputField.position;
  }

  getDataType(field: Field): string {

    if (!field.visible) {
      return 'password';
    }
    return 'text';
  }

  // getPattern(field: Field): string {
  //   if (field.datatype === GXDataTypes.NUMERIC) {
  //     return GXDataTypesAllowedChars.NUMERIC;
  //   }
  //   if (field.datatype == GXDataTypes.DIGITS_ONLY) {
  //     return GXDataTypesAllowedChars.DIGITS_ONLY;
  //   }
  //   if (field.datatype == GXDataTypes.SIGNED_NUMERIC) {
  //     return GXDataTypesAllowedChars.SIGNED_NUMERIC;
  //   }
  //   if (field.datatype == GXDataTypes.ALPHA_ONLY) {
  //     return GXDataTypesAllowedChars.ALPHA_ONLY;
  //   }
  //   return GXDataTypesAllowedChars.ANY;
  // }

  private isFieldCursorPosition(cursor: Cursor): boolean {
    const fld = this.field;
    return ((fld.name === cursor.fieldName) || (cursor.position &&
      this.field.position?.row === cursor.position.row &&
      this.field.position?.column === cursor.position.column));
  }

  get position() {
    const pos = this.field.positionInWindow ? this.field.positionInWindow : this.field.position;
    const template = {
      'grid-row-start': pos.row,
      'grid-column-start': pos.column,
      'grid-column-end': (this.field.length > 1) ? (pos.column + this.field.length) : (pos.column + 2),
      'direction': this.storageService.getLanguage().typingDirectionRTL ? 'rtl' : 'ltr'
    }
    return template;
  }

  getCss() {
    // console.log("this.field.style : ", this.field.style)
    return this.doms.bypassSecurityTrustStyle(this.field.style ?? '');
  }

  ngOnDestroy(): void {
    if (this.screenInitializedSubscription) {
      this.screenInitializedSubscription.unsubscribe();
    }
  }
}
