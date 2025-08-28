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
import { ChangeDetectorRef, Component, ComponentFactoryResolver, HostListener, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { NavigationService } from './services/navigation/navigation.service';
import { StorageService } from './services/storage.service';
import { WebLoginComponent } from './webLogin/webLogin.component';
import { GridPosition, TabAndArrowsService } from './services/navigation/tab-and-arrows.service';
import { ScreenLockerService } from './services/screen-locker.service';
import { KeyboardMappingService } from './services/keyboard-mapping.service';
import { range, Subscription } from 'rxjs';
import { ScreenHolderService } from './services/screen-holder.service';
import { ScreenComponent } from './screen/screen.component';
import { GXGeneratedPage } from './generated-pages/GXGeneratedPage';
import { INGXLoggerConfig, NGXLogger } from 'ngx-logger';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LifecycleUserExits } from './user-exits/LifecycleUserExits';
import { UserExitsEventThrowerService } from './services/user-exits-event-thrower.service';
import { OAuth2HandlerService } from './services/oauth2-handler.service';
import { MessagesService } from './services/messages.service';
import { HostKeyTransformation, Cursor, SessionService, InfoService, MacroService } from '@ibm/applinx-rest-apis';
import { ModalpopupComponent } from './mini-components/transformations/modalpopup/modalpopup.component';
import { GXUtils } from 'src/utils/GXUtils';
import { MacroComponent } from './macro/macro.component';
import { SharedService } from './services/shared.service';
import { ConfigurationService } from './services/configuration.service';
import { DomSanitizer } from '@angular/platform-browser';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconService, ModalService } from 'carbon-components-angular';
import Notification20 from '@carbon/icons/es/notification/20';
import UserAvatar20 from '@carbon/icons/es/user--avatar/20';
import AppSwitcher20 from '@carbon/icons/es/app/20';
import AddIcon from '@carbon/icons/es/4K/32';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    providers: [],
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnInit, OnDestroy {

  static readonly MAX_SMALL_SCREEN_WIDTH = 812;
  static readonly LOGGER_ELEMENT = 'logger';
  readonly title = 'ApplinX-Framework';

  hostKeyTransforms: HostKeyTransformation[];
  loginComponent: WebLoginComponent;
  displayScreen = false;
  hostKeysBool: boolean = false;
  showHostKeyFlag: boolean = GXUtils.showHostKeyFlag;
  errorMessage: string;
  errorFlag: boolean = false;
  showCloseButton: boolean = true;
  disconnectSubscription: Subscription;
  hostKeysEmitterSubscription: Subscription;
  screenInitializedSubscription: Subscription;
  hostConnectionSubscription: Subscription;
  // themeColors: string[] = GXUtils.themeColorsList;
  themecolorConfig: any = GXUtils.themecolorConfig;
  zoomDefault: number;
  zoomMinValue: number = GXUtils.zoomMinValue;
  zoomMaxValue: number = GXUtils.zoomMaxValue;
  zoomStep: number = GXUtils.zoomStep;
  isOpenThemeStyle: boolean = false;
  themeColor: string = GXUtils.defaultThemeColor;
  thumbLabel: boolean = true;
  value: number = 0;
  macroButtonCol: string
  recMacroTitle: any;
  changeRecColor: boolean = false;
  recordStop: boolean = false;
  showButtonFlag: boolean = true;
  macroEvents = GXUtils.MACRO;
  macroFileListSubscription: Subscription;
  macroList: any = [];
  userName: string = "";
  listFlag: any;
  notificationObj: boolean;
  notificationToastObj: any;
  align = "left";
  flip: boolean = false;
  macroSaveSubscription: Subscription;
  basePath = 'http://localhost:2380/applinx/rest';
  observe = "body";
  reportProgress = false;
  defaultHeaders = new HttpHeaders();
  selectedColor: string = '';
  macroMode: string = '';

  @ViewChild('container', { read: ViewContainerRef, static: true }) container: ViewContainerRef;

  RELOAD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M204-318q-22-38-33-78t-11-82q0-134 93-228t227-94h7l-64-64 56-56 160 160-160 160-56-56 64-64h-7q-100 0-170 70.5T240-478q0 26 6 51t18 49l-60 60ZM481-40 321-200l160-160 56 56-64 64h7q100 0 170-70.5T720-482q0-26-6-51t-18-49l60-60q22 38 33 78t11 82q0 134-93 228t-227 94h-7l64 64-56 56Z"/></svg>`; // Autorenew
  CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>`; //Close
  SENDTOHOST_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M516-120 402-402 120-516v-56l720-268-268 720h-56Zm26-148 162-436-436 162 196 78 78 196Zm-78-196Z"/></svg>`
  SETTINGS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>`;// Settings
  STYLE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-220 40q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120-160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm200 0q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120 160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z"/></svg>`; //Palette
  ZOOM_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Zm-40-60v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z"/></svg>`; //Zoom In
  PRINT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-560H200q-17 0-28.5 11.5T160-520v160h80v-80h480v80h80Z"/></svg>`; // Print
  COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>`; // Content Copy
  MACRO_NO_RECORD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM265-80q-79 0-134.5-55.5T75-270q0-57 29.5-102t77.5-68H80v-80h240v240h-80v-97q-37 8-61 38t-24 69q0 46 32.5 78t77.5 32v80Zm135-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z"/></svg>`; // Article Shortcut
  MACRO_RECORD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#BB271A"><path d="M400-280h160v-80H400v80Zm0-160h280v-80H400v80ZM280-600h400v-80H280v80Zm200 120ZM265-80q-79 0-134.5-55.5T75-270q0-57 29.5-102t77.5-68H80v-80h240v240h-80v-97q-37 8-61 38t-24 69q0 46 32.5 78t77.5 32v80Zm135-40v-80h360v-560H200v160h-80v-160q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H400Z"/></svg>`; //Article Shortcut - color : #BB271A
  SIDE_MENU_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/></svg>`

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.sharedService.getPopUpFlag()) {
      if (this.screenLockerService.isLocked()) {
        if (GXUtils.ENABLETYPEAHEADFLAG) {
          this.fnFormTypeaheadDetails(event);
        }
        return; // windows is loading...
      }
      if (!this.keyboardMappingService.checkKeyboardMappings(event, true, event.keyCode)) {
        event.preventDefault();
      }
      if (event.key === 'Enter' && !this.storageService.isConnected()) {
        this.loginComponent.onConnect();
        event.preventDefault();
      } else if (this.storageService.isConnected() && this.tabAndArrowsService.handleArrows(event)) {
        event.preventDefault();
      }
    }
  }

  fnFormTypeaheadDetails(event: KeyboardEvent) {
    if (event.code) {
      if (GXUtils.IGNOREKEYARRAY.indexOf(event.code) != -1) {
        event.preventDefault();
      } else if (GXUtils.FUNCTIONARRAY.indexOf(event.code) != -1) {
        event.preventDefault();
        GXUtils.appendTypeAheadStringArray(event);
      }
      else if (event.key == GXUtils.TAB) {
        GXUtils.appendTypeAheadStringArray(event); // adding textbox entries in a page
        event.preventDefault();
      }
      else if (event.key == GXUtils.ENTER || event.key == GXUtils.NUMPADENTER) {
        GXUtils.appendTypeAheadStringArray(event); // adding pages to an array
      }
      else {
        GXUtils.appendTypeAheadChar(event.key); // Adding charecters typed by the user
      }
    }
  }

  @HostListener('focusin', ['$event'])
  handleFocus(event: any): void {
    // For generated pages which users might add custom input elements.
    // Handle focus for non-ApplinX HTML 'input' and 'select' elements.
    // ApplinX's app-input-field component has his own focus handling. 
    const ignore = ['app-multiple-options', 'app-input-field'];
    if (ignore.includes(event.path?.[1]?.tagName?.toLowerCase()) || ignore.includes(event.path?.[3]?.tagName?.toLowerCase())) {
      return;
    }
    const tag = event.target.tagName;
    const id = event.target.id;
    const tags = ['input', 'select'];
    if (tags.includes(tag?.toLowerCase())) {
      const gp = new GridPosition(event.target);
      const pos = { row: gp.rowStart, column: gp.colStart };
      this.navigationService.setCursorPosition(new Cursor(pos, id));
    }
  }

  @HostListener('window:dblclick', ['$event'])
  onGlobalDoubleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    const isInCalendar = target.closest('.flatpickr-calendar') ||
      target.closest('.numInputWrapper') ||
      target.closest('.cur-year') ||
      target.closest('.cur-month') ||
      target.closest('[class*="date-picker"]') ||
      target.classList.contains('arrowUp') ||
      target.classList.contains('arrowDown');

    const isInCarbonDropdown = target.closest('.cds--list-box') ||
      target.closest('.cds--list-box__field') ||
      target.classList.contains('cds--list-box__label');

    const isInCarbonRadio = target.classList.contains('cds--radio-button__appearance') ||
      target.closest('label.cds--radio-button__label');

    const isExcludedTarget =
      target.tagName === 'INPUT' || // <input> fields
      target.tagName === 'TEXTAREA' || // <textarea> fields
      target.tagName === 'SELECT' || // <select> dropdowns
      target.tagName === 'OPTION' || // <option> inside <select>
      target.tagName === 'BUTTON' || // <button> fields
      isInCarbonRadio ||  // <cds-radio> field
      target.closest('.cds--modal') || // <cds-modal> field
      isInCalendar ||  // <cds-date-picker> field
      isInCarbonDropdown ||  // <cds-dropdown> field
      GXUtils.ENABLETYPEAHEADFLAG ||  // disabled if typeahead is enabled
      (this.macroMode === 'record' && !this.sharedService.getCancelFlag()) || // disabled when recording macros
      (target instanceof HTMLInputElement && (target.type === 'radio' || target.type === 'checkbox')) || // radio and checkbox
      target.isContentEditable; // contenteditable fields (e.g., divs with contenteditable)

    if (isExcludedTarget) return;

    // disable if PF-key is None
    if (GXUtils.enableDoubleClickFlag && GXUtils.doubleClickPFKey && (GXUtils.doubleClickPFKey.toLowerCase() !== 'none')) {
      try {
        const pfKey = GXUtils.doubleClickPFKey.toLowerCase();
        // Uncomment below lines to log the key used.
        // console.log('🖱️ Double-click detected on:', target);
        // console.log('📨 Sending PF-key:', GXUtils.doubleClickPFKey);

        this.navigationService.sendKeys(GXUtils.doubleClickPFKey);
      } catch (err) {
        console.error('Double click PF-key error:', err);
      }
    }
  }

  @HostListener('window:beforeunload')
  onBrowserClose(): void {
    if (!this.oAuth2handler.isRedirectToIDP) {
      this.logout();
    }
  }

  constructor(private sessionService: SessionService, private navigationService: NavigationService,
    public storageService: StorageService, private tabAndArrowsService: TabAndArrowsService,
    private keyboardMappingService: KeyboardMappingService, public screenLockerService: ScreenLockerService,
    private screenHolderService: ScreenHolderService, private userExitsEventThrower: UserExitsEventThrowerService,
    private logger: NGXLogger, private httpClient: HttpClient, private messages: MessagesService,
    private oAuth2handler: OAuth2HandlerService, private sharedService: SharedService, private configurationService: ConfigurationService,
    private infoService: InfoService, private macroService: MacroService, sanitizer: DomSanitizer,
    protected iconService: IconService, protected modalService: ModalService, private componentFactoryResolver: ComponentFactoryResolver
  ) {
    this.userExitsEventThrower.clearEventListeners();
    this.userExitsEventThrower.addEventListener(new LifecycleUserExits(infoService, navigationService, storageService, keyboardMappingService, logger));
    this.getLoggerConfiguration();
    if (window.innerWidth <= 992) {
      this.zoomDefault = 10;
    } else if (window.innerWidth >= 992 && window.innerWidth <= 1200) {
      this.zoomDefault = 12;

    } else if (window.innerWidth > 1200 && window.innerWidth <= 1400) {
      this.zoomDefault = 14;

    }
    else if (window.innerWidth > 1400 && window.innerWidth <= 1800) {
      this.zoomDefault = 17;

    } else if (window.innerWidth > 1800) {
      this.zoomDefault = 20;
    }

    this.sharedService.data$.subscribe(data => {
      // Handle the data received from the modal component
      this.changeRecColor = data !== '' && data !== null ? true : false;
    });

    document.documentElement.style.setProperty('--text-font-size', this.zoomDefault + 'px');
    this.value = this.zoomDefault;


  }

  getLoggerConfiguration() {
    const jsonDefault: INGXLoggerConfig = this.logger.getConfigSnapshot();
    this.httpClient.get<INGXLoggerConfig>('./assets/config/sessionConfig.json').subscribe(data => {
      let json = data[AppComponent.LOGGER_ELEMENT];
      let jsonKeys: any[] = Object.keys(jsonDefault);
      jsonKeys.forEach(element => {
        if (json[element] === undefined) {
          json[element] = jsonDefault[element];
        }
      });
      this.logger.updateConfig(json);
    });
  }

  ngOnInit(): void {
    // Uncomment below method to change it to a different value
    // GXUtils.setDoubleClickPFKey('[pf1]');
    // GXUtils.setDoubleClickPFKey('none');
    this.iconService.registerAll([Notification20, UserAvatar20, AppSwitcher20]);
    this.changeBackgroundColor(this.themeColor);
    this.logger.debug(this.messages.get("INITIALIZING_WEB_APPLICATION"));
    this.screenInitializedSubscription = this.screenHolderService.screenInitialized.subscribe(initialized => {
      if (initialized) {
        setTimeout(() => {
          this.displayScreen = true;
          this.screenLockerService.setLocked(false);
          this.userExitsEventThrower.fireAfterViewInit();
        });
      }
    });
    this.hostConnectionSubscription = this.navigationService.isConnectedtoHost.subscribe(hostConnection => {
      if (!hostConnection) {
        this.errorMessage = this.navigationService.errorMessage;
        this.showDisconnectionMessage();
      }
    })
  }
  public range: number = 1;

  zoom1 = false;
  zoom() {

    this.zoom1 = !this.zoom1;
  }


  showDisconnectionMessage(): void {
    const targetModal = document.getElementById('readonly_modal');
    // targetModal.classList.add('dlt-modal-window__open');
    this.errorFlag = true;
  }

  reconnect(): void {
    const targetModal = document.getElementById('readonly_modal');
    // targetModal.classList.remove('dlt-modal-window__open')
    this.storageService.setNotConnected();
    this.clearMacroDetails();

  }

  reload(): void {
    this.navigationService.isScreenUpdated.next(true);
  }

  logout(): void {
    if (!this.storageService.isConnected()) {
      return;
    }
    this.clearMacroDetails();
    if (GXUtils.ENABLETYPEAHEADFLAG) {
      GXUtils.resetPageArray();
    }
    this.userExitsEventThrower.firePreDisconnect();
    this.disconnectSubscription = this.sessionService.disconnect(this.storageService.getAuthToken())
      .subscribe(
        res => this.userExitsEventThrower.firePostDisconnect(res),
        error => this.userExitsEventThrower.fireOnDisconnectError(error)
      );
    this.disconnectSubscription.add(() => this.storageService.setNotConnected())
  }

  clearMacroDetails() {
    this.changeRecColor = false;
    this.recordStop = false;
    this.sharedService.setMacroRecordFlag(false);
    this.sharedService.clearMacroObj();
  }

  print() {
    GXUtils.setCopyFlag(false);
    this.getScreenData(true);
  }

  copy() {
    GXUtils.setCopyFlag(true);
    this.sharedService.setPopUpFlag(true);
    this.getScreenData(false);
  }

  generateObjectArray(values, objArray) {
    values.forEach(element => {
      let obj = {};
      obj["row"] = element ? element.position.row : "";
      obj["col"] = element ? element.position.column : "";
      obj["size"] = element ? element.length : "";
      obj["data"] = element ? element.content : "";
      obj["protected"] = element ? element.protected : "";
      if (!element.visible) {
        let strLen = element.content.length;
        obj["data"] = new Array(strLen).join(' ')
      } else {
        obj["data"] = element ? element.content : "";
      }
      obj["visible"] = element ? element.visible : "";
      objArray.push(obj);
    });
  }

  formatTranformationOfPopupLines(windowDetails, objArray) {
    let windowCount = windowDetails.length;
    let winStartRow = windowDetails[windowCount - 1].bounds.startRow;
    let winEndRow = windowDetails[windowCount - 1].bounds.endRow;
    let winStartCol = windowDetails[windowCount - 1].bounds.startCol;
    let nonPopupLines = objArray.filter(element => element.row < winStartRow || element.row > winEndRow);
    let maxColEntry: any;
    // get lines Matching Header lines
    for (let i = 0; i < windowDetails.length - 1; i++) {
      let temp = nonPopupLines.filter(element => windowDetails[i].bounds.startRow == element.row
        && windowDetails[i].bounds.startCol >= element.col
        && windowDetails[i].bounds.startCol <= element.col + element.size);
      if (temp.length > 0) {
        let position = Math.floor(temp[0].data.length / 2)
        temp[0].data = new Array(position).join(' ') + windowDetails[i].title;
      }
    }
    let windowLines = objArray.filter(element => element.row >= winStartRow && element.row <= winEndRow
      && element.col < winStartCol)
    while (winStartRow <= winEndRow) {
      let rowLines = windowLines.filter(entry => entry.row == winStartRow);
      if (rowLines.length > 0) {
        maxColEntry = rowLines.reduce((maxCol, selectedCol) => {
          return selectedCol.col > maxCol.col ? selectedCol : maxCol;
        })
        let headerStrlength = winStartCol - maxColEntry.col;
        maxColEntry.data = maxColEntry.data.slice(0, headerStrlength);
      }
      winStartRow++;
    }
  }

  formatTransformationOfWindows(windowDetails, objArray) {
    this.formatTranformationOfPopupLines(windowDetails, objArray);
    let windowCount = windowDetails.length;
    let endcol = windowDetails[windowCount - 1].bounds.startCol;
    windowDetails.forEach(windowData => {
      let obj = objArray.filter(entry => entry.row == windowData.bounds.startRow &&
        (entry.col > windowData.bounds.startCol));
      if (obj.length > 0) {
        if (windowData.index == windowCount - 1) {
          obj[0].data = windowData.title;
        } else {
          let headerStrlength = endcol - obj[0].col;
          obj[0].data = windowData.title.slice(0, headerStrlength);
        }
        let paddingLength = Math.ceil(((windowData.bounds.endCol - windowData.bounds.startCol)
          - (windowData.title ? windowData.title.length : 0)) / 2)
        obj[0].col = windowData.bounds.startCol + paddingLength;
      }
    });
  }

  formatTransformation(values, objArray) {
    values.forEach(element => {
      if (element.type == 'HostKeyTransformation' && this.showHostKeyFlag) {
        let hostKeyList = element.hostKeys
        hostKeyList.forEach(hostKeyElement => {
          let actionObj = {};
          let displayObj = {};
          actionObj["row"] = hostKeyElement.actionPosition.row;
          actionObj["col"] = hostKeyElement.actionPosition.column;
          actionObj["data"] = hostKeyElement.action;
          objArray.push(actionObj);
          displayObj["row"] = hostKeyElement.displayPosition.row;
          displayObj["col"] = hostKeyElement.displayPosition.column;
          displayObj["data"] = hostKeyElement.displayText;
          objArray.push(displayObj);
        });
      } else if (element.type == "TextTransformation") {
        let displayObj = {};
        displayObj["row"] = element.position.row;
        displayObj["col"] = element.position.column;
        displayObj["data"] = element.text;
        objArray.push(displayObj);
      } else if (element.type == "LineTransformation") {
        let displayObj = {};
        displayObj["row"] = element.caption.position.row;
        displayObj["col"] = element.caption.position.column;
        displayObj["data"] = element.caption.text;
        objArray.push(displayObj);
      } else if (element.type == "MultipleOptionsTransformation") {
        let displayObj = {};
        displayObj["row"] = element.field.position.row;
        displayObj["col"] = element.field.position.column;
        displayObj["data"] = element.field.content;
        objArray.push(displayObj);
      } else if (element.type == "MenuTransformation") {
        let menuList = element.items;
        menuList.forEach(menuItem => {
          let displayObj = {};
          displayObj["row"] = menuItem.textPosition.row;
          displayObj["col"] = menuItem.textPosition.column;
          displayObj["data"] = menuItem.text;
          objArray.push(displayObj);
        });
      }
    });
  }

  getScreenData(printFlag) {
    let rawData = this.screenHolderService.getRawScreenData();
    let objArray = [];
    let formattedArray = [];
    let maxLine = 0;
    if (rawData.fields.length > 0) {
      this.generateObjectArray(rawData.fields, objArray);
      this.formatTransformation(rawData.transformations, objArray);
      if (rawData && rawData.windows) {
        this.formatTransformationOfWindows(rawData.windows, objArray);
        // this.drawBorderForPopUp(rawData.windows, objArray)
      }
      let lineNo = 0;
      objArray.sort((a, b) => {
        return a.row - b.row;
      });
      maxLine = objArray[objArray.length - 1].row + 1;
      do {
        let lineDetails = objArray.filter(item => item.row == lineNo);
        let temp = this.formatLineText(lineDetails);
        formattedArray.push(temp);
        lineNo++
      } while (lineNo < maxLine);
      if (!printFlag) {
        this.formatCopyPage(formattedArray, printFlag);
      } else {
        this.formatPrintPage(formattedArray);
      }
    }
  }

  formatPrintPage(formattedArray: any) {
    let printDetails = formattedArray;
    let height = window.screen.availHeight - 400;
    let width = window.screen.availWidth - 750;
    const popupWindow = window.open('', '', `height=${height},width=${width},top=${height / 2},left=${width / 2}`);
    popupWindow.document.open();
    popupWindow.document.write('<div class="copyWrapper crosshair" style="white-space: pre !important;"><pre>');
    printDetails.forEach(element => {
      popupWindow.document.write("<div>" + element + "</div>");
    })
    popupWindow.document.write('</pre></div>')
    popupWindow.print();
    popupWindow.close();
  }

  formatCopyPage(formattedArray, printFlag) {
    let divElement = document.createElement("div");
    divElement.style.cssText = "border :1px solid black;"
    let lineIdentifier = 0;
    formattedArray.forEach(element => {
      let paraElement = document.createElement("span");
      paraElement.innerText = element;
      paraElement.id = "gx_text";
      paraElement.tabIndex = lineIdentifier++;
      divElement.appendChild(paraElement);
    });

    const divToRemove = document.getElementById("copyContainer")
    if (divToRemove) {
      divToRemove.parentNode?.removeChild(divToRemove);
    }
    const factoryCopy = this.componentFactoryResolver.resolveComponentFactory(ModalpopupComponent);
    const referenceCopy = this.container.createComponent(factoryCopy);
    (referenceCopy.instance as ModalpopupComponent).copyData = divElement.innerHTML;
    (referenceCopy.instance as ModalpopupComponent).typeFlag = printFlag;
  }

  formatLineText(lineDetails) {
    let stringMaster = "                                                                                ";
    lineDetails.forEach(entry => {
      if (entry.data) {
        stringMaster = GXUtils.replaceString(stringMaster, entry.col - 1, entry.data);
      }

    })
    return stringMaster;
  }

  setHostKeys(hostkeys: HostKeyTransformation[]): void {
    this.hostKeyTransforms = hostkeys;
  }

  onActivate(component) {
    if (component instanceof ScreenComponent || component instanceof GXGeneratedPage) {
      if (this.hostKeysEmitterSubscription) {
        this.hostKeysEmitterSubscription.unsubscribe();
      }
      this.hostKeysEmitterSubscription = component.hostKeysEmitter.subscribe(e => this.setHostKeys(e));
    }
    if (component instanceof ScreenComponent) {
      this.userExitsEventThrower.clearEventListeners();
      this.userExitsEventThrower.addEventListener(new LifecycleUserExits(this.infoService, this.navigationService, this.storageService, this.keyboardMappingService, this.logger));
    } else if (component instanceof WebLoginComponent) {
      this.loginComponent = component;
      this.changeBackgroundColor('White');
      this.selectedColor = "White";
    }
  }

  onDeactivate() {
    this.displayScreen = false;
  }

  isSmallScreen(): boolean {
    return screen.width <= AppComponent.MAX_SMALL_SCREEN_WIDTH && window.innerHeight < window.innerWidth;
  }

  formatLabel(value: number): string {
    return `${value + 'px'}`;
  }

  changeTheme() {
    this.isOpenThemeStyle = !this.isOpenThemeStyle;
  }

  onZoomChange(value: number) {
    if (this.zoomDefault !== this.value) {
      this.zoomDefault = this.value;
      document.documentElement.style.setProperty('--text-font-size', this.zoomDefault + 'px');
    }
  }


  ngOnDestroy(): void {
    if (this.disconnectSubscription) {
      this.disconnectSubscription.unsubscribe();
    }
    if (this.hostKeysEmitterSubscription) {
      this.hostKeysEmitterSubscription.unsubscribe();
    }
    if (this.screenInitializedSubscription) {
      this.screenInitializedSubscription.unsubscribe();
    }
    if (this.hostConnectionSubscription) {
      this.hostConnectionSubscription.unsubscribe();
    }
  }
  
  macro() {
    this.showButtonFlag = true;
    this.recordStop = this.sharedService.getMacroRecordFlag();
    let token = this.storageService.getAuthToken();
    let applicationName = this.configurationService.applicationName;
    let tempUserName = sessionStorage.getItem('userName');
    this.userName = tempUserName.substr(1, tempUserName.length-2);
    this.macroFileListSubscription = this.macroService
      .getMacro(this.userName, applicationName, token)
      .subscribe(data => {
        data.fileList.forEach(file => {
          this.macroList.push(file.substring(0, file.length - 5))
        });
        sessionStorage.setItem("macroFileList", JSON.parse(JSON.stringify(this.macroList)));
        this.macroList = [];
      });

  }

  openMacro(paramType: string) { 
    this.showButtonFlag = false;
    const divToRemove = document.getElementById("macroRecordContainer")
    if (divToRemove) {
      divToRemove.parentNode?.removeChild(divToRemove);
    }

    const factory = this.componentFactoryResolver.resolveComponentFactory(MacroComponent);
    const reference = this.container.createComponent(factory);
    (reference.instance as MacroComponent).operationType = paramType;
    this.sharedService.setPopUpFlag(true);
    reference.instance.dataEmitter;

    if (paramType == "stopRecord") {
      this.changeRecColor = reference.instance.onRecordStopColor(false)
    } else if (paramType == "record") {
      this.changeRecColor = reference.instance.onRecordStopColor(true)

    }
  }

  onClose() {
    this.notificationObj = false;  // Clear the toast notification
  }
  changeBackgroundColor(color: string) {
    this.themeColor = color;
    this.isOpenThemeStyle = false;
    document.documentElement.style.setProperty('--color-theme', this.themeColor.toLocaleLowerCase() === 'green' ? 'lime' : this.themeColor.toLocaleLowerCase());
    document.documentElement.style.setProperty('--bs-body-bg', this.themecolorConfig[color]['bg-color']);
    document.documentElement.style.setProperty('--primary-color', this.themecolorConfig[color]['bg-color']);
    document.documentElement.style.setProperty('--input-text-bg-color', this.themecolorConfig[color]['input-text-bg-color']);
    document.documentElement.style.setProperty('--input-text-border-bottom', this.themecolorConfig[color]['input-text-border-bottom']);
    document.documentElement.style.setProperty('--primary-text-color', this.themecolorConfig[color]['text-color']);
    document.documentElement.style.setProperty('--screen-btn-color', this.themecolorConfig[color]['screen-btn-color']);
    document.documentElement.style.setProperty('--screen-btn-text-color', this.themecolorConfig[color]['screen-btn-text-color']);
    document.documentElement.style.setProperty('--btn-regular-color', this.themecolorConfig[color]['btn-regular-color']);
    document.documentElement.style.setProperty('--btn-outline-color', this.themecolorConfig[color]['btn-outline-color']);
    document.documentElement.style.setProperty('--btn-hover-color-screen', this.themecolorConfig[color]['btn-hover-color-screen']);
    document.documentElement.style.setProperty('--btn-hover-color', this.themecolorConfig[color]['btn-hover-color']);
    document.documentElement.style.setProperty('--enter-btn-hover-color', this.themecolorConfig[color]['enter-btn-hover-color']);
    document.documentElement.style.setProperty('--enter-btn-text-hover-color', this.themecolorConfig[color]['enter-btn-text-hover-color']);
    document.documentElement.style.setProperty('--input-table-text', this.themecolorConfig[color]['input-text']);
    document.documentElement.style.setProperty('--input-table-text-pw', this.themecolorConfig[color]['input-text-pw']);
    document.documentElement.style.setProperty('--login-screen-color', this.themecolorConfig[color]['login-screen-color']);
    document.documentElement.style.setProperty('--menu-content-color', this.themecolorConfig[color]['menu-content-color']);
    document.documentElement.style.setProperty('--table-header-background', this.themecolorConfig[color]['table-header-background']);
    document.documentElement.style.setProperty('--table-header-border-color-left', this.themecolorConfig[color]['table-header-border-color-left']);
    document.documentElement.style.setProperty('--table-header-border-color-right', this.themecolorConfig[color]['table-header-border-color-right']);
    document.documentElement.style.setProperty('--table-header-border-color-top', this.themecolorConfig[color]['table-header-border-color-top']);
    document.documentElement.style.setProperty('--table-header-border-color-botton', this.themecolorConfig[color]['table-header-border-color-bottom']);
    document.documentElement.style.setProperty('--table-header-text-color', this.themecolorConfig[color]['table-header-text-color']);
    document.documentElement.style.setProperty('--table-body-border-color', this.themecolorConfig[color]['table-body-border-color']);
    document.documentElement.style.setProperty('--table-body-alternating1', this.themecolorConfig[color]['table-body-alternating1']);
    document.documentElement.style.setProperty('--table-body-alternating2', this.themecolorConfig[color]['table-body-alternating2']);
    document.documentElement.style.setProperty('--table-body-text-color', this.themecolorConfig[color]['table-body-text-color']);
    document.documentElement.style.setProperty('--table-body-select-border-color', this.themecolorConfig[color]['table-body-select-border-color']);
    document.documentElement.style.setProperty('--table-body-select-background-color', this.themecolorConfig[color]['table-body-select-background-color']);
    document.documentElement.style.setProperty('--table-body-select-color', this.themecolorConfig[color]['table-body-select-color']);
    document.documentElement.style.setProperty('--table-text-shadow', this.themecolorConfig[color]['table-text-shadow']);
    document.documentElement.style.setProperty('--input-bottom-border-gx-lgrn', this.themecolorConfig[color]['input-bottom-border-gx-lgrn']);
    document.documentElement.style.setProperty('--cross-text-color', this.themecolorConfig[color]['cross-text-color']);
    document.documentElement.style.setProperty('--gx-line', this.themecolorConfig[color]['gx-line']);
    document.documentElement.style.setProperty('--gx-blwt-text-color', this.themecolorConfig[color]['gx-blwt-text-color']);
    document.documentElement.style.setProperty('--gx-lbl', this.themecolorConfig[color]['gx-lbl']);
    document.documentElement.style.setProperty('--gx-lgrn', this.themecolorConfig[color]['gx-lgrn']);
    document.documentElement.style.setProperty('--gx-lrd', this.themecolorConfig[color]['gx-lrd']);
    document.documentElement.style.setProperty('--gx-blbl', this.themecolorConfig[color]['gx-blbl']);
    document.documentElement.style.setProperty('--gx-blbl-text-color', this.themecolorConfig[color]['gx-blbl-text-color']);
    document.documentElement.style.setProperty('--gx-blrd', this.themecolorConfig[color]['gx-blrd']);
    document.documentElement.style.setProperty('--gx-lppl', this.themecolorConfig[color]['gx-lppl']);
    document.documentElement.style.setProperty('--gx-laq', this.themecolorConfig[color]['gx-laq']);
    document.documentElement.style.setProperty('--gx-ylw', this.themecolorConfig[color]['gx-ylw']);
    document.documentElement.style.setProperty('--gx-blgrn', this.themecolorConfig[color]['gx-blgrn']);
    document.documentElement.style.setProperty('--gx-blgrn-text-color', this.themecolorConfig[color]['gx-blgrn-text-color']);
    document.documentElement.style.setProperty('--gx-blaq', this.themecolorConfig[color]['gx-blaq']);
    document.documentElement.style.setProperty('--gx-blaq-text-color', this.themecolorConfig[color]['gx-blaq-text-color']);
    document.documentElement.style.setProperty('--gx-bylw', this.themecolorConfig[color]['gx-bylw']);
    document.documentElement.style.setProperty('--gx-bylw-text-color', this.themecolorConfig[color]['gx-bylw-text-color']);
    document.documentElement.style.setProperty('--gx-intf', this.themecolorConfig[color]['gx-intf']);
    document.documentElement.style.setProperty('--text-shadow-gx-lrd-intf', this.themecolorConfig[color]['text-shadow-gx-lrd-intf']);
    document.documentElement.style.setProperty('--text-shadow-gx-lwt-gx-intf', this.themecolorConfig[color]['text-shadow-gx-lwt-gx-intf']);
    document.documentElement.style.setProperty('--text-hyperlink-color', this.themecolorConfig[color]['text-hyperlink-color']);
    document.documentElement.style.setProperty('--text-hyperlink-hover-bgcolor', this.themecolorConfig[color]['text-hyperlink-hover-bgcolor']);
    document.documentElement.style.setProperty('--text-hyperlink-hover-color', this.themecolorConfig[color]['text-hyperlink-hover-color']);
  }

  setDefaultZoom() {
    if (window.innerWidth <= 992) {
      this.zoomDefault = 10;
    } else if (window.innerWidth >= 992 && window.innerWidth <= 1200) {
      this.zoomDefault = 12;

    } else if (window.innerWidth > 1200 && window.innerWidth <= 1400) {
      this.zoomDefault = 14;

    }
    else if (window.innerWidth > 1400 && window.innerWidth <= 1800) {
      this.zoomDefault = 17;

    } else if (window.innerWidth > 1800) {
      this.zoomDefault = 20;
    }
    document.documentElement.style.setProperty('--text-font-size', this.zoomDefault + 'px');
    this.value = this.zoomDefault;
  }

  getColor(color: string): string {
    if (color === 'Green') {
      color = 'lime'
    }
    return color.toLowerCase();
  }
  selected(event: any, color: string) {
    this.selectedColor = color;
    let themeColor = event.currentTarget.id;
    this.changeBackgroundColor(themeColor);
  }
}




