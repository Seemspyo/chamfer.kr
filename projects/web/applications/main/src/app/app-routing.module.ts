import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PageNotFound } from './page-not-found/page-not-found';
import { AboutComponent } from './pages/about/about.component';
import { ArticleViewComponent } from './pages/article-view/article-view.component';
import { ArticleViewResolver } from './pages/article-view/article-view.resolver';
import { ArticleComponent } from './pages/article/article.component';
import { ArticleResolver } from './pages/article/article.resolver';
import { MainComponent } from './pages/main/main.component';
import { MainResolver } from './pages/main/main.resolver';
import { PhotoBookComponent } from './pages/photo-book/photo-book.component';
import { ProductComponent } from './pages/proudct/product.component';


const routes: Routes = [
  { path: '', component: MainComponent, resolve: { mainData: MainResolver } },
  { path: 'about', component: AboutComponent, data: { navId: 'about', title: 'ABOUT' } },
  { path: 'products', component: ProductComponent, data: { navId: 'product', title: 'PRODUCT' } },
  { path: 'photo-book', component: PhotoBookComponent, data: { navId: 'photo-book', title: 'PHOTO BOOK' } },
  { path: 'notice', component: ArticleComponent, data: { navId: 'notice', title: 'NOTICE', articleCategory: 'notice' }, resolve: { articleListData: ArticleResolver } },
  { path: 'notice/:idOrUri', component: ArticleViewComponent, data: { navId: 'notice', title: 'NOTICE' }, resolve: { articleData: ArticleViewResolver } },

  { path: '**', component: PageNotFound }
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
    MainResolver,
    ArticleResolver,
    ArticleViewResolver
  ]
})
export class AppRoutingModule { }
