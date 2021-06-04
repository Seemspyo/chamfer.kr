import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../environments/env';
import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';

import { AUTH_KEY } from '@chamfer/server';
import { ArticleAPI } from 'common/api/article.api';
import { AuthStrategyModule } from 'common/api/auth-strategy';
import { BannerAPI } from 'common/api/banner.api';
import { ConfigAPI } from 'common/api/config.api';
import { ProductAPI } from 'common/api/product.api';
import { GQLClientModule } from 'common/graphql/client';
import { SwiperModule } from 'swiper/angular';
import { SafePipeModule } from 'common/safe-pipe';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent, AppData } from './app.component';
import { PageNotFound } from './page-not-found/page-not-found';
import { MainComponent } from './pages/main/main.component';
import { AboutComponent } from './pages/about/about.component';
import { ProductComponent } from './pages/proudct/product.component';
import { HttpTransferModule } from 'common/http-transfer';
import { ArticleComponent } from './pages/article/article.component';
import { ArticleViewComponent } from './pages/article-view/article-view.component';
import { PhotoBookComponent } from './pages/photo-book/photo-book.component';
import { PhotoAPI } from 'common/api/photo.api';


@NgModule({
  declarations: [
    AppComponent,
    PageNotFound,
    MainComponent,
    AboutComponent,
    ProductComponent,
    ArticleComponent,
    ArticleViewComponent,
    PhotoBookComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'chamfer_main' }),
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
    SwiperModule,
    SafePipeModule,
    A11yModule,
    OverlayModule
  ],
  bootstrap: [ AppComponent ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (appData: AppData) => {

        return () => appData.init();
      },
      multi: true,
      deps: [ AppData ]
    },
    AppData,
    ConfigAPI,
    ArticleAPI,
    BannerAPI,
    ProductAPI,
    PhotoAPI
  ]
})
export class AppModule { }
