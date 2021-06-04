import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Banner } from '@chamfer/server';
import { SiteLayoutData, siteLayoutId } from 'common/api/configs/site-layout.config';
import { BannerAPI } from 'common/api/banner.api';
import { ConfigAPI } from 'common/api/config.api';
import { map } from 'rxjs/operators';


export interface MainData {
  bannerList: Banner[];
  mediaConfig: SiteLayoutData;
}

@Injectable()
export class MainResolver implements Resolve<MainData> {

  constructor(
    private bannerAPI: BannerAPI,
    private configAPI: ConfigAPI
  ) { }

  async resolve(): Promise<MainData> {
    const [ bannerList, mediaConfig ] = await Promise.all([
      this.bannerAPI.getPublicBannerList().pipe(
        map(res => res.data)
      ).toPromise(),
      this.configAPI.getConfig<SiteLayoutData>(siteLayoutId).toPromise()
    ]);

    return { bannerList, mediaConfig: mediaConfig || { mediaActive: false, mediaURL: '' } }
  }

}
