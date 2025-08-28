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
import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { LineTransformation, Field, Position } from '@ibm/applinx-rest-apis';

@Component({
    selector: 'app-line',
    templateUrl: './line.component.html',
    styleUrls: ['./line.component.scss'],
    standalone: false
})
export class LineComponent implements OnInit, OnChanges {

  @Input() transform: LineTransformation;
  field: Field;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const lineTransform: LineTransformation = changes.transform.currentValue;
    if (lineTransform.caption.text) {
      this.field = new Field();
      this.field.position = new Position(lineTransform.position.row, lineTransform.position.column);
      this.field.content = lineTransform.caption.text;
      this.field.visible = true;
      this.field.protected = true;
    }
  }

}
