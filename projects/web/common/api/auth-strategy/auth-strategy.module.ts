import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { AuthStrategy, AuthStrategyConfig } from './auth-strategy';


@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthStrategy,
      multi: true
    }
  ]
})
export class AuthStrategyModule {

  static withConfig(config: AuthStrategyConfig): ModuleWithProviders<AuthStrategyModule> {

    return {
      ngModule: AuthStrategyModule,
      providers: [
        {
          provide: AuthStrategyConfig,
          useValue: config
        }
      ]
    }
  }

}
