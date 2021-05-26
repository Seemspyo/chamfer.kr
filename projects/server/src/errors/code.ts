import { ValueOf } from '@chamfer/util/dist/type-def';


/**
 * @property { string } INVALID requests are not valid or malformed
 * @property { string } PERMISSION_DENIED not enough permission
 * @property { string } FORBIDDEN permission accepted but requested behavior not allowed
 * @property { string } NOT_FOUND resource(s) not exists
 * @property { string } DUPLICATED resource(s) with given data already exists or some unique parameters collided
 * @property { string } INVALID_PASSWORD passwords are invalid
 * @property { string } SERVER_ERROR something goes wrong with server
 */
export const GQL_ERROR_CODES = {

  INVALID: 'INVALID',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATED: 'DUPLICATED',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  SERVER_ERROR: 'INTERNAL_ERROR'

} as const;

export type GQLErrorCode = ValueOf<typeof GQL_ERROR_CODES>;
