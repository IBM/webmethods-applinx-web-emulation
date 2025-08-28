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
import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {CalendarTransformation, Cursor, Field, InputField } from '@ibm/applinx-rest-apis';
import {NavigationService} from '../../../services/navigation/navigation.service';
import { GXUtils } from 'src/utils/GXUtils';
declare var $: any;

@Component({
    selector: 'app-calendar',
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.scss'],
    standalone: false
})
export class CalendarComponent implements OnInit, OnChanges {

  // @ViewChild('datepickerIcon') datepickerIcon: ElementRef;
  @Input() transform: CalendarTransformation;
  sendableField: InputField;
  field: Field;
  toggleId: string;
  placeholder: string;
  defaultDate : any;
  defaultLabel: string;
  defaultFormat : string ="";
  calenderFieldCount: number = 0;
  monthListShort = [
    "Jan", // January
    "Feb", // February
    "Mar", // March
    "Apr", // April
    "May", // May
    "Jun", // June
    "Jul", // July
    "Aug", // August
    "Sep", // September
    "Oct", // October
    "Nov", // November
    "Dec"  // December
];
 format1 = "M. d, Y";
 format2 = "m/d/Y";
 format3 = "d/m/y";
 format4 = "m-Y"; 
 format5 = "d.m.y";
  constructor(private navigationService: NavigationService) { }

  ngOnInit(): void {
    this.calenderFieldCount = this.transform.dateInputFields.length;
    if (this.calenderFieldCount == 1){
        this.defaultDate = this.field.content?.trim();
        this.defaultLabel = this.transform.leadingLabel["transformName"];
        this.setDateAndFormat(this.transform.dateInputFields[0].format, this.field.content);
    }
    else if (this.calenderFieldCount == 2){
      // TO Do : code for 2 field calendar
    }
    else if (this.calenderFieldCount == 3){
      // TO DO : code for 3 field calendar
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.calenderFieldCount = changes.transform.currentValue["dateInputFields"].length;
    if (this.calenderFieldCount == 1){
        this.field = changes.transform.currentValue.dateInputFields[0].field;
        console.log("@ngOnChanges field : ", this.field)
        this.sendableField = new InputField();
        this.sendableField.setValue(this.field.content);
        this.sendableField.setPosition(this.field.position);
        this.sendableField.setIndex(this.field.index);
        this.sendableField.setName(this.field.name);
    }else if (this.calenderFieldCount == 2){
      // TO Do : code for 2 field calendar
    }
    else if (this.calenderFieldCount == 3){
      // TO DO : code for 3 field calendar
    } 
  }

  onFocus(): void {
    this.navigationService.setCursorPosition(new Cursor(this.sendableField.position, this.sendableField.name, this.sendableField.index));
  }

  valueChange(event){
    let updatedDate = new Date(event[0]);
    this.formatDefaultDate(this.defaultFormat, updatedDate.toString())
    this.sendableField.setValue( this.defaultDate);
    this.navigationService.setSendableField(this.sendableField);
  }

  setDateAndFormat(oldFormat : string, oldDate : string ){
    // console.log("@setDateAndFormat : oldFormat : ", oldFormat)
    // console.log("@setDateAndFormat : oldDate : ", oldDate)
    switch (oldFormat){
      case "MMM. d, yyyy": // eg: Dec. 12, 2024
        this.defaultFormat =  "M. d, Y";
        break;
      case "MM/dd/yyyy": // eg: 12/31/2024 
        this.defaultFormat =  "m/d/Y";
        break;
      case "d/M/yy": // eg: 31/12/24
        this.defaultFormat =  "d/m/y";
        break;
      case "MM-yyyy": // eg: 12-2024
        this.defaultFormat =  "m-Y";
        break;
      case "dd.MM.yy": //eg: 31.12.24 
        this.defaultFormat =  "d.m.y"
        break;
      case "dd/MM/yyyy": //eg: 31.12.24 
        this.defaultFormat =  "d/m/Y"
        break;
      case "dd": //eg: 31
        this.defaultFormat =  "d"
        break;
      case "MM": //eg: 12
        this.defaultFormat =  "m"
        break;
      case "yyyy": //eg: 2024 
        this.defaultFormat =  "Y"
        break;
    }
   this.formatDefaultDate(this.defaultFormat, oldDate)
  }

  formatDefaultDate(format : string, oldDate : string){
    console.log("OLD DATE ", oldDate)
    if(oldDate.trim() != ""){
        let tempDate = new Date(oldDate);
        let formattedYear = 0;
        let formattedMonth = "";
        let formattedDate = "";
        console.log("Temp Date : ",tempDate);
        if (format == this.format1){ // eg: Dec. 12, 2024
          formattedYear = tempDate.getFullYear();
          formattedDate = tempDate.getDate() < 10? "0"+tempDate.getDate():tempDate.getDate().toString();
          formattedMonth = this.monthListShort[tempDate.getMonth()];
          this.defaultDate = formattedMonth +". " + formattedDate + ", " + formattedYear
        } else if (format == this.format2){ // eg: 12/31/2024 
          formattedYear = tempDate.getFullYear();
          formattedDate = tempDate.getDate() < 10? "0"+tempDate.getDate():tempDate.getDate().toString();
          // let tempMonth = tempDate.getMonth() + 1;
          formattedMonth = this.formatMonth(tempDate);// (tempMonth < 10)? "0"+tempMonth.toString():tempMonth.toString();
          this.defaultDate = formattedMonth +"/"+ formattedDate +"/"+ formattedYear
        }else if (format == this.format3){ // eg: 31/12/24
          formattedYear = tempDate.getFullYear()%100; 
          formattedDate = tempDate.getDate() < 10? "0"+tempDate.getDate():tempDate.getDate().toString();
          let tempMonth = tempDate.getMonth() + 1; 
          formattedMonth = (tempMonth < 10)? "0"+tempMonth.toString():tempMonth.toString();
          this.defaultDate = formattedDate +"/"+ formattedMonth +"/"+ formattedYear
        }else if (format == this.format4){ // eg: 12-2024
          formattedYear = tempDate.getFullYear();
          formattedMonth = this.formatMonth(tempDate);
          // let tempMonth = tempDate.getMonth() + 1; 
          // formattedMonth = (tempMonth < 10)? "0"+tempMonth.toString():tempMonth.toString();
          this.defaultDate = formattedMonth +"-"+ formattedYear;
        }else if (format == this.format5){ //eg: 31.12.24 
          formattedYear = tempDate.getFullYear()%100; 
          formattedDate = tempDate.getDate() < 10? "0"+tempDate.getDate():tempDate.getDate().toString();
          let tempMonth = tempDate.getMonth() + 1; 
          formattedMonth = (tempMonth < 10)? "0"+tempMonth.toString():tempMonth.toString();
          this.defaultDate = formattedDate +"."+ formattedMonth +"."+ formattedYear 
        }
        console.log("this.defaultDate : ",this.defaultDate);  
      }
  }

  formatMonth(tempDate){
    let tempMonth = tempDate.getMonth() + 1;
    return ((tempMonth < 10)? "0"+tempMonth.toString():tempMonth.toString());
    
  }
}