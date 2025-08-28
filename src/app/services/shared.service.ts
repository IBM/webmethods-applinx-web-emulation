import { Injectable, ViewChild, ViewContainerRef } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { ModalService } from 'carbon-components-angular/modal';
import { GXUtils } from '../../utils/GXUtils'
  
@Injectable(
    {    providedIn: 'root'  } // This makes it available application-wide
      )
export class SharedService {
   private dataSubject = new BehaviorSubject<any>(null);
   public data$ = this.dataSubject.asObservable();
   public macroRecordFlag = false;
   public macroRecordArray: any = [];
   public macroName: string;
   public macroDetails: any;
   public macroObj: any = {};
   public macroSaveSubscription: Subscription;
   public applicationName: string = "";
   public snackBarReference : any;
   public snackBarFlag : boolean = false;
   public snackBarRef: any;
   public popUpFlag: boolean = false;
   public playMacroFlag : boolean = false;
   public macroFlag: boolean = false;
   public macroRecordCompleteFlag : boolean = false;
   public cancelFlag: boolean =false;
   public validationObj ={
      "user" :"",
      "token":"",
      "appName": "" 
   }

   cdsToastFlag: any;
   @ViewChild('container', { read: ViewContainerRef, static: true }) container: ViewContainerRef;

   constructor(protected modalService: ModalService ) { }
   // setSharedData(data: any) {
   //    this.sharedData = data;
   // }

   // getSharedData(): any {
   //    return this.sharedData;
   // }

   // setUpdatedData(updatedData: any) {
   //    this.updatedData = updatedData;
   // }

   // getUpdatedData(): any {
   //    return this.updatedData;
   // }

   // setRecMacroTitle(data: any) {
   //    this.recMacroTitle = data;
   // }

   // getRecMacroTitle(): any {
   //    return this.recMacroTitle;
   // }

   // sendData(data: any) {
   //    this.dataSubject.next(data);
   // }

   setCdsToastFlag(flag){
      this.cdsToastFlag = flag;
   }
   getCdsToastFlag(){
      return this.cdsToastFlag;
   }
   setMacroRecordFlag(flag : boolean) {
      this.macroRecordFlag = flag;
   }

   getMacroName(){
      return this.macroName;
   }

   setMacroDetails(name) {
      this.macroDetails = name;
      this.macroName = this.macroDetails["txtRecordMacro"];
   }

   getMacroRecordFlag() {
      return this.macroRecordFlag;
   }

   recordMacro(sendKeysRequest) {
      let fieldsList = sendKeysRequest.fields;
      let passwordFieldList = document.querySelectorAll("input[type='password']") 

      passwordFieldList.forEach(fieldEntry => {
         let pwdField = fieldsList.filter(item => item.name == fieldEntry["name"])[0];
         if(pwdField){
            pwdField["type"] = GXUtils.pwdText;
            pwdField["value"] = window.btoa(pwdField["value"]);
         }
      })

      let obj = {};
   //   obj["fields"] = fieldsList; // sendKeysRequest.fields;
      obj["fields"] = sendKeysRequest.fields;
      obj["sendKey"] = sendKeysRequest.sendKey;
      obj["cursor"] = sendKeysRequest.cursor;
      obj["screenSize"] = sendKeysRequest.screenSize;
//      console.log("Object while Save : ", obj);
      this.macroRecordArray.push(obj);
   }

   clearMacroObj(){
      this.macroRecordArray = [];
      this.macroObj = {}
   }
   
   getMacroSteps(){
      return this.macroRecordArray;
   }

//   setSnackBarRef(snackBarRef){
//    this.snackBarReference = snackBarRef;
//    this.snackBarFlag = true;
//  }

 closeSnackBar(){
   this.snackBarReference.dismiss();
 }

 isSnackBarPresent(){
   return this.snackBarFlag;
 }

 setPopUpFlag(flag){
   this.popUpFlag = flag;
 }

 setCancelFlag(flag){
   this.cancelFlag=flag;
 } 

 getCancelFlag(){
   return this.cancelFlag;
 } 

 getPopUpFlag(){
   return this.popUpFlag;
 }

 setPlayMacroFlag(flag){
   this.playMacroFlag = flag;
 }

 getPlayMacroFlag(){
   return this.playMacroFlag;
 }

//  setMacroPopUpFlag(flag){
//    this.macroFlag = flag;
//  }

//  getMacroPopUpFlag(){
//    return this.macroFlag;
//  }


setMacroValidationDetails(obj: any){
   this.validationObj = obj;
}

getMacroValidationDetails(){
   return this.validationObj
}

}