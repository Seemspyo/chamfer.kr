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
import { adminUsers, User, UserRole, userRoles } from '@chamfer/server';
import { AuthAPI } from 'common/api/auth.api';
import { parseGQLError } from 'common/api/errors';
import { UserAPI } from 'common/api/user.api';
import { merge, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  switchMap,
  takeUntil
} from 'rxjs/operators';
import { CommonDialogResult } from '../../dialogs/@dialog';
import { UserDialog, UserDialogInput } from '../../dialogs/user/user.dialog';


@Component({
  selector: 'deus-account',
  templateUrl: 'account.component.html',
  styleUrls: [ 'account.component.scss' ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountComponent implements AfterViewInit, OnDestroy {

  public searchForm = this.formBuilder.group({
    searchTargets: [ [ 'username' ], [ Validators.required ] ],
    searchValue: [ '' ]
  });

  public userListModel: User[] = []
  public totalLength = 0;

  private refreshTrigger = new Subject<void>();

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  private destroyed = new Subject<void>();

  private userRoleLabels = new Map<UserRole, string>([
    [ userRoles.deus, '마스터 관리자' ],
    [ userRoles.admin, '관리자' ],
    [ userRoles.common, '일반 회원' ]
  ]);

  private userDialogRef: MatDialogRef<UserDialog, CommonDialogResult>|null = null;

  private processing = false;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private authAPI: AuthAPI,
    private userAPI: UserAPI,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
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
      this.userListModel = data.data;
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

  _canUpdate(roles: UserRole[]) {
    const me = this.authAPI.me!;

    if (roles.includes(userRoles.deus)) {

      return false;
    }

    if (me.roles.includes(userRoles.deus)) {

      return true;
    }

    return !roles.some(role => adminUsers.includes(role as any));
  }

  _canDelete(roles: UserRole[]) {

    return !roles.some(role => adminUsers.includes(role as any));
  }

  _resolveUserRoles(roles: UserRole[]) {

    return roles.map(role => this._resolveUserRole(role));
  }

  _resolveUserRole(role: UserRole) {

    return this.userRoleLabels.get(role)!;
  }

  _openUserDialogOf(user?: User) {
    if (this.userDialogRef) return;

    const data: UserDialogInput = { user }

    this.userDialogRef = this.dialog.open(UserDialog, { data });

    this.userDialogRef.afterClosed().subscribe(result => {
      this.userDialogRef = null;

      if (result?.updated) {
        this.refresh();
      }
    });
  }

  async _deleteUser(user: User) {
    if (this.processing || !confirm('삭제한 정보는 복구할 수 없습니다.\n진행하시겠습니까?')) return;

    let result: boolean;
    try {
      result = await this.userAPI.deleteUser(user.id).toPromise();
    } catch (error) {
      const message = parseGQLError(error)
                      .reduce((message, e) => `${ message }${ e.message }\n`, '');

      this.snackBar.open(message);
      return;
    } finally {
      this.processing = false;
    }

    if (result) {
      this.snackBar.open(`사용자 ${ user.email }(을)를 삭제하였습니다.`);
      this.refresh();
    } else {
      this.snackBar.open('사용자를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  private fetchListData() {
    const { searchTargets, searchValue } = this.searchForm.value;
    const { pageIndex, pageSize: take } = this.paginator;

    return this.userAPI.getUserList(searchValue ? { searchTargets, searchValue } : void 0, { skip: pageIndex * take, take });
  }

}
