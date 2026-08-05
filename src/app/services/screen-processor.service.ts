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
import { Injectable } from '@angular/core';
import {
  AbstractTransformation,
  Field,
  GXScreenRectangle,
  Position,
  CalendarTransformation,
  TableTransformation
} from '@ibm/applinx-rest-apis';
import { GXUtils } from 'src/utils/GXUtils';
import RBush from 'rbush';

@Injectable({
  providedIn: 'root'
})
export class ScreenProcessorService {

  private tree: RBush<Rectangle>;

  constructor() { }

  /**
   * Remove fields from screen according to the screen transformations.
   * @param fields - ApplinX's protected and unprotected fields.
   * @param transforms - ApplinX's screen transformations.
   * @returns - array of fields that does not collides with transformations.
   */
  public processRegionsToHide(fields: Field[], transforms: AbstractTransformation[]): Field[] {
    if (!transforms || !fields || transforms.length === 0 || fields.length === 0) {
      return fields || [];
    }

    this.initTree(transforms); 
    return this.filterCollisions(fields);
  }

  /**
   * Initial the tree and insert all the regions that should be hidden.
   * @param transforms - ApplinX's screen transformations.
   */
  private initTree(transforms: AbstractTransformation[]): void {
    if (!this.tree) {
      this.tree = new RBush<Rectangle>();
    } else {
      this.tree.clear();
    }

    transforms.forEach(transform => {

      transform.regionsToHide?.forEach(region => {
        this.tree.insert(new Rectangle(region, transform.type));
      });

      if ('leadingLabel' in transform) {
        const leadingLabel = (transform as any).leadingLabel;
        const isCalendarTransform = (transform as AbstractTransformation).type.startsWith('Calendar');

        if (isCalendarTransform) 
          this.processCalendar(transform, leadingLabel);       
        else
          leadingLabel?.regionsToHide?.forEach(reg => 
            this.tree.insert(new Rectangle(reg, 'leadingLabel')));       
      }

      if (transform.type.startsWith('Table')) {
        const tableTransform = transform as TableTransformation;
        const header = tableTransform.table.headerCoordinates;
        const body = tableTransform.table.cornersCoordinates;
        body.bottomRight.row = body.topLeft.row + tableTransform.table.rows.length
        const rect = new GXScreenRectangle(header?.topLeft || body.topLeft, body.bottomRight);
        this.tree.insert(new Rectangle(rect, 'Table'));
      }
    });
  }

  // VULN-012: cap total field array size to prevent O(n²) memory/CPU DoS from
  // crafted overlapping transformation rectangles in the ApplinX REST response.
  private static readonly MAX_FIELDS = 10000;

  private filterCollisions(fields: Field[]): Field[] {
    const filtered = new Array<Field>();
    for (let i = 0; i < fields.length; i++) {
      // VULN-012: abort if array has grown beyond safe limit.
      if (fields.length > ScreenProcessorService.MAX_FIELDS) {
        console.warn(`filterCollisions: MAX_FIELDS (${ScreenProcessorService.MAX_FIELDS}) exceeded — truncating to prevent DoS`);
        break;
      }
      let field = fields[i];
      if (field) {
        const pos = this.getFieldPosition(field);
      
        const collisions = this.tree.search({
          minX: pos.column,
          maxX: (field.length + pos.column - 1) || (field.content?.length + pos.column - 1),
          minY: pos.row,
          maxY: pos.row
        });

        if (!collisions || collisions.length === 0) filtered.push(field);
        else {
          for (let j = 0; j < collisions.length && field; j++) {
            const rect = collisions[j];
            if (this.isFieldContainsRect(field, rect)) {
              // VULN-012: use push() instead of concat() to mutate in-place (O(1) amortised
              // instead of O(n) allocation), and stay within MAX_FIELDS guard above.
              const split = this.splitField(field, rect);
              split.forEach(f => fields.push(f));
              field = null;
            } else {
              field = this.cutField(field, rect);
            }
          }
          if (field) filtered.push(field);
        }
      }
    }
    return filtered;
  }

  // Check if a rectangle is contained in field
  private isFieldContainsRect(field: Field, rect: Rectangle): boolean {
    if (!field || !rect) return false;
    const fieldPos = field.positionInWindow ?? field.position;
    return (fieldPos.column < rect.minX && fieldPos.column + field.length > rect.maxX) 
  }

  // split field into 2 fields because original field containes a rectangle that should be hidden.
  private splitField(field: Field, rect: Rectangle): Field[] {
    if (!field || !rect) return [];
    const f1 = JSON.parse(JSON.stringify(field));
    const f2 = JSON.parse(JSON.stringify(field));

    // VULN-021: clamp rect coordinates to valid string bounds before substring() calls.
    // Server-supplied rect.minX/maxX may be out of range — JavaScript's substring() is bounds-safe
    // but returns empty/incorrect content silently. We clamp to produce meaningful results.
    const contentLen = f1.content?.length ?? 0;
    const clampedMinX = Math.max(0, Math.min(rect.minX - 1, contentLen));
    const clampedMaxX = Math.max(0, Math.min(rect.maxX, contentLen));
    // VULN-006: use optional chaining so null content returns '' instead of throwing TypeError.
    f1.content = f1.content?.substring(0, clampedMinX) ?? '';
    f2.content = f2.content?.substring(clampedMaxX) ?? '';
    f1.length = f1.content.length;
    f2.length = f2.content.length;
    f2.name = f2.name + 'split';
    const f2position = f2.positionInWindow ?? f2.position;
    f2position.column = rect.maxX + 1;

    return [f1, f2];
  }

  // Cut field parts which collides with rectangle. If field collides completely then return null.
  private cutField(field: Field, rect: Rectangle): Field {
    if (!field || !rect) return field;
    // if (!field.content || rect.data?.startsWith('Table')) return null; //Fix for APX-14287

    const fieldPos = field.positionInWindow ?? field.position;
    if (fieldPos.column >= rect.minX && fieldPos.column + field.length <= rect.maxX) 
      return null;
    
    // VULN-023: clamp rect coordinates to valid string bounds before substring() calls.
    // Server-supplied rect.minX/maxX may be out of range — mirrors the fix applied to splitField() for VULN-021.
    const contentLen = field.content?.length ?? 0;
    if (fieldPos.column <= rect.minX) {
      const clampedMinX = Math.max(0, Math.min(rect.minX + 1, contentLen));
      // VULN-006: optional chaining guards null content in cutField — mirrors splitField fix.
      field.content = field.content?.substring(fieldPos.column, clampedMinX) ?? '';
    } else {
      const clampedMaxX = Math.max(0, Math.min(rect.maxX + 1, contentLen));
      field.content = field.content?.substring(clampedMaxX) ?? '';
      fieldPos.column = rect.maxX + 1;
    }
    field.length = field.content.length;

    return field;
  }

  /**
   * Shift required transformations to table cells (td's)
   * @param transforms - all the screen transformations
   * @param tableTransform - ApplinX's table transformation
   */
   public processTable(fields: Field[] = [], transforms: AbstractTransformation[], tableTransform: TableTransformation): void {
    this.removeTableHeader(tableTransform); 
    const fieldMap = new Map<string, number>();
    fields.forEach((f, i) => {
      if (f) fieldMap.set(f.name, i);
    });

    const tableData = new Map<string, Position>();
    tableTransform.table.rows.forEach((tr, i) => {
      tr.items.forEach((td, j) => {
        if (td?.position) {
          tableData.set(td.position.row + ',' + td.position.column, new Position(i, j));
        }
        // Hiding required fields according to fieldsMap
        // Hide field if has similar id to any td.
        if (fieldMap.has(td.name)) fields[fieldMap.get(td.name)] = null;
      });
    });
    transforms.forEach((transform) => {
      if (transform.position) {
        const posInTable = tableData.get(transform.position?.row + ',' + transform.position?.column);
        if (posInTable) {
          tableTransform.table.rows[posInTable.row].items[posInTable.column] = transform;
          transform.inTableCell = true;
        }
      }
    })
  }

  private removeTableHeader(tableTransform: TableTransformation): void {
    const headerCoordinates: GXScreenRectangle = tableTransform.table.headerCoordinates;
    if (headerCoordinates.topLeft.row === 0 || headerCoordinates.topLeft.column === 0
              || headerCoordinates.bottomRight.row === 0 || headerCoordinates.bottomRight.column === 0 ) {
      tableTransform.table.headerCoordinates = null;
    }
  }

  private processCalendar(transform: AbstractTransformation, leadingLabel: any) {
    let dateInputs = new Set<string>();
    let calendar = transform as CalendarTransformation;
    if (calendar.dateInputFields.length == 1) {
      calendar.dateInputFields.forEach(i => {
        const inputPos = GXUtils.posToString(i?.field?.position);
        if (inputPos)
          dateInputs.add(inputPos);
      });
      leadingLabel?.regionsToHide?.forEach(reg => {
        const pos = GXUtils.posToString({ row: reg.topLeft.row, column: reg.topLeft.column });
        if (dateInputs.has(pos))
          this.tree.insert(new Rectangle(reg, 'Calendar'));
      });
    }
  }

  private getFieldPosition(field: Field): Position {
    return field.positionInWindow ? field.positionInWindow : field.position;
  }
}

class Rectangle {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  data?: any; // optional additional info

  constructor(rect: GXScreenRectangle, additionalInfo?: any) {
    this.minX = rect.topLeft.column;
    this.maxX = rect.bottomRight.column;
    this.minY = rect.topLeft.row;
    this.maxY = rect.bottomRight.row;
    this.data = additionalInfo;
  }
}