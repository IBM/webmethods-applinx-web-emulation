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
import { DomSanitizer } from '@angular/platform-browser';
import { StorageService } from 'src/app/services/storage.service';
import { GXUtils } from 'src/utils/GXUtils';
import {Field} from '@ibm/applinx-rest-apis';

@Component({
  selector: 'app-field',
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.scss']
})
export class FieldComponent implements OnChanges {

  @Input() field: Field;
  fgClass: string;
  bgClass: string;
  content: string[];

  constructor(public storageService: StorageService, private doms : DomSanitizer) {
    this.field?console.log(">>@constructor>>> this.field.content = ", this.field.content):"";
    this.field?console.log(">>@constructor>>> this.field.visualContent = ", this.field.visualContent):"";
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.field) {
      this.handleColors();
      this.handleLanguage();
    }
  }

  handleColors(): void {
    if (this.field.foreground) {
      this.fgClass = GXUtils.getFgCssClass(this.field.foreground, this.field.isIntensified);
    }
    if (this.field.background) {
      this.bgClass = GXUtils.getBgCssClass(this.field.background);
    }
  }

  handleLanguage(): void {
    if (this.field.visualContent) {
      this.content = this.field.visualContent.split('');
    } else {
      this.content = this.field.content.split('');
    }
  }

  get position() {
    const pos = this.field.positionInWindow ? this.field.positionInWindow : this.field.position;
    let length: number | string = 'auto';
    if (GXUtils.isPositiveNumber(this.field.length)) {
      length = pos.column + this.field.length;
    } else if (GXUtils.isPositiveNumber(this.content?.length)) {
      length = pos.column + this.content.length;
    }
    const template = {
      'grid-row-start': pos.row, 
      'grid-column-start': pos.column,
      'grid-column-end': length,
      'text-decoration': this.field.underlined ? 'underline' : '',
      'overflow': 'hidden'
    }
    return template;
  }

  getCss() {
    return this.doms.bypassSecurityTrustStyle(this.field.style ?? '');
  }
}