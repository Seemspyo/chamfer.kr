import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';

import { MainRoutingModule } from './main-routing.module';
import { SlideTabModule } from 'common/slide-tab';
import { UploadInputModule } from 'common/upload-input';
import { ToastEditorModule } from 'common/toast-editor-wrapper';

import { MainComponent } from './main.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AccountComponent } from './pages/account/account.component';
import { BannerComponent } from './pages/banner/banner.component';
import { SiteInfoComponent } from './pages/site-info/site-info.component';
import { SiteLayoutComponent } from './pages/site-layout/site-layout.component';
import { ProductComponent } from './pages/proudct/product.component';
import { ArticleListComponent } from './pages/article-list/article-list.component';
import { ArticleWriteComponent } from './pages/article-write/article-write.component';
import { GalleryComponent } from './pages/gallery/gallery.component';

import { UserDialog } from './dialogs/user/user.dialog';
import { BannerDialog } from './dialogs/banner/banner.dialog';
import { ProductDialog } from './dialogs/product/product.dialog';
import { PhotoDialog } from './dialogs/photo/photo.dialog';

import { UserAPI } from 'common/api/user.api';
import { UploadAPI } from 'common/api/upload.api';
import { BannerAPI } from 'common/api/banner.api';
import { ConfigAPI } from 'common/api/config.api';
import { ProductAPI } from 'common/api/product.api';
import { ArticleAPI } from 'common/api/article.api';
import { PhotoAPI } from 'common/api/photo.api';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';


@NgModule({
  declarations: [
    MainComponent,
    DashboardComponent,
    AccountComponent,
    BannerComponent,
    SiteInfoComponent,
    SiteLayoutComponent,
    ProductComponent,
    ArticleListComponent,
    ArticleWriteComponent,
    GalleryComponent,

    UserDialog,
    BannerDialog,
    ProductDialog,
    PhotoDialog
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LayoutModule,

    MainRoutingModule,
    SlideTabModule,
    UploadInputModule,
    ToastEditorModule,
    
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatTooltipModule,
    MatToolbarModule,
    MatPaginatorModule,
    MatCardModule,
    MatDatepickerModule,
    NgxMatTimepickerModule,
    NgxMatDatetimePickerModule,
    NgxMatNativeDateModule
  ],
  providers: [
    UserAPI,
    UploadAPI,
    BannerAPI,
    ConfigAPI,
    ProductAPI,
    ArticleAPI,
    PhotoAPI
  ]
})
export class MainModule { }
