import { Component, OnInit, Inject, ViewChild, ElementRef, Input, HostListener } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { GXUtils } from 'src/utils/GXUtils';
import { DialogService } from 'carbon-components-angular';
import { SharedService } from '../../../services/shared.service';

@Component({
    selector: 'app-modalpopup',
    providers: [DialogService],
    templateUrl: './modalpopup.component.html',
    styleUrls: ['./modalpopup.component.scss'],
    standalone: false
})
export class ModalpopupComponent implements OnInit {

  constructor(
    private clipboard: Clipboard, private sharedService: SharedService) { }
  @Input() copyData: string;
  @Input() typeFlag: boolean;
  @HostListener('document:keydown.escape', ['$event'])
  handleEscKey(event: KeyboardEvent) {
    if (this.copyModalFlag) {
      this.closeModal();
    }
  }
 
  printFlag: boolean = false;
  copyInstructionLineOne: string = GXUtils.copyInstructionLineOne;
  copyInstructionLineTwo: string = GXUtils.copyInstructionLineTwo;
  copyInstruction_bgcolor: string = GXUtils.copyInstruction_bgcolor;
  selection: any;
  copiedText: any = [];
  displayString: any = ``;
  widget: any;
  mouseDownPrintX: any;
  mouseDownPrintY: any;
  mouseUpPrintX: any;
  mouseUpPrintY: any;
  mouseDownOffsetX: any;
  mouseDownOffsetY: any;
  mouseUpOffsetX: any;
  mouseUpOffsetY: any;
  mouseMovePrintX: any;
  mouseMovePrintY: any;
  length: any;
  height: any;
  left: any;
  top: any;
  ismousedown = false;
  copyFlag: boolean;
  copyModalFlag: boolean = false;
  size = "sm";

  ngOnInit(): void {
    this.copyModalFlag = true;
    this.copyFlag = GXUtils.getCopyFlag();
    this.initCall();
  }

  initCall() {
    document.getElementById("copyDiv").innerHTML = this.copyData; // this.data.content;
    this.printFlag = this.typeFlag;
    // console.log("Print Flag : ", this.printFlag)
    // console.log("copyData : ", this.copyData)
    let elementList = document.querySelectorAll("[id='gx_text']");
    elementList.forEach(element => {
      element.classList.add("copyTextCss");
    })
  }

  handleMouseDown(event) {
    this.initCall();
    document.getElementsByClassName("selWidgetClass").length > 0 ? document.getElementsByClassName("selWidgetClass")[0].remove() : "";
    this.mouseDownPrintX = event.pageX;
    this.mouseDownPrintY = event.pageY;
    this.mouseDownOffsetX = event.offsetX;
    this.mouseDownOffsetY = event.offsetY;

    if (event.currentTarget.id == "copyDiv") {
      let divElement = document.createElement("div");
      divElement.id = "selWidget";
      divElement.className = "selWidgetClass";
      document.getElementById("copyDiv").append(divElement);
      let index = document.getElementsByClassName("selWidgetClass").length - 1
      this.widget = document.getElementsByClassName("selWidgetClass")[index]
      this.ismousedown = true;
    }
  }

  changeTextBGcolor() {
    let lineArray = document.getElementById("copyDiv").children;
    let lineObjArray = [];
    let startTabIndex = this.selection.anchorNode.parentElement.tabIndex
    let endTabIndex = this.selection.focusNode.parentElement.tabIndex;
    let startIndex = this.selection.anchorOffset;
    let endIndex = this.selection.focusOffset;

    if (startTabIndex > endTabIndex) {
      let temp = endTabIndex;
      endTabIndex = startTabIndex;
      startTabIndex = temp;
    }

    if (startIndex > endIndex) {
      let temp = endIndex;
      endIndex = startIndex;
      startIndex = temp;
    }
    for (let i = 0; i < lineArray.length; i++) {
      if ((lineArray[i]["tabIndex"] != -1) /*&& (lineArray[i].innerHTML.trim() != "") */ &&
        (lineArray[i]["tabIndex"] >= startTabIndex && lineArray[i]["tabIndex"] <= endTabIndex)) {
        lineObjArray.push({ "tabIndex": lineArray[i]["tabIndex"], "value": lineArray[i].innerHTML })
      }
    }
    this.copiedText.forEach((element, index) => {
      // if (element.trim() != "") {
      lineArray[lineObjArray[index].tabIndex].innerHTML = GXUtils.replaceBetween(lineArray[lineObjArray[index].tabIndex]["innerText"], startIndex, endIndex, "<span class='customselect'>" + element + "</span>")
      //  }
    });
  }

  handleMouseUp(event) {

    if (window.getSelection) {                      //only work if supported
      this.selection = window.getSelection();      //get the selection object
      let startIndex = this.selection.anchorOffset;
      let endIndex = this.selection.focusOffset;
      let offset = endIndex >= startIndex ? endIndex - startIndex : startIndex - endIndex;
      let selectedLines = this.selection.toString().split("\n");
      let lineCount = selectedLines.length;
      this.copiedText = [];
      this.displayString = ``;

      for (let i = 0; i < lineCount; i++) {
        if (i == 0) {
          this.copiedText.push(selectedLines[i].slice(0, offset));
          this.displayString = this.displayString + selectedLines[i].slice(0, offset) + "\n";
        } else {
          if (endIndex >= startIndex) {
            this.copiedText.push(selectedLines[i].slice(startIndex, endIndex));
            this.displayString = this.displayString + selectedLines[i].slice(startIndex, endIndex) + "\n";
          } else {
            this.copiedText.push(selectedLines[i].slice(endIndex, startIndex));
            this.displayString = this.displayString + selectedLines[i].slice(endIndex, startIndex) + "\n";
          }
        }
      }
    }
    this.changeTextBGcolor();
    this.clipboard.copy(this.displayString)
  }

  closeModal() {
    this.copyModalFlag = false; // Force modal to close
    this.sharedService.setPopUpFlag(false);
  }
}

export interface DialogData {
  content: string,
  typeFlag: boolean
}



