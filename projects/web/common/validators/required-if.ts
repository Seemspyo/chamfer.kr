import { AbstractControl, ValidatorFn, Validators } from '@angular/forms';


export function requiredIfValidator(conditionFn: (control: AbstractControl) => boolean): ValidatorFn {

  return control => conditionFn(control) ? Validators.required(control) : null;
}
