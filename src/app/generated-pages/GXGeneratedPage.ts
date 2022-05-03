import { AfterViewInit, Directive, EventEmitter, OnInit, Output } from "@angular/core";
import { GetScreenResponse,HostKeyTransformation } from "@softwareag/applinx-rest-apis";
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
    this.userExitsEventThrower.clearEventListeners();
    this.userExitsEventThrower.addEventListener(userExits);
  }
}