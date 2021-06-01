import { Directive, ElementRef } from '@angular/core';


@Directive({
  selector: '[slideTabItem]',
  exportAs: 'slideTabItem',
  host: {
    'class': 'slide-tab-item',
    '[class.slide-tab-active]': 'active'
  }
})
export class SlideTabItem {

  public active = false;

  constructor(
    public elRef: ElementRef<HTMLElement>
  ) { }

}
