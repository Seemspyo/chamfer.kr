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
  Product,
  ProductType,
  productTypes,
  ProductUpdateInput,
  UploadLog
} from '@chamfer/server';
import { parseGQLError } from 'common/api/errors';
import { ProductAPI } from 'common/api/product.api';
import { UploadAPI } from 'common/api/upload.api';
import { requiredIfValidator } from 'common/validators/required-if';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonDialogResult } from '../@dialog';


export interface ProductDialogInput {
  product?: Product;
}

@Component({
  selector: 'product-dialog',
  templateUrl: 'product.dialog.html',
  styleUrls: [ 'product.dialog.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDialog implements OnInit, OnDestroy {

  public productForm!: FormGroup;

  private destroyed = new Subject<void>();
  private updated = false;
  public currentProduct?: Product;
  public mode!: 'create'|'update';
  private processing = false;

  _productTypes = productTypes;

  private previousFiles: File[] = []

  constructor(
    private changeDetector: ChangeDetectorRef,
    private productAPI: ProductAPI,
    private uploadAPI: UploadAPI,
    private dialogRef: MatDialogRef<ProductDialog, CommonDialogResult>,
    @Inject(MAT_DIALOG_DATA) data: ProductDialogInput,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder
  ) {
    this.mode = Boolean(data.product) ? 'update' : 'create';
    this.currentProduct = data.product;
  }

  ngOnInit() {
    this.setUserFormOf(this.currentProduct);

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
        this.createProduct();
        break;
      }

      case 'update': {
        this.updateProduct();
        break;
      }

    }
  }

  public canSave() {
    if (this.productForm.invalid || this.processing) {
      
      return false;
    }

    switch (this.mode) {

      case 'create': {

        return true;
      }

      case 'update': {
        const values = this.productForm.value;

        for (const key in values) {
          if (values[key] !== this.currentProduct![key as keyof ProductUpdateInput]) {

            return true;
          }
        }

        return false;
      }

    }
  }

  async _resolveAndSetImages(images: File|File[]|null) {
    if (!images || !Array.isArray(images)) return;

    let results: UploadLog[];

    try {
      results = await Promise.all(
        images.filter(image => !this.previousFiles.includes(image))
              .map(image => this.uploadAPI.singleUpload(image).toPromise())
      );
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    }

    const control = this.productForm.get('thumbnailURLs')!;

    control.setValue([ ...control.value, ...results.map(result => `//${ result.origin }${ result.path }`) ]);
    this.previousFiles = [ ...images ]
    this.changeDetector.markForCheck();
  }

  _clearImage(name: 'thumbnailURL'|'thumbnailURLAlt') {
    const control = this.productForm.get(name)!;

    control.setValue(null);
    this.changeDetector.markForCheck();
  }

  _isCurrentTypeIs(type: ProductType) {

    return this.productForm?.get('type')!.value === type;
  }

  _getCurrentThumbnails(): string[] {

    return this.productForm?.get('thumbnailURLs')!.value || [];
  }

  _removeThumbnail(url: string) {
    const control = this.productForm!.get('thumbnailURLs')!;

    const urlIndex = control.value.indexOf(url);

    if (urlIndex < 0) return;

    const value: string[] = control.value;

    value.splice(urlIndex, 1);
    control.setValue(value);
  }

  private setUserFormOf(product?: Product) {
    this.productForm = this.formBuilder.group({
      type: [ product?.type ?? productTypes.forward, [ Validators.required ] ],
      uri: [ product?.uri, [ requiredIfValidator(() => !this._isCurrentTypeIs(productTypes.forward)), Validators.maxLength(256) ] ],
      title: [ product?.title, [ Validators.required, Validators.maxLength(256) ] ],
      description: [ product?.description, Validators.max(512) ],
      link: [ product?.link, [ requiredIfValidator(() => this._isCurrentTypeIs(productTypes.forward)), Validators.maxLength(512) ] ],
      price: [ product?.price ],
      thumbnailURLs: [ product?.thumbnailURLs || [] ],
      tags: [ product?.tags || [] ],
      locked: [ product?.locked || false, [ Validators.required ] ]
    });
  }

  private async createProduct() {
    this.markProcessing();

    const values = this.productForm.value;

    try {
      await this.productAPI.createProduct(values, [ 'id' ]).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.updated = true;
    this.snackBar.open('상품 정보를 생성하였습니다.');
    this.close();
  }

  private async updateProduct() {
    this.markProcessing();

    const values = this.productForm.value;
    const input: ProductUpdateInput = {}

    for (const _key in values) {
      const key = _key as keyof ProductUpdateInput;

      if (values[key] !== this.currentProduct![key]) input[key] = values[key];
    }

    try {
      await this.productAPI.updateProduct(this.currentProduct!.id, input, [ 'id' ]).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.updated = true;
    this.snackBar.open('상품 정보를 수정하였습니다.');
    this.close();
  }

  private markProcessing(state = true) {
    if (this.processing === state) return;

    this.processing = state;
    this.changeDetector.markForCheck();
  }

}
