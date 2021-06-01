import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { VOID } from '@chamfer/util/dist/void';


@Component({
  selector: 'upload-input',
  templateUrl: 'upload-input.html',
  styles: [ `

    .upload-input {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: dashed 2px #8e8e8e;
      border-radius: 12px;
      padding: 24px;
    }

    .upload-input-native {
      display: none;
    }

    .upload-input-active {
      border-color: var(--upload-input-active, coral);
    }

    .upload-input-disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  ` ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'class': 'upload-input',
    '[class.upload-input-active]': '_active',
    '[class.upload-input-disabled]': 'disabled',
    '(click)': 'fileInputRef.nativeElement.click();onTouch()',
    '(dragover)': '_handleDragEvent($event)',
    '(dragleave)': '_handleDragEvent($event)',
    '(drop)': '_handleDragEvent($event)'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: UploadInput,
      multi: true
    }
  ]
})
export class UploadInput implements ControlValueAccessor, OnChanges {

  @Input()
  accept = '*';

  @Input()
  multiple = false;

  @Input()
  disabled = false;

  @Input()
  required = false;

  @ViewChild('fileInput')
  fileInputRef!: ElementRef<HTMLInputElement>;

  _active = false;

  private file: File|null = null;
  private files: File[] = []

  onChange: any = VOID;
  onTouch: any = VOID;

  get value() {

    return this.multiple ? this.files : this.file;
  }

  @Output('change')
  changeEvent = new  EventEmitter<File|File[]|null>();

  constructor(
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnChanges({ multiple }: SimpleChanges) {
    if (multiple?.currentValue !== multiple?.previousValue) {
      switch (multiple.currentValue) {

        case true: {
          this.files = this.file ? [ this.file ] : []
          this.file = null;
          break;
        }

        case false: {
          this.file = this.files[0] || null;
          this.files = []
          break;
        }

      }

      this.notifyChange();
    }
  }

  writeValue(value: File|File[]) {
    if (this.isMultiple(value)) {
      this.files = value;
    } else {
      this.file = value;
    }

    this.changeDetector.markForCheck();
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouch = fn;
  }

  public asDataURL() {

    return !this.multiple ? (this.file ? this.readAsDataURL(this.file) : Promise.resolve(null)) : Promise.all(this.files.map(file => this.readAsDataURL(file)));
  }

  _handleDragEvent(event: DragEvent) {
    switch (event.type) {

      case 'dragover': {
        event.preventDefault();

        this.markActive();
        break;
      }

      case 'drop': {
        event.preventDefault();

        this.markActive(false);

        if (!event.dataTransfer) return;

        const { items } = event.dataTransfer;

        if (this.multiple) {
          for (const item of items) {
            const file = item.getAsFile();
  
            if (file) {
              this.files.push(file);
            }
          }
        } else {
          const file = items[0].getAsFile();

          if (file) {
            this.file = file;
          }
        }
        
        this.notifyChange();
        break;
      }

      case 'dragleave': {
        this.markActive(false);
        break;
      }

    }
  }

  _onFileInput() {
    const { files } = this.fileInputRef.nativeElement;

    if (!files?.length) return;

    switch (this.multiple) {
      case true:
        for (const file of files) {
          this.files.push(file);
        }
        break;
      case false:
        this.file = files.item(0);
        break;
    }

    this.notifyChange();
  }

  private isMultiple(value: File|File[]): value is File[] {

    return this.multiple;
  }

  private markActive(state = true) {
    if (this._active === state) return;

    this._active = state;
    this.changeDetector.markForCheck();
  }

  private notifyChange() {
    this.onChange(this.value);
    this.changeEvent.emit(this.value);
  }

  private readAsDataURL(file: File) {
    const reader = new FileReader();

    return new Promise<string>((resolve, reject) => {
      reader.addEventListener('load', () => resolve(reader.result as string));
      reader.addEventListener('error', reject);

      reader.readAsDataURL(file);
    });
  }

}
