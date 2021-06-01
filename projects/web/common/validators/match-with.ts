import { AbstractControl, ValidatorFn } from '@angular/forms';


export function matchWithValidator(getControl: () => AbstractControl): ValidatorFn {

  return ({ value }) => {
    const control = getControl();

    if (!control) return null;

    return control.value === value ? null : { matchWith: { value } }
  }
}
