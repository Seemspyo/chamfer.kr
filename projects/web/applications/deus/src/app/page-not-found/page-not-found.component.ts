import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit
} from '@angular/core';


@Component({
  selector: 'page-not-found',
  template: `
    <h1>404 NOT FOUND</h1>
    <p>{{ path }} does not exists.</p>
  `,
  styles: [ `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      width: 100%; height: 100%;
    }
  ` ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageNotFoundComponent implements OnInit {

  public path!: string;

  constructor(
    private location: Location
  ) { }

  ngOnInit() {
    this.path = this.location.path();
  }

}
