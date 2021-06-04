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
import { Photo } from '@chamfer/server';
import { parseGQLError } from 'common/api/errors';
import { PhotoAPI } from 'common/api/photo.api';
import { merge, of, Subject } from 'rxjs';
import { catchError, debounceTime, switchMap, takeUntil } from 'rxjs/operators';
import { CommonDialogResult } from '../../dialogs/@dialog';
import { PhotoDialog, PhotoDialogInput } from '../../dialogs/photo/photo.dialog';


@Component({
  selector: 'deus-gallery',
  templateUrl: 'gallery.component.html',
  styleUrls: [ 'gallery.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalleryComponent implements AfterViewInit, OnDestroy {

  public searchForm = this.formBuilder.group({
    searchTargets: [ [ 'name' ], [ Validators.required ] ],
    searchValue: [ '' ]
  });

  public galleryModel: Photo[] = []
  public totalLength = 0;

  private refreshTrigger = new Subject<void>();

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  private photoDialogRef: MatDialogRef<PhotoDialog, CommonDialogResult>|null = null;

  private destroyed = new Subject<void>();

  private processing = false;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private photoAPI: PhotoAPI,
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
      this.galleryModel = data.data;
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

  async _deletePhoto(photo: Photo) {
    if (this.processing || !confirm('삭제한 정보는 복구할 수 없습니다.\n진행하시겠습니까?')) return;

    let result: boolean;
    try {
      result = await this.photoAPI.deletePhoto(photo.id).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.processing = false;
    }

    if (result) {
      this.snackBar.open('사진을 삭제하였습니다.');
      this.refresh();
    } else {
      this.snackBar.open('사진을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  _openPhotoDialogOf(photo?: Photo) {
    if (this.photoDialogRef) return;

    const data: PhotoDialogInput = { photo }

    this.photoDialogRef = this.dialog.open(PhotoDialog, { data });

    this.photoDialogRef.afterClosed().subscribe(result => {
      this.photoDialogRef = null;

      if (result?.updated) {
        this.refresh();
      }
    });
  }

  private fetchListData() {
    const { searchTargets, searchValue } = this.searchForm.value;
    const { pageIndex, pageSize: take } = this.paginator;

    return this.photoAPI.getPhotoList(searchValue ? { searchTargets, searchValue } : void 0, { skip: pageIndex * take, take }, true);
  }

}
