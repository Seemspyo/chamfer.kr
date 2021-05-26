import { ParameterizedContext } from 'koa';
import { User } from '../models/user.model';


export interface GQLContext {
  authType: string;
  user: User|null;
  koaContext: ParameterizedContext;
}
