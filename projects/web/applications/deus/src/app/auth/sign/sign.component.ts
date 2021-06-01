import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SignInInput } from '@chamfer/server';
import { AuthAPI } from 'common/api/auth.api';
import { ErrorPreset, parseGQLError } from 'common/api/errors';
import { isEmail } from '@chamfer/util/dist/is-email';
import { Router } from '@angular/router';


@Component({
  selector: 'sign',
  templateUrl: 'sign.component.html',
  styleUrls: [ 'sign.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignComponent {
  
  private errorPreset: ErrorPreset = {
    NOT_FOUND: '계정 정보를 찾을 수 없습니다.',
    INVALID_PASSWORD: '비밀번호가 올바르지 않습니다.'
  }

  public passwordVisibility = false;
  public form = this.formBuilder.group({
    username: [ '', [ Validators.required ] ],
    password: [ '', [ Validators.required, Validators.minLength(4) ] ]
  });
  public processing = false;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private authAPI: AuthAPI,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  public togglePasswordVisibility() {
    this.passwordVisibility = !this.passwordVisibility;
    this.changeDetector.markForCheck();
  }

  public canSignIn() {

    return this.form.valid && !this.processing;
  }

  public async signIn() {
    if (!this.canSignIn()) return;

    this.markProcessing();

    const { username, password } = this.form.value;

    const input: SignInInput = {
      [ isEmail(username) ? 'email' : 'username' ]: username,
      password
    }

    try {
      await this.authAPI.signIn(input).toPromise();
    } catch (error) {
      const message = parseGQLError(error, this.errorPreset)
                      .reduce((message, e) => `${ message }${ e.code }: ${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.snackBar.open(`${ this.authAPI.me!.username }(으)로 로그인합니다.`);
    this.router.navigateByUrl('/', { replaceUrl: true });
  }

  private markProcessing(state = true) {
    if (this.processing === state) return;

    this.processing = state;
    this.changeDetector.markForCheck();
  }

}
