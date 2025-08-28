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
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import { MenuTransformation, Field, Position, InputField } from '@ibm/applinx-rest-apis';

import {NavigationService} from '../../../services/navigation/navigation.service';

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    standalone: false
})
export class MenuComponent implements OnChanges {

  @Input() transform: MenuTransformation;
  field: Field;

  constructor(private navigationService: NavigationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    const inputPosition = changes.transform.currentValue.inputPosition;
    this.field = new Field();
    this.field.setPosition(new Position(inputPosition.row, inputPosition.column));
  }

  onClick(actionValue: any): void {
    const inputField = new InputField();
    inputField.setPosition(new Position(this.field.position.row, this.field.position.column));
    inputField.setValue(actionValue);
    this.navigationService.setSendableField(inputField);
    this.navigationService.sendKeys('[enter]');
  }

  onInputValueChange(inputField: InputField): void{
    this.navigationService.setSendableField(inputField);
  }

}
