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
import { Photo, PhotoUpdateInput, UploadLog } from '@chamfer/server';
import { parseGQLError } from 'common/api/errors';
import { PhotoAPI } from 'common/api/photo.api';
import { UploadAPI } from 'common/api/upload.api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonDialogResult } from '../@dialog';


export interface PhotoDialogInput {
  photo?: Photo;
}

@Component({
  selector: 'photo-dialog',
  templateUrl: 'photo.dialog.html',
  styleUrls: [ 'photo.dialog.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoDialog implements OnInit, OnDestroy {

  public photoForm!: FormGroup;

  private destroyed = new Subject<void>();
  private updated = false;
  public currentPhoto?: Photo;
  public mode!: 'create'|'update';
  private processing = false;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private photoAPI: PhotoAPI,
    private uploadAPI: UploadAPI,
    private dialogRef: MatDialogRef<PhotoDialog, CommonDialogResult>,
    @Inject(MAT_DIALOG_DATA) data: PhotoDialogInput,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder
  ) {
    this.mode = Boolean(data.photo) ? 'update' : 'create';
    this.currentPhoto = data.photo;
  }

  ngOnInit() {
    this.setPhotoFormOf(this.currentPhoto);

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
        this.createPhoto();
        break;
      }

      case 'update': {
        this.updatePhoto();
        break;
      }

    }
  }

  public canSave() {
    if (this.photoForm.invalid || this.processing) {
      
      return false;
    }

    switch (this.mode) {

      case 'create': {

        return true;
      }

      case 'update': {
        const values = this.photoForm.value;

        for (const key in values) {
          if (values[key] !== this.currentPhoto![key as keyof PhotoUpdateInput]) {

            return true;
          }
        }

        return false;
      }

    }
  }

  async _resolveAndSetImage(image: File|File[]|null) {
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

    this.photoForm.get('resourceURL')!.setValue(`//${ result.origin }${ result.path }`);

    this.changeDetector.markForCheck();
  }

  private setPhotoFormOf(photo?: Photo) {
    this.photoForm = this.formBuilder.group({
      name: [ photo?.name, [ Validators.required, Validators.maxLength(256) ] ],
      resourceURL: [ photo?.resourceURL, [ Validators.required, Validators.maxLength(512) ] ],
      active: [ photo?.active || true, [ Validators.required ] ]
    });
  }

  private async createPhoto() {
    this.markProcessing();

    const values = this.photoForm.value;

    try {
      await this.photoAPI.createPhoto(values, [ 'id' ]).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.updated = true;
    this.snackBar.open('사진을 등록하였습니다.');
    this.close();
  }

  private async updatePhoto() {
    this.markProcessing();

    const values = this.photoForm.value;
    const input: PhotoUpdateInput = {}

    for (const _key in values) {
      const key = _key as keyof PhotoUpdateInput;

      if (values[key] !== this.currentPhoto![key]) input[key] = values[key];
    }

    try {
      await this.photoAPI.updatePhoto(this.currentPhoto!.id, input, [ 'id' ]).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.updated = true;
    this.snackBar.open('사진 정보를 수정하였습니다.');
    this.close();
  }

  private markProcessing(state = true) {
    if (this.processing === state) return;

    this.processing = state;
    this.changeDetector.markForCheck();
  }

}
