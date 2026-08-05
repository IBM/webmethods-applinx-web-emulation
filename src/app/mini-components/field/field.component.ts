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
import { StorageService } from 'src/app/services/storage.service';
import { GXUtils } from 'src/utils/GXUtils';
import {Field} from '@ibm/applinx-rest-apis';

@Component({
    selector: 'app-field',
    templateUrl: './field.component.html',
    styleUrls: ['./field.component.scss'],
    standalone: false
})
export class FieldComponent implements OnChanges {

  @Input() field: Field;
  fgClass: string;
  bgClass: string;
  content: string[];

  constructor(public storageService: StorageService) {
    // VULN-014: debug console.log() removed — FieldComponent is instantiated 100-400+ times
    // per screen render; logging field.content exposes all terminal PII (account numbers,
    // PINs, transaction data) unconditionally in production at 1,200-4,800 entries/minute.
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

  /** Allowed CSS properties for server-supplied field.style (terminal presentation only). */
  private static readonly ALLOWED_CSS_PROPS = new Set([
    'color', 'background-color', 'font-weight', 'font-style', 'font-size',
    'text-decoration', 'text-align', 'visibility', 'opacity',
    'border', 'border-color', 'border-style', 'border-width',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  ]);

  /** Parse field.style into an object containing only allowlisted properties. */
  getCss(): { [key: string]: string } {
    const raw = this.field.style ?? '';
    if (!raw) {
      return {};
    }
    const result: { [key: string]: string } = {};
    for (const declaration of raw.split(';')) {
      const colon = declaration.indexOf(':');
      if (colon === -1) {
        continue;
      }
      const prop = declaration.substring(0, colon).trim().toLowerCase();
      const value = declaration.substring(colon + 1).trim();
      // VULN-002: block CSS comment injection (url/**/) and hex-escape sequences (\XX)
      // in addition to the existing url()/expression()/javascript: guards.
      if (FieldComponent.ALLOWED_CSS_PROPS.has(prop) && value &&
          !/url\s*\(|expression\s*\(|javascript\s*:/i.test(value) &&
          !/\/\*/.test(value) &&
          !/\\[0-9a-fA-F]/.test(value)) {
        result[prop] = value;
      }
    }
    return result;
  }
}
