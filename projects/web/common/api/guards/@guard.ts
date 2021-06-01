import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  CanLoad,
  Data,
  Route
} from '@angular/router';


export type GuardReturnType = ReturnType<CanActivate['canActivate']>;

export abstract class NgGuard implements CanActivate, CanActivateChild, CanLoad {

  canActivate(snapshot: ActivatedRouteSnapshot) {
    
    return this.canPass(snapshot.data);
  }

  canActivateChild(snapshot: ActivatedRouteSnapshot) {

    return this.canPass(snapshot.data);
  }

  canLoad(route: Route) {

    return this.canPass(route.data);
  }

  protected abstract canPass(data?: Data): GuardReturnType;
  
}
