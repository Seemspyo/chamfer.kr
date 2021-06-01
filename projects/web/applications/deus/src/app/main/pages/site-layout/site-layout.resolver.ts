import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { ConfigAPI } from 'common/api/config.api';
import { of } from 'rxjs';
import { concatMap } from 'rxjs/operators';


export interface SiteLayoutData {
  mediaURL: string;
  mediaActive: boolean;
}

export const siteLayoutId = 'chamfer.site-layout';

@Injectable()
export class SiteLayoutResolver implements Resolve<SiteLayoutData> {

  constructor(
    private configAPI: ConfigAPI
  ) { }

  resolve() {

    return this.configAPI.getConfig<SiteLayoutData>(siteLayoutId).pipe(
      concatMap(data => data ? of(data) : this.configAPI.setConfig(siteLayoutId, { mediaURL: '', mediaActive: false } as SiteLayoutData))
    );
  }

}
