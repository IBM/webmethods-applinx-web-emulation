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

import { BrowserModule } from '@angular/platform-browser';
import { Injector, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { ApiModule, Configuration, ConfigurationParameters } from '@ibm/applinx-rest-apis'
import { ScreenComponent } from './screen/screen.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WebLoginComponent } from './webLogin/webLogin.component';
import { environment } from '../environments/environment';
import { FieldComponent } from './mini-components/field/field.component';
import { ClickableComponent } from './mini-components/transformations/clickable/clickable.component';
import { TableComponent } from './mini-components/transformations/table/table.component';
import { MultipleOptionsComponent } from './mini-components/transformations/multiple-options/multiple-options.component';
import { TextComponent } from './mini-components/transformations/text/text.component';
import { MenuComponent } from './mini-components/transformations/menu/menu.component';
import { ModalpopupComponent } from './mini-components/transformations/modalpopup/modalpopup.component';
import { TransformGeneratorComponent } from './mini-components/transformations/transform-generator/transform-generator.component';
import { InputFieldComponent } from './mini-components/input-field/input-field.component';
import { NavigationService } from './services/navigation/navigation.service';
import { KeyboardMappingService } from './services/keyboard-mapping.service';
import { MessagesService } from './services/messages.service';
import { TabAndArrowsService } from './services/navigation/tab-and-arrows.service';
import { UserExitsEventThrowerService } from './services/user-exits-event-thrower.service';
import { HostKeysTemplateComponent } from './mini-components/host-keys-template/host-keys-template.component';
import { StorageService } from './services/storage.service';
import { ScreenLockerService } from './services/screen-locker.service';
import { CalendarComponent } from './mini-components/transformations/calendar/calendar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LineComponent } from './mini-components/transformations/line/line.component';
import { CheckboxComponent } from './mini-components/transformations/checkbox/checkbox.component';
import { JSMethodsService } from '../common/js-functions/js-methods.service';
import { LoggerModule, NGXLogger, NgxLoggerLevel, TOKEN_LOGGER_SERVER_SERVICE } from 'ngx-logger';
import { RouterModule, Routes } from '@angular/router';
import { ScreenHolderService } from './services/screen-holder.service';
import { OAuth2HandlerService } from './services/oauth2-handler.service';
import { RouteGuardService } from './services/route-guard.service';
import { ScreenProcessorService } from './services/screen-processor.service';
import { MacroComponent } from './macro/macro.component';
import { SharedService } from './services/shared.service';
import { HttpHeaders } from '@angular/common/http';
import { AuthTokenServerService } from './services/logger.service'
import { DatePickerModule, IconModule, IconService } from 'carbon-components-angular';
import { UIShellModule } from 'carbon-components-angular/ui-shell';
import { ButtonModule, InputModule, DropdownModule, TableModule, ThemeModule, DialogModule, SliderModule, ToggletipModule, ContextMenuModule, CheckboxModule, RadioModule, TooltipModule, NotificationModule, SelectModule  } from 'carbon-components-angular';

// Icons
import settings20 from '@carbon/icons/es/settings/20';
import workflowautomation20 from '@carbon/icons/es/workflow-automation/20';
import colorpalette20 from '@carbon/icons/es/color-palette/20';
import zoomin20 from '@carbon/icons/es/zoom--in/20';
import printer20 from '@carbon/icons/es/printer/20';
import documentimport20 from '@carbon/icons/es/document--import/20';
import sendalt20 from '@carbon/icons/es/send--alt/20';
import play20 from '@carbon/icons/es/play/20';
import pause20 from '@carbon/icons/es/pause/20';
import recording20 from '@carbon/icons/es/recording/20';
import recordingfilledalt20 from '@carbon/icons/es/recording--filled--alt/20';
import view20 from '@carbon/icons/es/view/20';
import trash20 from '@carbon/icons/es/trash-can/20';
import restart20 from '@carbon/icons/es/restart/20';
import stopfilled20 from '@carbon/icons/es/stop--filled/20';
import { ModalModule } from 'carbon-components-angular/modal';

export function apiConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: environment.basePath,
    withCredentials: false,
  };
  return new Configuration(params);
}

export const generatedPages: any[] = [

];

const routes: Routes = [
  { path: 'webLogin', component: WebLoginComponent, canActivate: [RouteGuardService] },
  { path: 'instant', component: ScreenComponent, canActivate: [RouteGuardService] },
  { path: '**', redirectTo: 'instant', pathMatch: 'full' }
];

@NgModule({
  declarations: [
    AppComponent,
    ScreenComponent,
    WebLoginComponent,
    FieldComponent,
    ClickableComponent,
    TableComponent,
    MultipleOptionsComponent,
    TextComponent,
    MenuComponent,
    ModalpopupComponent,
    TransformGeneratorComponent,
    InputFieldComponent,
    HostKeysTemplateComponent,
    CalendarComponent,
    LineComponent,
    CheckboxComponent,
    MacroComponent,
  ].concat(generatedPages),
  imports: [
    ApiModule.forRoot(apiConfigFactory),
    RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' }),
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    UIShellModule,
    IconModule,
    ButtonModule, 
    InputModule, 
    ModalModule, 
    DropdownModule, 
    TableModule, 
    ThemeModule, 
    DialogModule, 
    SliderModule, 
    ToggletipModule, 
    ContextMenuModule, 
    CheckboxModule, 
    RadioModule, 
    DatePickerModule, 
    NotificationModule, 
    TooltipModule,
    SelectModule, 
    LoggerModule.forRoot(
      {
        serverLoggingUrl: environment.basePath + '/logger',
        level: NgxLoggerLevel.ERROR,
        serverLogLevel: NgxLoggerLevel.ERROR,
      },
      {
        serverProvider: {
          provide: TOKEN_LOGGER_SERVER_SERVICE, useClass: AuthTokenServerService
        }
      }
    )
  ],
  providers: [NavigationService,
    StorageService,
    TabAndArrowsService,
    MessagesService,
    KeyboardMappingService,
    ScreenLockerService,
    ScreenHolderService,
    UserExitsEventThrowerService,
    JSMethodsService,
    NGXLogger,
    OAuth2HandlerService,
    RouteGuardService,
    ScreenProcessorService,
    SharedService,
    { provide: 'IJSFunctionService', useClass: JSMethodsService }
  ],
  exports: [RouterModule],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private injector: Injector, protected iconService: IconService) {
    iconService.registerAll([
      settings20,
      workflowautomation20,
      colorpalette20,
      zoomin20,
      printer20,
      documentimport20,
      sendalt20,
      play20,
      pause20,
      recording20,
      view20,
      trash20,
      stopfilled20,
      recordingfilledalt20,
      restart20
    ]);
    StorageService.injector = this.injector;
  }
}
