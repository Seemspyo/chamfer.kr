import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { AuthAPI } from 'common/api/auth.api';
import { AnyUserGuard } from 'common/api/guards/any-user.guard';


const routes: Routes = [
  { path: '', canActivate: [ AuthAPI ], children: [

    { path: 'auth', loadChildren: () => import('./auth/auth.module').then(exports => exports.AuthModule) },

    { path: '', loadChildren: () => import('./main/main.module').then(exports => exports.MainModule), canLoad: [ AnyUserGuard ], data: { fallback: '/auth/sign' } }

  ] },

  { path: '**', component: PageNotFoundComponent }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      initialNavigation: 'enabledBlocking'
    })
  ],
  exports: [ RouterModule ],
  providers: [
    AnyUserGuard
  ]
})
export class AppRoutingModule { }
