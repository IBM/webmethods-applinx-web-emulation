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
import { Component, Input, OnChanges, SimpleChanges, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TableTransformation, InputField } from '@ibm/applinx-rest-apis';
import { NavigationService } from '../../../services/navigation/navigation.service';
import { TableModel, TableHeaderItem, TableItem } from 'carbon-components-angular';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    standalone: false
})
export class TableComponent implements OnChanges {

  model = new TableModel();
  tableData = [];
  headerArray = [];
  entries = []; 

  @Input() transform: TableTransformation;
  @ViewChild('dropdownTemplate', { static: true }) dropdownTemplate: TemplateRef<any>;

  constructor(private navigationService: NavigationService) { }

  onInputValueChange(inputField: InputField): void {
    this.navigationService.setSendableField(inputField);
  }

  ngOnChanges(changes: SimpleChanges): void {
    
  }

  ngOnInit() {
    let colDetails = this.transform.table.cols;
    let rowDetails = this.transform.table.rows[0].items;
    rowDetails.forEach((element, index) => {
      let colCaption = colDetails[index].caption;
      let colDataLength = element.length;
      if (colCaption.length > colDataLength) {
        colDetails[index].caption = colDetails[index].caption.substr(0, colDataLength);
        colDetails[index]["tooltip"] = colCaption;
      } else {
        colDetails[index]["tooltip"] = colDetails[index].caption;
      }
    })

    colDetails.forEach(item => {
      this.model.header.push(new TableHeaderItem({ data: item.caption }))
      this.headerArray.push(item.appFieldName);
    })
    let colDetail = [];
    let colDetailObj = []

    this.transform.table.rows.forEach((row, index) => {
      let rowItem = row.items;
      let tableDateObj = {};
      rowItem.forEach((element, colIndex) => {
        if (element.type && element.type == "MultipleOptionsTransformation") {
          let tempElement = element.items; 
          tempElement.forEach(entry => {
            entry["content"] = entry.key;
            entry["selected"] = (entry.value.trim()!== "")?false: true;
            console.log(entry)
          });
          this.entries = element.items;
           colDetailObj.push(new TableItem({ data: {}, template: this.dropdownTemplate }));
        } else {
          colDetailObj.push(new TableItem({ data: element.content }))
        }
      });
      colDetail.push(colDetailObj);
      colDetailObj = [];
    })
    this.model.data = colDetail;
  }

  createDropdown(itemName: string) {
    return `<cds-dropdown>             
                <cds-dropdown-list [items]="entries"></cds-dropdown-list>
            </cds-dropdown>`;
  }

  onSelect(event) {
    console.log('Selected option:', event);
  }

}

