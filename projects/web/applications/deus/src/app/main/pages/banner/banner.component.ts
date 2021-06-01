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
import { Banner } from '@chamfer/server';
import { BannerAPI } from 'common/api/banner.api';
import { parseGQLError } from 'common/api/errors';
import { merge, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  switchMap,
  takeUntil
} from 'rxjs/operators';
import { CommonDialogResult } from '../../dialogs/@dialog';
import { BannerDialog, BannerDialogInput } from '../../dialogs/banner/banner.dialog';


@Component({
  selector: 'deus-banner',
  templateUrl: 'banner.component.html',
  styleUrls: [ 'banner.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BannerComponent implements AfterViewInit, OnDestroy {

  public searchForm = this.formBuilder.group({
    searchTargets: [ [ 'name' ], [ Validators.required ] ],
    searchValue: [ '' ]
  });

  public bannerListModel: Banner[] = []
  public totalLength = 0;

  private refreshTrigger = new Subject<void>();

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  private bannerDialogRef: MatDialogRef<BannerDialog, CommonDialogResult>|null = null;

  private destroyed = new Subject<void>();

  private processing = false;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private bannerAPI: BannerAPI,
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
      this.bannerListModel = data.data;
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

  async _deleteBanner(banner: Banner) {
    if (this.processing || !confirm('삭제한 정보는 복구할 수 없습니다.\n진행하시겠습니까?')) return;

    let result: boolean;
    try {
      result = await this.bannerAPI.deleteBanner(banner.id).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.processing = false;
    }

    if (result) {
      this.snackBar.open('배너를 삭제하였습니다.');
      this.refresh();
    } else {
      this.snackBar.open('배너를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  _openBannerDialogOf(banner?: Banner) {
    if (this.bannerDialogRef) return;

    const data: BannerDialogInput = { banner }

    this.bannerDialogRef = this.dialog.open(BannerDialog, { data });

    this.bannerDialogRef.afterClosed().subscribe(result => {
      this.bannerDialogRef = null;

      if (result?.updated) {
        this.refresh();
      }
    });
  }

  private fetchListData() {
    const { searchTargets, searchValue } = this.searchForm.value;
    const { pageIndex, pageSize: take } = this.paginator;

    return this.bannerAPI.getBannerList(searchValue ? { searchTargets, searchValue } : void 0, { skip: pageIndex * take, take });
  }

}
