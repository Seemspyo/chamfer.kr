import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Data } from '@angular/router';
import { ConfigAPI } from 'common/api/config.api';
import { parseGQLError } from 'common/api/errors';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SiteLayoutData, siteLayoutId } from './site-layout.resolver';


@Component({
  selector: 'deus-site-layout',
  templateUrl: 'site-layout.component.html',
  styleUrls: [ 'site-layout.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteLayoutComponent implements OnInit, OnDestroy {

  public layoutForm!: FormGroup;
  private siteLayoutData!: SiteLayoutData;

  private processing = false;

  private destoryed = new Subject<void>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private configAPI: ConfigAPI,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.initializeWith(this.route.snapshot.data);
    this.route.data.pipe( takeUntil(this.destoryed) )
    .subscribe(data => this.initializeWith(data));
  }

  ngOnDestroy() {
    this.destoryed.next();
    this.destoryed.complete();
  }

  public canSave() {
    if (this.processing) return false;

    const values = this.layoutForm.value;

    for (const key in values) {
      if (values[key] !== this.siteLayoutData[key as keyof SiteLayoutData]) return true;
    }

    return false;
  }

  public async save() {
    if (!this.canSave()) return;

    this.markProcessing();

    let data: SiteLayoutData = this.layoutForm.value;

    try {
      data = await this.configAPI.setConfig(siteLayoutId, data).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.siteLayoutData = data;
    this.snackBar.open('레이아웃 설정을 저장하였습니다.');
  }

  private initializeWith(data: Data) {
    this.siteLayoutData = data.siteLayoutData;
    this.setFormOf(this.siteLayoutData);
  }

  private setFormOf(data: SiteLayoutData) {
    this.layoutForm = this.formBuilder.group({
      mediaURL: [ data?.mediaURL ],
      mediaActive: [ data?.mediaActive, [ Validators.required ] ]
    });

    this.changeDetector.markForCheck();
  }

  private markProcessing(state = true) {
    if (this.processing === state) return;

    this.processing = state;
    this.changeDetector.markForCheck();
  }

}
