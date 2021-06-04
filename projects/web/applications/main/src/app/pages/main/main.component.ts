import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Banner } from '@chamfer/server';
import { SiteLayoutData } from 'common/api/configs/site-layout.config';
import { MainData } from './main.resolver';


@Component({
  selector: 'chamfer-main',
  templateUrl: 'main.component.html',
  styleUrls: [ 'main.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent {

  public bannerList!: Banner[];
  public mediaConfig!: SiteLayoutData;

  public isBrowser: boolean;

  constructor(
    route: ActivatedRoute,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    const { bannerList, mediaConfig } = route.snapshot.data.mainData as MainData;

    this.bannerList = bannerList;
    this.mediaConfig = mediaConfig;

    this.isBrowser = isPlatformBrowser(platformId);
  }

}
