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
import { Position, MultipleOptionsTransformation, InputField, Field, Cursor } from '@ibm/applinx-rest-apis';
import { GridPosition } from 'src/app/services/navigation/tab-and-arrows.service';

import {NavigationService} from '../../../services/navigation/navigation.service';

@Component({
    selector: 'app-multiple-options',
    templateUrl: './multiple-options.component.html',
    styleUrls: ['./multiple-options.component.scss'],
    standalone: false
})
export class MultipleOptionsComponent implements OnChanges {

  @Input() transform: MultipleOptionsTransformation;
  inputField: InputField;
  radioValue :string| null = null;
  entries : any = [];
  constructor(private navigationService: NavigationService) {
  }

  ngOnInit(){
    if (this.transform.type == "MultipleOptionsTransformation" && this.transform.multipleOptionsType === 'Combobox'){
      let tempElement = this.transform.items; 
      if (tempElement){
        tempElement.forEach(entry => {
          entry["content"] = entry.key;
          entry["selected"] = (entry.value.trim()!== this.transform.field?.content?.trim())?false: true;
          this.entries.push(entry)
        });
      }
    }
    if(this.transform.type == "MultipleOptionsTransformation" && this.transform.multipleOptionsType === 'Radio Buttons'){
        this.radioValue = this.transform.field?.content?.trim();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const field: Field = changes.transform.currentValue.field;
    this.inputField = new InputField();
    if (field.name?.length > 0) {
      this.inputField.setName(field.name);
    }
    if (field.multiple || typeof field.occurrenceIndex === 'number') {
      this.inputField.setIndex(field.index || field.occurrenceIndex);
    }
    this.inputField.setValue(field.content);
    if (field.position) {
      this.inputField.setPosition(field.position);
    }
  }

  getItemsKeys(arr: any[]): string[] {
    const keys = [];
    for (let i = 0; i < arr.length; i++) {
      keys.push(arr[i].key);
    }
    return keys;
  }

  getLongestString(strings: string[]): number {
    let lgth = 0;
    let longest;

    for (let i = 0; i < strings.length; i++){
      if (strings[i].length > lgth){
        lgth = strings[i].length;
        longest = strings[i];
      }
    }
    return longest.length;
  }

  onSelect(value: any): void{
    console.log(">>>>>>>>>>>> Value : ", JSON.stringify(value));
    this.inputField.setValue(value);
    this.navigationService.setSendableField(this.inputField);
  }

  onFocus(eventTarget: any): void {
    let matrixPosition: Position;
    if (eventTarget && eventTarget.type === 'radio') {
      const gp = new GridPosition(eventTarget);
      matrixPosition = {row: gp.rowStart, column: gp.colStart};
    }
    this.navigationService.setCursorPosition(new Cursor(this.inputField.position, this.inputField.name, this.inputField.index), matrixPosition);
  }
}
