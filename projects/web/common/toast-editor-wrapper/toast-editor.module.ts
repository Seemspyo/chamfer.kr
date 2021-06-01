import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ToastEditor } from './toast-editor';


@NgModule({
  declarations: [ ToastEditor ],
  imports: [
    CommonModule
  ],
  exports: [ ToastEditor ]
})
export class ToastEditorModule { }
