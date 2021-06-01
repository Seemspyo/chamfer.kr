import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Banner,
  BannerCreateInput,
  bannerLinkTargets,
  BannerUpdateInput,
  UploadLog
} from '@chamfer/server';
import { BannerAPI } from 'common/api/banner.api';
import { parseGQLError } from 'common/api/errors';
import { UploadAPI } from 'common/api/upload.api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonDialogResult } from '../@dialog';


export interface BannerDialogInput {
  banner?: Banner;
}

@Component({
  selector: 'banner-dialog',
  templateUrl: 'banner.dialog.html',
  styleUrls: [ 'banner.dialog.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BannerDialog implements OnInit, OnDestroy {

  public bannerForm!: FormGroup;

  private destroyed = new Subject<void>();
  private updated = false;
  public currentBanner?: Banner;
  public mode!: 'create'|'update';
  private processing = false;

  _linkTargets = bannerLinkTargets;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private bannerAPI: BannerAPI,
    private uploadAPI: UploadAPI,
    private dialogRef: MatDialogRef<BannerDialog, CommonDialogResult>,
    @Inject(MAT_DIALOG_DATA) data: BannerDialogInput,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder
  ) {
    this.mode = Boolean(data.banner) ? 'update' : 'create';
    this.currentBanner = data.banner;
  }

  ngOnInit() {
    this.setUserFormOf(this.currentBanner);

    // hook backdrop click event
    this.dialogRef.backdropClick().pipe(
      takeUntil(this.destroyed)
    ).subscribe(() => this.close());
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public close() {
    this.dialogRef.close({ updated: this.updated });
  }

  public save() {
    if (!this.canSave()) return;

    switch (this.mode) {

      case 'create': {
        this.createBanner();
        break;
      }

      case 'update': {
        this.updateBanner();
        break;
      }

    }
  }

  public canSave() {
    if (this.bannerForm.invalid || this.processing) {
      
      return false;
    }

    switch (this.mode) {

      case 'create': {

        return true;
      }

      case 'update': {
        const values = this.bannerForm.value;

        for (const key in values) {
          if (values[key] !== this.currentBanner![key as keyof BannerCreateInput]) {

            return true;
          }
        }

        return false;
      }

    }
  }

  /** workaround for https://github.com/h2qutc/angular-material-components/issues/77 */
  _any(v: any) {

    return v;
  }

  async _resolveAndSetImage(image: File|File[]|null, name: 'thumbnailURL'|'thumbnailURLAlt') {
    if (!(image instanceof File)) return;

    let result: UploadLog;

    try {
      result = await this.uploadAPI.singleUpload(image).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    }
    
    const control = this.bannerForm.get(name)!;

    control.setValue(`//${ result.origin }${ result.path }`);
    this.changeDetector.markForCheck();
  }

  _clearImage(name: 'thumbnailURL'|'thumbnailURLAlt') {
    const control = this.bannerForm.get(name)!;

    control.setValue(null);
    this.changeDetector.markForCheck();
  }

  private setUserFormOf(banner?: Banner) {
    this.bannerForm = this.formBuilder.group({
      name: [ banner?.name, [ Validators.required, Validators.maxLength(128) ] ],
      link: [ banner?.link, [ Validators.maxLength(512) ] ],
      linkTarget: [ banner?.linkTarget ?? bannerLinkTargets.blank ],
      thumbnailURL: [ banner?.thumbnailURL, [ Validators.required, Validators.maxLength(512) ] ],
      thumbnailURLAlt: [ banner?.thumbnailURLAlt, [ Validators.maxLength(512) ] ],
      active: [ banner?.active ?? true, [ Validators.required ] ],
      startDisplayAt: [ banner?.startDisplayAt ?? null ],
      endDisplayAt: [ banner?.endDisplayAt ?? null ]
    });
  }

  private async createBanner() {
    this.markProcessing();

    const values = this.bannerForm.value;

    try {
      await this.bannerAPI.createBanner(values, [ 'id' ]).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.updated = true;
    this.snackBar.open('배너를 생성하였습니다.');
    this.close();
  }

  private async updateBanner() {
    this.markProcessing();

    const values = this.bannerForm.value;
    const input: BannerUpdateInput = {}

    for (const _key in values) {
      const key = _key as keyof BannerUpdateInput;

      if (values[key] !== this.currentBanner![key]) input[key] = values[key];
    }

    try {
      await this.bannerAPI.updateBanner(this.currentBanner!.id, input, [ 'id' ]).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.updated = true;
    this.snackBar.open('배너를 수정하였습니다.');
    this.close();
  }

  private markProcessing(state = true) {
    if (this.processing === state) return;

    this.processing = state;
    this.changeDetector.markForCheck();
  }

}
