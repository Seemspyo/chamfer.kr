import { HttpEvent, HttpEventType, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';


export interface ProgressState {
  value: boolean;
  mode?: 'determinate'|'query';
  progress?: number;
}

@Injectable()
export class ProgressInterceptor implements HttpInterceptor, OnDestroy {

  public progress = new BehaviorSubject<ProgressState>({ value: false });

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    req = req.clone({ reportProgress: true });

    this.progress.next({ value: true, mode: 'query' })

    return next.handle(req).pipe(

      catchError(error => {
        this.progress.next({ value: false });

        return throwError(error);
      }),

      tap(event => {
        switch (event.type) {
          case HttpEventType.ResponseHeader:
            this.progress.next({ value: true, mode: 'determinate' });
            break;
          case HttpEventType.DownloadProgress:
            const progress = Math.floor(event.loaded / (event.total ?? event.loaded) * 100);

            this.progress.next({ value: true, mode: 'determinate', progress });
            break;
          case HttpEventType.Response:
            this.progress.next({ value: false });
            break;
        }
      })

    );
  }

  ngOnDestroy() {
    this.progress.complete();
  }

}
