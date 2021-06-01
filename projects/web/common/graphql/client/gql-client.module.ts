import {
  ModuleWithProviders,
  NgModule
} from '@angular/core';
import { GQLClient, GQLClientConfig } from './gql-client';


@NgModule({
  providers: [ GQLClient ]
})
export class GQLClientModule {

  static withConfig(config: GQLClientConfig): ModuleWithProviders<GQLClientModule> {

    return {
      ngModule: GQLClientModule,
      providers: [
        {
          provide: GQLClientConfig,
          useValue: config
        }
      ]
    }
  }

}
