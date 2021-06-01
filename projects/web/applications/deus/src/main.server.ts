import 'zone.js/dist/zone-node';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/env';


if (environment.production) {
  enableProdMode();
}

export { KOA_CONTEXT } from 'common/api/auth-strategy';
export { AppServerModule } from './app/app-server.module';
export { renderModule } from '@angular/platform-server';
