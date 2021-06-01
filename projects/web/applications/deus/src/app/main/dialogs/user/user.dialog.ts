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
import { User, userRoles, UserUpdateInput } from '@chamfer/server';
import { AuthAPI } from 'common/api/auth.api';
import { parseGQLError } from 'common/api/errors';
import { UserAPI } from 'common/api/user.api';
import { emailValidator } from 'common/validators/email';
import { matchWithValidator } from 'common/validators/match-with';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonDialogResult } from '../@dialog';


export interface UserDialogInput {
  user?: User;
}

@Component({
  selector: 'user-dialog',
  templateUrl: 'user.dialog.html',
  styleUrls: [ 'user.dialog.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDialog implements OnInit, OnDestroy {

  public userForm!: FormGroup;

  private destroyed = new Subject<void>();
  private updated = false;
  public mode!: 'create'|'update';
  public currentUser?: User;
  private processing = false;

  _userRoles = userRoles;
  _me = this.authAPI.me!;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private authAPI: AuthAPI,
    private userAPI: UserAPI,
    private dialogRef: MatDialogRef<UserDialog, CommonDialogResult>,
    @Inject(MAT_DIALOG_DATA) data: UserDialogInput,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder
  ) {
    this.mode = Boolean(data.user) ? 'update' : 'create';
    this.currentUser = data.user;
  }

  ngOnInit() {
    this.setUserFormOf(this.currentUser);

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
        this.createUser();
        break;
      }

      case 'update': {
        this.updateUser();
        break;
      }

    }
  }

  public canSave() {
    if (this.userForm.invalid || this.processing) {
      
      return false;
    }

    switch (this.mode) {

      case 'create': {

        return true;
      }

      case 'update': {
        const values = this.userForm.value;

        if (!values.password) {
          delete values.password;
          delete values.passwordCheck;
        }

        for (const key in values) {
          if (values[key] !== this.currentUser![key as keyof User]) {

            return true;
          }
        }

        return false;
      }

    }
  }

  private setUserFormOf(user?: User) {
    const
    passwordValidator = this.mode === 'create' ? [ Validators.required, Validators.minLength(6) ] : [ Validators.minLength(6) ],
    passwordCheckValidator = [ ...passwordValidator, matchWithValidator(() => this.userForm?.get('password')!) ]

    this.userForm = this.formBuilder.group({
      email: [ user?.email, [ Validators.required, emailValidator ] ],
      username: [ user?.username, [ Validators.required, Validators.maxLength(26) ] ],
      password: [ '', passwordValidator ],
      passwordCheck: [ '', passwordCheckValidator ],
      roles: [ user?.roles || [ userRoles.common ], [ Validators.required ] ]
    });
  }

  private async createUser() {
    this.markProcessing();

    const { email, username, password, roles } = this.userForm.value;

    try {
      await this.userAPI.createUser({ email, username, password, roles }, [ 'id' ]).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.updated = true;
    this.snackBar.open(`사용자 ${ email }(을)를 생성하였습니다.`);
    this.close();
  }

  private async updateUser() {
    this.markProcessing();

    const values = this.userForm.value;
    const input: UserUpdateInput = {}

    for (const _key in values) {
      const key = _key as keyof UserUpdateInput;

      if (values[key] !== this.currentUser![key]) input[key] = values[key];
    }

    try {
      await this.userAPI.updateUser(this.currentUser!.id, input, [ 'id' ]).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.markProcessing(false);
    }

    this.updated = true;
    this.snackBar.open('계정 정보를 수정하였습니다.');
    this.close();
  }

  private markProcessing(state = true) {
    if (this.processing === state) return;

    this.processing = state;
    this.changeDetector.markForCheck();
  }

}
