import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArticleResolver } from 'common/api/article.resolver';

import { AdminUserGuard } from 'common/api/guards/admin-user.guard';
import { MainComponent } from './main.component';
import { AccountComponent } from './pages/account/account.component';
import { ArticleListComponent } from './pages/article-list/article-list.component';
import { ArticleWriteComponent } from './pages/article-write/article-write.component';
import { BannerComponent } from './pages/banner/banner.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { ProductComponent } from './pages/proudct/product.component';
import { SiteInfoComponent } from './pages/site-info/site-info.component';
import { SiteInfoResolver } from './pages/site-info/site-info.resolver';
import { SiteLayoutComponent } from './pages/site-layout/site-layout.component';
import { SiteLayoutResolver } from './pages/site-layout/site-layout.resolver';


const routes: Routes = [
  { path: '', component: MainComponent, canActivate: [ AdminUserGuard ], data: { fallback: '/404' }, children: [
    { path: '', component: DashboardComponent, data: { id: [ 'site', 'dashboard' ] } },
    { path: 'users', component: AccountComponent, data: { id: 'user' } },
    { path: 'banner', component: BannerComponent, data: { id: [ 'site', 'banner' ] } },
    { path: 'site-info', component: SiteInfoComponent, data: { id: [ 'site', 'site-info' ] }, resolve: { siteInfo: SiteInfoResolver } },
    { path: 'site-layout', component: SiteLayoutComponent, data: { id: [ 'site', 'site-layout' ] }, resolve: { siteLayoutData: SiteLayoutResolver } },
    { path: 'products', component: ProductComponent, data: { id: 'product' } },
    { path: 'articles', data: { id: 'article' }, children: [
      { path: 'write', component: ArticleWriteComponent },
      { path: 'write/:id', component: ArticleWriteComponent, resolve: { article: ArticleResolver } },
      { path: ':category', component: ArticleListComponent, data: { id: 'article-notice' } }
    ] },
    { path: 'gallery', component: GalleryComponent, data: { id: 'gallery' } }
  ] }
]

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [ RouterModule ],
  providers: [
    AdminUserGuard,
    SiteInfoResolver,
    SiteLayoutResolver,
    ArticleResolver
  ]
})
export class MainRoutingModule { }
