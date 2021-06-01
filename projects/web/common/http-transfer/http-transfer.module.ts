import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { HttpTransfer } from './http-transfer';


@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpTransfer,
      multi: true
    }
  ]
})
export class HttpTransferModule { }
