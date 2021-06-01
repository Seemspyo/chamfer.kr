import { Injectable } from '@angular/core';
import { Data, Router } from '@angular/router';
import { adminUsers } from '@chamfer/server';
import { AuthAPI } from '../auth.api';
import { NgGuard } from './@guard';


@Injectable()
export class AdminUserGuard extends NgGuard {

  constructor(
    private authAPI: AuthAPI,
    private router: Router
  ) {
    super();
  }

  protected async canPass(data?: Data) {
    await this.authAPI.init();

    if (this.authAPI.me?.roles.some(role => adminUsers.includes(role as any))) {

      return true;
    }

    return this.router.parseUrl(data?.fallback ?? '/');
  }

}
