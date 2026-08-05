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
import { AfterViewInit, Directive, EventEmitter, OnInit, Output } from "@angular/core";
import { GetScreenResponse,HostKeyTransformation } from "@ibm/applinx-rest-apis";
import { GXGeneratedPagesUtils } from 'src/utils/GXGeneratedPagesUtils'
import { ScreenHolderService } from "../services/screen-holder.service";
import { StorageService } from "../services/storage.service";
import { KeyboardMappingService } from "../services/keyboard-mapping.service";
import { UserExitsEventThrowerService } from "../services/user-exits-event-thrower.service";
import { IUserExits } from "../user-exits/IUserExits";
import { NGXLogger } from "ngx-logger";
import { MessagesService } from "../services/messages.service";

@Directive()
export abstract class GXGeneratedPage implements AfterViewInit, OnInit {
  
  private m_screenModel: GetScreenResponse;
  private m_generatedPage: GetScreenResponse;
  private screenHolderService: ScreenHolderService;
  private keyboardMappingService: KeyboardMappingService;
  private userExitsEventThrower: UserExitsEventThrowerService;
  private messagesService: MessagesService;
  protected logger: NGXLogger;
  
  @Output() hostKeysEmitter = new EventEmitter<HostKeyTransformation[]>();
  protected hostkeys: any[];

  constructor(page: any) {
    this.screenModel = JSON.parse(JSON.stringify(page.screenModel));
    this.screenHolderService = StorageService.injector.get(ScreenHolderService);
    this.keyboardMappingService = StorageService.injector.get(KeyboardMappingService);
    this.userExitsEventThrower = StorageService.injector.get(UserExitsEventThrowerService);
    this.messagesService = StorageService.injector.get(MessagesService);
    this.logger = StorageService.injector.get(NGXLogger);
  }
  
  ngOnInit(): void {
    this.processPage();
    this.logger.debug(this.messagesService.get("INITIALZING_GENERATED_PAGE") + (this.screenModel.name || this.runtimeScreen.name));
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.hostKeysEmitter.emit(this.hostkeys));
    this.screenHolderService.screenInitialized.next(true);
    this.logger.debug(this.messagesService.get("FINISHED_INITIALZING_GENERATED_PAGE") + (this.screenModel.name || this.runtimeScreen.name));
  }

  private processPage(): void {
    this.generatedPage = GXGeneratedPagesUtils.mergeScreens(this.runtimeScreen, this.screenModel as any);
    this.hostkeys = this.generatedPage.hostKeys;
  }

  protected get screenModel() {
    return this.m_screenModel;
  }
  protected set screenModel(model: any) {
    this.m_screenModel = model;
  }

  protected get runtimeScreen() {
    return this.screenHolderService.getRuntimeScreen();
  }

  public get generatedPage() {
    return this.m_generatedPage;
  }
  public set generatedPage(screen: GetScreenResponse) {
    this.m_generatedPage = screen;
  }

  protected addKeyboardMapping(additionalKey: string, keyCode: string, functionElement: any, overrideExisting: boolean, cancelMapFunction?: any) {
    this.keyboardMappingService.addKeyboardMapping(additionalKey, keyCode, functionElement, overrideExisting, cancelMapFunction);
  }

  protected addUserExits(userExits: IUserExits): void {
    // VULN-004: removed clearEventListeners() call — it unconditionally destroyed all globally-registered
    // security/audit hooks from every other component in the app. Generated pages now append their
    // user-exit listener rather than replacing all existing ones. To remove a specific listener,
    // use removeEventListener() (if needed) or rely on component lifecycle cleanup.
    this.userExitsEventThrower.addEventListener(userExits);
  }
}