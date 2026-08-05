import { ChangeDetectionStrategy, Component, OnInit, Inject, Output, EventEmitter, ElementRef, ViewChild, Input, HostListener } from '@angular/core';
import { GXUtils } from 'src/utils/GXUtils';
import { ConfigurationService } from '../services/configuration.service';
import { SharedService } from '../services/shared.service'
import { StorageService } from '../services/storage.service';
import { MacroService } from '@ibm/applinx-rest-apis';
import { Subscription } from 'rxjs';
import { NotificationService } from 'carbon-components-angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-macro',
    templateUrl: './macro.component.html',
    styleUrls: ['./macro.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
    providers: [NotificationService],
    standalone: false
})

export class MacroComponent {
  getMacroSubscription: Subscription;
  label = "Saved Macro List";
  size = "lg";
  macroList: any = [];
  showToastFlag: boolean = false;
  selectedMacro: string = "";
  tempMacroList = "";
  parameter: any
  selViewMacroContent: any;
  selectedMacroObj: object = {};
  viewMacroFlag: boolean;
  recordStop: boolean = false;
  viewMacro: boolean;
  delMacro: boolean;
  recMacro: boolean;
  playMacro: boolean;
  renameMacro: boolean;
  dupMacroFlag: boolean;
  MacroExitsMsg: string;
  macroFileListSubscription: Subscription;
  macroFileViewSubscription: Subscription;
  macroPlaySubscription: Subscription;
  macroDeleteSubscription: Subscription;
  macroSaveSubscription: Subscription;
  applicationName: string;
  token: any;
  user: any;
  validationFlag: boolean = false;
  // VULN-016: removed hardcoded HTTP localhost basePath dead-code field.
  // All macro API calls use macroService from the ApplinX SDK which reads basePath from
  // the Angular environment configuration — this field was never actually used.
  observe = "body";
  reportProgress = false;
  defaultHeaders = new HttpHeaders();
  selectedDelMacro: any;
  selectedPlayMacro: any;
  selectedViewMacro: any;

  @Input() operationType: string;
  @Output() dataEmitter = new EventEmitter<any>();
  @HostListener('document:keydown.escape', ['$event'])
  handleEscKey(event: KeyboardEvent) {
    if (this.playMacro){
      this.onCancelMacro('play')
    }else if (this.recMacro){
      this.onCancelMacro('record')
    }
    else if (this.viewMacro){
      this.onCancelMacro('view')
    }
    else if (this.delMacro){
      this.onCancelMacro('remove')
    }
  }


  constructor(private fileService: ConfigurationService, private macroService: MacroService,
    public dataService: SharedService, private storageService: StorageService, private httpClient: HttpClient,
    private notificationService: NotificationService) {
  }

  ngOnInit() {
    this.applicationName = this.fileService.applicationName;
    this.token = this.storageService.getAuthToken();
    // VULN-010: use JSON.parse() instead of fragile substr(1, length-2) quote-stripping.
    const rawUserName = sessionStorage.getItem('userName');
    this.user = rawUserName ? JSON.parse(rawUserName) : null;
    this.viewMacroFlag = false;
    this.parameter = this.operationType;
    this.getMacroListDetails();
    this.setOperationTypeFlag(this.parameter)
  }

  setOperationTypeFlag(operationType: String) {
    switch (operationType) {
      case GXUtils.ViewMacro:
        this.viewMacro = !this.viewMacro;
        break;
      case GXUtils.DeleteMacro:
        this.delMacro = !this.delMacro;
        break;
      case GXUtils.RecordMacro:
        this.recMacro = !this.recMacro;
        break
      case GXUtils.PlayMacro:
        this.playMacro = !this.playMacro;
        break;
      case GXUtils.stopRecordMacro:
        this.onStopRecordMacro();
        break;
    }
    
  }

  getMacroListDetails() {
    this.tempMacroList = sessionStorage.getItem("macroFileList");
    if(this.tempMacroList){
      this.macroList = this.tempMacroList.split(",");
    }
  }

  onCancelMacro(operation: string) {
    this.setOperationTypeFlag(operation);
    this.dataService.setPopUpFlag(false);
    this.dataService.setCancelFlag(true);
  }

  onDeleteMacro() {
    // VULN-007: validate selectedMacro against MACRO_NAME_PATTERN before passing to the API.
    // selectedMacro is populated from sessionStorage which can be manipulated via XSS.
    // A path-traversal value like '../../../etc/passwd' would become '../../../etc/passwd.json'
    // and be sent directly to the ApplinX delete endpoint without this guard.
    const macroBaseName = this.selectedMacro.replace(/\.json$/, '');
    if (!GXUtils.MACRO_NAME_PATTERN.test(macroBaseName)) {
      this.notificationService.showToast({
        title: 'Delete Macro',
        caption: 'Invalid macro name.',
        duration: 5000,
        type: 'error',
      });
      this.delMacro = false;
      return;
    }
    this.macroDeleteSubscription = this.macroService
      .deleteMacro(this.selectedMacro, this.user, this.applicationName, this.token)
      .subscribe(response => {
        this.notificationService.showToast({
          title: 'Delete Macro',
          caption: "The selected Macro " + macroBaseName + " is deleted successfully!",
          duration: 5000, // Duration in milliseconds (optional)
          type: 'success',
        });
      }, error => {
      })
      this.delMacro = false
      this.dataService.setPopUpFlag(false);
      this.dataService.setCancelFlag(false);
  }

  onViewMacro() {
    this.macroFileViewSubscription = this.macroService
      .viewMacro(this.selectedMacro, this.user, this.applicationName, this.token)
      .subscribe(response => {
        this.selViewMacroContent = response;
        this.selectedMacroObj["name"] = this.selViewMacroContent.name;
        this.setPasswordMask(this.selViewMacroContent.steps)
        this.selectedMacroObj["steps"] = this.selViewMacroContent.steps;
        this.viewMacroFlag = true;
      })
      this.dataService.setCancelFlag(false);
  }

  setPasswordMask(stepsArray) {
    // VULN-006: passwords are now stored as GXUtils.pwdMask ('*') placeholder, not base64.
    // Display '*' for any password field — length is 1 since the mask is a single character.
    stepsArray.forEach(element => {
      if (element.fields && element.fields.length > 0) {
        element.fields.forEach(field => {
          if (field.type && field.type == GXUtils.pwdText) {
            field.value = GXUtils.pwdMask;
          }
        });
      }
    });
  }

  hideDuplicateMsg() {
    this.dupMacroFlag = false;
  }

  onPlayMacro() {
    let playObj = {};
    this.dataService.setPlayMacroFlag(true);
    this.macroFileViewSubscription = this.macroService
      .viewMacro(this.selectedMacro, this.user, this.applicationName, this.token)
      .subscribe(response => {
        this.selViewMacroContent = response;
        this.decryptBeforePlay(response["steps"])
        playObj["steps"] = response["steps"];
        this.macroPlaySubscription = this.macroService
          .playMacro(playObj, this.token).subscribe(response => {
            this.dataService.setPlayMacroFlag(false);
          //  console.log("Response for Play Macro : ", response)
          }, error => {
        //    console.log("Error Response for Play Macro : ", error)
            this.notificationService.showToast({
              title: 'Play Macro',
              caption: error.error.message,
              duration: 5000, // Duration in milliseconds (optional)
              type: 'error',
            });
          })
      });
      this.dataService.setPopUpFlag(false);
      this.setOperationTypeFlag(GXUtils.PlayMacro)
      this.dataService.setCancelFlag(false);
  }

  decryptBeforePlay(steps: any) {
    // VULN-006: password fields now store a mask marker (GXUtils.pwdMask) instead of base64.
    // No base64 decoding needed — if the value is the mask placeholder, prompt the user.
    // Null-guard element.fields to prevent TypeError crash (previously unguarded).
    steps.forEach(element => {
      const fieldsList = element?.fields;
      if (fieldsList && fieldsList.length > 0) {
        fieldsList.forEach(fieldElement => {
          if (fieldElement.type && fieldElement.type == GXUtils.pwdText && fieldElement.value === GXUtils.pwdMask) {
            // Password was not stored — value remains as mask; UI should prompt user at playback.
          }
        });
      }
    });
  }

  clearValidation() {
    this.validationFlag = false;
  }

  onRecordStopColor(flag : boolean){
    return flag;
  }
  onRecordMacro(form: any) {  // Save Macro Start - Check for duplicate Macro Name
    let newMacroName = form.value.txtRecordMacro;
    this.token = this.storageService.getAuthToken();
    let macroNameList = []
    // VULN-011: removed console.log() calls — macro names and API list responses should not
    // be written to the browser console unconditionally in production.
    this.macroFileListSubscription = this.macroService
      .getMacro(this.user, this.applicationName, this.token)
      .subscribe(data => {
        data.fileList?.forEach(file => {
          macroNameList.push(file.substring(0, file.length - 5))
        });
        if (macroNameList.findIndex(item => item == newMacroName) == -1) {
          this.dataService.setMacroRecordFlag(true);
          this.dataService.setMacroDetails(form.value);
          this.recMacro = false;
        } else {
          this.validationFlag = true;
        }
      });
      this.dataService.setPopUpFlag(false);
      this.dataService.setCancelFlag(false);
  }

  onStopRecordMacro() { // Save Macro End - Saves the Macro & its steps in a .json file.
    let newMarcoName = this.dataService.getMacroName();
    let macroObj = {};
    macroObj["steps"] = this.dataService.getMacroSteps();
    let token = this.storageService.getAuthToken();
    // console.log("$$$$$New Macro Name : ", newMarcoName);
    this.macroSaveSubscription = this.macroService
      .saveMacro(macroObj, newMarcoName + ".json", this.user, this.applicationName, token)
      .subscribe(response => {
        //console.log("Save Response : ", response)
        this.dataService.clearMacroObj();
        this.dataService.setMacroRecordFlag(false);
        this.notificationService.showToast({
          title: 'Save Macro',
          caption: "The new Macro " + newMarcoName + " has been saved successfully!",
          duration: 5000, // Duration in milliseconds (optional)
          type: 'success',
        });
      },
        err => {
          // VULN-011: removed console.log(err) — error objects may contain server details.
          this.notificationService.showToast({
            title: 'Save Macro',
            caption: "An Unexpected Error has occured while saving the Macro!",
            duration: 5000, // Duration in milliseconds (optional)
            type: 'error',
          });
        });
        this.dataService.setPopUpFlag(false);
        this.dataService.setCancelFlag(false);
  }

  selected(event: Event) {
    // VULN-007: validate macro name before storing — prevents sessionStorage-injected
    // path-traversal values from reaching the API via onDeleteMacro/onViewMacro/onPlayMacro.
    const name = String(event);
    if (GXUtils.MACRO_NAME_PATTERN.test(name)) {
      this.selectedMacro = name + ".json";
    } else {
      this.selectedMacro = '';
    }
  }

  onCancel(){
    this.recMacro = false;

  }
}