import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Data } from '@angular/router';
import { ConfigAPI } from 'common/api/config.api';
import { parseGQLError } from 'common/api/errors';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { siteInfoId, SiteInfo } from './site-info.resolver';


@Component({
  selector: 'deus-site-info',
  templateUrl: 'site-info.component.html',
  styleUrls: [ 'site-info.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteInfoComponent implements OnInit, OnDestroy {

  public siteInfoForm!: FormGroup;
  private siteInfo!: SiteInfo;

  private processing = false;
  private destroyed = new Subject<void>();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private configAPI: ConfigAPI,
    private snackBar: MatSnackBar
  ) {
    this.siteInfo = route.snapshot.data.siteInfo;
    this.setFormOf(this.siteInfo);
  }

  ngOnInit() {
    this.initializeWith(this.route.snapshot.data);
    this.route.data.pipe( takeUntil(this.destroyed) )
    .subscribe(data => this.initializeWith(data));
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public canSave() {
    if (this.processing) return false;

    const values = this.siteInfoForm.value;

    for (const key in values) {
      if (values[key] !== this.siteInfo[key as keyof SiteInfo]) return true;
    }

    return false;
  }

  public async save() {
    if (!this.canSave()) return;

    this.markProcessing();

    let info: SiteInfo = this.siteInfoForm.value;

    try {
      info = await this.configAPI.setConfig(siteInfoId, info).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.siteInfo = info;
    this.snackBar.open('사이트 정보를 저장하였습니다.');
  }

  private initializeWith(data: Data) {
    this.siteInfo = data.siteInfo;
    this.setFormOf(this.siteInfo);

    this.changeDetector.markForCheck();
  }

  private setFormOf(info: SiteInfo) {
    this.siteInfoForm = this.formBuilder.group({
      footerText: [ info?.footerText ]
    });
  }

  private markProcessing(state = true) {
    if (this.processing === state) return;

    this.processing = state;
    this.changeDetector.markForCheck();
  }

}
