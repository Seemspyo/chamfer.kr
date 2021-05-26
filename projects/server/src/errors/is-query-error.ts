import { QueryFailedError } from 'typeorm';


export function isQueryError(err: any): err is QueryFailedError & { code: string; } {

  return err instanceof QueryFailedError;
}
