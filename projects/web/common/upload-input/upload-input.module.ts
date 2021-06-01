import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UploadAPI } from 'common/api/upload.api';

import { UploadInput } from './upload-input';


@NgModule({
  declarations: [ UploadInput ],
  imports: [
    CommonModule
  ],
  exports: [ UploadInput ],
  providers: [
    UploadAPI
  ]
})
export class UploadInputModule { }
