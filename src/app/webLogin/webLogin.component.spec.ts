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
 
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebLoginComponent } from './webLogin.component';
import { ApiModule,SessionService } from '@ibm/applinx-rest-apis';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NavigationService } from 'src/app/services/navigation/navigation.service';
import { INGXLoggerConfig , NGXLogger, TOKEN_LOGGER_CONFIG, TOKEN_LOGGER_CONFIG_ENGINE_FACTORY, TOKEN_LOGGER_MAPPER_SERVICE, TOKEN_LOGGER_METADATA_SERVICE, TOKEN_LOGGER_RULES_SERVICE, TOKEN_LOGGER_SERVER_SERVICE, TOKEN_LOGGER_WRITER_SERVICE } from 'ngx-logger';
import { ScreenLockerService } from 'src/app/services/screen-locker.service'
import { DatePipe } from '@angular/common';
import { MessagesService } from 'src/app/services/messages.service'
import { RouterTestingModule } from '@angular/router/testing';
import { IJSFunctionService } from 'src/common/js-functions/ijs-functions.service'
import { JSFunctionsService } from 'src/common/js-functions/js-functions.service'
import { ModalService, PlaceholderService } from 'carbon-components-angular';
			
describe('LoginComponent', () => {
  let component: WebLoginComponent;
  let fixture: ComponentFixture<WebLoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    declarations: [WebLoginComponent],
    imports: [RouterTestingModule,
        ApiModule],
    providers: [
        SessionService,
        NavigationService,
        NGXLogger,
        ScreenLockerService,
        PlaceholderService,
        DatePipe,
        ModalService,
        { provide: 'IJSFunctionService', useClass: JSFunctionsService },
        { provide: TOKEN_LOGGER_CONFIG, useValue: {} },
        { provide: TOKEN_LOGGER_CONFIG_ENGINE_FACTORY, useValue: { provideConfigEngine: () => ({}) } },
        { provide: TOKEN_LOGGER_METADATA_SERVICE, useValue: {} },
        { provide: TOKEN_LOGGER_RULES_SERVICE, useValue: {} },
        { provide: TOKEN_LOGGER_MAPPER_SERVICE, useValue: {} },
        { provide: TOKEN_LOGGER_WRITER_SERVICE, useValue: {} },
        { provide: TOKEN_LOGGER_SERVER_SERVICE, useValue: {} },
        provideHttpClient(withInterceptorsFromDi()),
    ]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
