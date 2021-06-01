import { NgModule } from '@angular/core';
import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpTransferModule } from 'common/http-transfer';
import { GQLClientModule } from 'common/graphql/client';
import { environment } from '../environments/env';
import { AuthStrategyModule } from 'common/api/auth-strategy';
import { AUTH_KEY } from '@chamfer/server';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { AuthAPI } from 'common/api/auth.api';
import { ProgressInterceptorModule } from 'common/progress-interceptor';

import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';


@NgModule({
  declarations: [
    AppComponent,
    PageNotFoundComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'chamfer_deus' }),
    BrowserTransferStateModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    HttpTransferModule,
    GQLClientModule.withConfig({ uri: environment.apiOrigin + environment.graphqlPath }),
    AuthStrategyModule.withConfig({
      origin: environment.apiOrigin,
      path: environment.graphqlPath,
      useAuthKey: AUTH_KEY
    }),
    MatProgressBarModule,
    ProgressInterceptorModule
  ],
  bootstrap: [ AppComponent ],
  providers: [
    AuthAPI,
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3e3 } },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }
  ]
})
export class AppModule { }
