import { Injectable } from '@angular/core';
import { Data, Router } from '@angular/router';
import { AuthAPI } from '../auth.api';
import { NgGuard } from './@guard';


@Injectable()
export class VisitorOnlyGuard extends NgGuard {

  constructor(
    private authAPI: AuthAPI, 
    private router: Router
  ) {
    super();
  }

  protected async canPass(data?: Data) {
    await this.authAPI.init();

    if (this.authAPI.authorized) {

      return this.router.parseUrl(data?.fallback ?? '/');
    }

    return true;
  }

}
