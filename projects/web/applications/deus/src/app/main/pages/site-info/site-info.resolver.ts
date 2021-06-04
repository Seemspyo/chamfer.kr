import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { ConfigAPI } from 'common/api/config.api';
import { SiteInfo, siteInfoId } from 'common/api/configs/site-info.config';
import { of } from 'rxjs';
import { concatMap } from 'rxjs/operators';


@Injectable()
export class SiteInfoResolver implements Resolve<SiteInfo> {

  constructor(
    private configAPI: ConfigAPI
  ) { }

  resolve() {

    return this.configAPI.getConfig<SiteInfo>(siteInfoId).pipe(
      concatMap(data => data ? of(data) : this.configAPI.setConfig(siteInfoId, { footerText: '' } as SiteInfo))
    );
  }

}
