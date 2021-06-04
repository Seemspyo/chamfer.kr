import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { ConfigAPI } from 'common/api/config.api';
import { SiteLayoutData, siteLayoutId } from 'common/api/configs/site-layout.config';
import { of } from 'rxjs';
import { concatMap } from 'rxjs/operators';


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
