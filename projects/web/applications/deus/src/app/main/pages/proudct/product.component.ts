import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '@chamfer/server';
import { parseGQLError } from 'common/api/errors';
import { ProductAPI } from 'common/api/product.api';
import { merge, of, Subject } from 'rxjs';
import { catchError, debounceTime, switchMap, takeUntil } from 'rxjs/operators';
import { CommonDialogResult } from '../../dialogs/@dialog';
import { ProductDialog, ProductDialogInput } from '../../dialogs/product/product.dialog';


@Component({
  selector: 'deus-product',
  templateUrl: 'product.component.html',
  styleUrls: [ 'product.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductComponent implements AfterViewInit, OnDestroy {

  public searchForm = this.formBuilder.group({
    searchTargets: [ [ 'title' ], [ Validators.required ] ],
    searchValue: [ '' ]
  });

  public productListModel: Product[] = []
  public totalLength = 0;

  private refreshTrigger = new Subject<void>();

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  private productDialogRef: MatDialogRef<ProductDialog, CommonDialogResult>|null = null;

  private destroyed = new Subject<void>();

  private processing = false;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private productAPI: ProductAPI,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngAfterViewInit() {
    merge(
      this.refreshTrigger.pipe( debounceTime(200) ),
      this.paginator.page
    ).pipe(
      switchMap(() => this.fetchListData().pipe(
        catchError(error => {
          const message = parseGQLError(error)
                          .reduce((message, e) => `${ message }${ e.message }\n`, '');
    
          this.snackBar.open(message);

          return of({ total: 0, data: [] });
        })
      )),
      takeUntil(this.destroyed)
    ).subscribe(data => {
      this.totalLength = data.total;
      this.productListModel = data.data;
      this.changeDetector.markForCheck();
    });

    this.refresh();
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public refresh() {
    this.refreshTrigger.next();
  }

  async _deleteProduct(product: Product) {
    if (this.processing || !confirm('????????? ????????? ????????? ??? ????????????.\n?????????????????????????')) return;

    let result: boolean;
    try {
      result = await this.productAPI.deleteProduct(product.id).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.processing = false;
    }

    if (result) {
      this.snackBar.open('?????? ????????? ?????????????????????.');
      this.refresh();
    } else {
      this.snackBar.open('?????? ????????? ???????????? ???????????????. ?????? ??? ?????? ????????? ?????????.');
    }
  }

  _openProductDialogOf(product?: Product) {
    if (this.productDialogRef) return;

    const data: ProductDialogInput = { product }

    this.productDialogRef = this.dialog.open(ProductDialog, { data });

    this.productDialogRef.afterClosed().subscribe(result => {
      this.productDialogRef = null;

      if (result?.updated) {
        this.refresh();
      }
    });
  }

  private fetchListData() {
    const { searchTargets, searchValue } = this.searchForm.value;
    const { pageIndex, pageSize: take } = this.paginator;

    return this.productAPI.getProductList(searchValue ? { searchTargets, searchValue } : void 0, { skip: pageIndex * take, take }, true);
  }

}
