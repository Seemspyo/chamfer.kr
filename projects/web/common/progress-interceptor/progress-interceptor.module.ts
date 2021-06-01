import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ProgressInterceptor } from './progress-interceptor';


@NgModule({
  providers: [
    ProgressInterceptor,
    {
      provide: HTTP_INTERCEPTORS,
      useExisting: ProgressInterceptor,
      multi: true
    }
  ]
})
export class ProgressInterceptorModule { }
