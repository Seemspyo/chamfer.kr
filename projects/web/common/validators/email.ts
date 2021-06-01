import { ValidatorFn } from '@angular/forms';
import { isEmail } from '@chamfer/util/dist/is-email';


export const emailValidator: ValidatorFn = ({ value }) => {

  return isEmail(value) ? null : { email: { value } }
}
