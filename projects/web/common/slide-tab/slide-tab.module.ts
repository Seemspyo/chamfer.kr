import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SlideTab } from './slide-tab';
import { SlideTabItem } from './slide-tab-item';


@NgModule({
  declarations: [
    SlideTab,
    SlideTabItem
  ],
  imports: [
    CommonModule,

    MatButtonModule,
    MatIconModule
  ],
  exports: [
    SlideTab,
    SlideTabItem
  ]
})
export class SlideTabModule { }
