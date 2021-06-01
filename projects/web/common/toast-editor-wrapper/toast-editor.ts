import '@toast-ui/editor/dist/i18n/ko-kr.js';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import Editor from '@toast-ui/editor';
import { UploadAPI } from 'common/api/upload.api';
import { VOID } from '@chamfer/util/dist/void';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';


@Component({
  selector: 'toast-editor',
  templateUrl: 'toast-editor.html',
  styles: [`
    :host {
      display: block;
      width: 100%; height: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ToastEditor,
      multi: true
    }
  ]
})
export class ToastEditor implements ControlValueAccessor, AfterViewInit, OnDestroy {

  @ViewChild('editor')
  editorElRef!: ElementRef<HTMLElement>;

  public editor?: Editor;

  @Input()
  get value() {

    return this._value;
  }
  set value(value: string) {
    if (value === this.value) return;

    this._value = value;
    this.editor?.setMarkdown(this.value);
    this.onChange(value);
  }
  private _value = '';

  onChange: (value: string) => void = VOID;
  onTouch = VOID;

  private destroyed = new Subject<void>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private upload: UploadAPI
  ) { }

  ngAfterViewInit() {
    this.editor = new Editor({
      el: this.editorElRef.nativeElement,
      height: '100%',
      minHeight: '500px',
      initialEditType: 'markdown',
      usageStatistics: false,
      language: 'ko-KR',
      initialValue: this.value,
      previewHighlight: false,
      previewStyle: 'vertical',
      hooks: {
        addImageBlobHook: async (file, next) => {
          const log = await this.upload.singleUpload(file as File, [ 'origin', 'path' ]).toPromise();

          next(`//${ log.origin }${ log.path }`, '');
        }
      }
    });

    {
      const valueChanges = new Subject<void>();

      valueChanges.pipe(
        debounceTime(200),
        takeUntil(this.destroyed)
      ).subscribe(() => {
        this._value = this.editor!.getMarkdown();
        this.onChange(this.value);
        this.changeDetector.markForCheck();
      });

      this.editor.on('change', () => valueChanges.next());
    }

    this.editor.on('blur', () => this.onTouch());
  }

  ngOnDestroy() {
    this.editor?.remove();
    this.destroyed.next();
    this.destroyed.complete();
  }

  writeValue(value: string) {
    this.value = value;
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouch = fn;
  }

}
