/*
 * Copyright 2022 Software AG
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
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import { CheckboxTransformation, InputField, Cursor } from '@softwareag/applinx-rest-apis';
import {NavigationService} from '../../../services/navigation/navigation.service';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.css']
})
export class CheckboxComponent implements OnChanges {

  @Input() transform: CheckboxTransformation;
  inputField: InputField;

  constructor(private navigationService: NavigationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    const field = changes.transform.currentValue.field;
    this.inputField = new InputField();
    this.inputField.setName(field.name);
    this.inputField.setValue(field.content);
    this.inputField.setPosition(field.position);
    this.inputField.setIndex(field.index);
  }

  onSelect(event: any): void {
    if (event.target.checked) {
      this.inputField.setValue(this.transform.checkedValue);
    } else {
      this.inputField.setValue(this.transform.uncheckedValue);
    }
    this.navigationService.setSendableField(this.inputField);
  }

  onFocus(): void {
    this.navigationService.setCursorPosition(new Cursor(this.inputField.position, this.inputField.name, this.inputField.index));
  }
}
