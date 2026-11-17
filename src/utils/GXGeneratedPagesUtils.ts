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

import { Field, GetScreenResponse, MenuTransformation, TableTransformation } from "@ibm/applinx-rest-apis";
import { take } from "rxjs/operators";
import { ScreenHolderService } from "src/app/services/screen-holder.service";
import { StorageService } from "src/app/services/storage.service";
import { GXUtils } from './GXUtils'

export class GXGeneratedPagesUtils {

    private static readonly RUNTIME = '{runtime} ';
    
    public static mergeScreens(runtimeScreen: GetScreenResponse, screenModel: GetScreenResponse): GetScreenResponse {
      const fields = this.mergeFields(screenModel.fields, runtimeScreen.fields);
      const transformsAndHostKeys = this.processTransformations(screenModel.transformations, runtimeScreen.transformations);
      runtimeScreen.fields = runtimeScreen.transformations = [];
      const mergedScreen = Object.assign({}, runtimeScreen, screenModel);
      mergedScreen.fields = fields;  
      mergedScreen.transformations = transformsAndHostKeys.transforms || [];
      mergedScreen.hostKeys = transformsAndHostKeys.hostkeys || [];
      return mergedScreen;
    }
  
  private static processTransformations(modelTransforms: any[] = [], runtimeTransforms: any[]): any {
      if (!modelTransforms || modelTransforms?.length == 0) return [];  
      const transformMap = new Map<string, any>();
      let mergedTransforms = [];
      const hostkeys = [];
      const tables = [];
  
      modelTransforms.forEach(t => {
        if (t.type?.startsWith('HostKey')) hostkeys.push(t);
        else if (t.type?.startsWith('Hide')) mergedTransforms.push(t);
        else if (t.type) transformMap.set(this.getTransformId(t), t); 
      })
  
      runtimeTransforms.forEach((t, i, arr) => {
        if (t.type.toLowerCase().startsWith('hostkey')) return;
        const id = this.getTransformId(t);
        if (transformMap.has(id)) {
          const transform = transformMap.get(id);
          transformMap.delete(id); 
          if (transform.leadingLabel) {
            transform.leadingLabel.text = this.getEntityText(t.leadingLabel.text, transform.leadingLabel.text);
          }
          switch(transform.type.replace('Transformation', '')) {
            case 'Table': { 
              const generatedTable = this.processTable(t, transform);
              tables.push(generatedTable);
              break; 
            } 
            case 'Clickable': { 
              transform.triggerText = this.getEntityText(t.triggerText, transform.triggerText);
              mergedTransforms.push(Object.assign({}, t, transform));
              break; 
            } 
            case 'Line': { 
              transform.caption.text = this.getEntityText(t.caption.text, transform.caption.text);
              mergedTransforms.push(Object.assign({}, t, transform));
              break; 
            } 
            case 'Menu': { 
              (transform as MenuTransformation).items.forEach((item, i, items) => {
                items[i].text = this.getEntityText(t.items[i].text, items[i].text);
              });
              mergedTransforms.push(Object.assign({}, t, transform));
              break; 
            }
            case 'Text': {
              transform.text = this.getEntityText(t.text, transform.text);
              mergedTransforms.push(Object.assign({}, t, transform));
              break;
            }
            default: { 
              mergedTransforms.push(Object.assign({}, t, transform));
              break; 
            } 
          } 
          arr[i] = null;
        }
      });
      if (tables.length > 0) {
        const leftovers = runtimeTransforms.filter(t => !t?.type?.startsWith('Table'));
        const array = this.getTransformsOfTable(leftovers, tables);
        if (array.length > 0) {
          mergedTransforms = mergedTransforms.concat(array);
        }
      }
      return {
              transforms: mergedTransforms.concat(tables),
              hostkeys: hostkeys
             };
    }
  
    private static processTable(runtimeTable: TableTransformation, modelTable: TableTransformation): any {
      runtimeTable.table.cols.forEach(runtimeCol => {
        modelTable.table.cols.forEach(modelCol => {
          if (runtimeCol.appFieldName === modelCol.appFieldName) {
            runtimeCol.caption = this.getEntityText(runtimeCol.caption, modelCol.caption);
          }
        })
      })
      return runtimeTable;
    }
  
    private static mergeFields(modelFields: Field[] = [], runtimeFields: Field[]): Field[] {        
      let fieldMap = new Map<string, Field>();
      let mergedFields = [];
      let filteredFields = [];
      modelFields.forEach(f => {
        fieldMap.set(f.name, f)
      });
      runtimeFields.forEach(f => {
        if (fieldMap.has(f.name)) {
          const field = fieldMap.get(f.name);
          field.content = this.getEntityText(f.content, field.content);
          mergedFields.push(Object.assign({}, f, field))
        } else {
          filteredFields.push(f);
        }
      });      
      this.fillHtmlFields(filteredFields);        
      return mergedFields;
    }

    /**
     * Content of an HTML element with ID that matches any host field ID should be binded
     * to the host field content.
     */
    private static fillHtmlFields(fields: Field[]): void {
      if (fields.length === 0) return;

      const screenHolder = StorageService.injector.get(ScreenHolderService);
      screenHolder.screenInitialized.pipe(take(1)).subscribe(() =>
        setTimeout(() => {
          fields.forEach(f => {
            const el = document.getElementById(f.name);
            if (el instanceof HTMLInputElement) el.value = f.content;
            else if (el) el.textContent = f.content;
          })
        })
      )
    }

    private static getEntityText(runtimeText: string, modelText: string): string {
      if (modelText == null || modelText == undefined) return runtimeText;
      if (runtimeText == null || runtimeText == undefined) return modelText;
  
      return modelText.startsWith(GXGeneratedPagesUtils.RUNTIME) ?
                 runtimeText : modelText.replace(GXGeneratedPagesUtils.RUNTIME, '');
    }
  
    private static getTransformId(t: any): string {
      return t.type.startsWith('Table') ? t.table.name : t.type + '|' + t.transformName || GXUtils.posToString(t.position || t.inputPosition);
    }
  
    private static getTransformsOfTable(transforms: any = [], tableTransforms: TableTransformation[]): any[] {
      if (transforms.length == 0) return [];
      const arr = [];
      tableTransforms.forEach(tableTransform => {
        tableTransform.table.rows.forEach(row => {
          row.items.forEach(tableCell => {
            transforms.forEach(transform => {
              if (transform?.position && tableCell) {
                if (transform.position.row === tableCell.position.row && transform.position.column === tableCell.position.column) {
                  arr.push(transform);
                }
              }
            });
          });
        });
      })
      return arr;
    }

}