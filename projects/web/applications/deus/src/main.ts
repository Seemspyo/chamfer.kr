import { enableProdMode } from '@angular/core';
import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';
import { environment } from './environments/env';


if (environment.production) {
  enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
  platformBrowser()
  .bootstrapModule(AppModule)
  .catch(error => console.error(error));
});
