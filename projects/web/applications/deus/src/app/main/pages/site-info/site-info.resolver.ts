import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { ConfigAPI } from 'common/api/config.api';
import { of } from 'rxjs';
import { concatMap } from 'rxjs/operators';


export interface SiteInfo {
  footerText: string;
}

export const siteInfoId = 'chamfer.site-info';

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
