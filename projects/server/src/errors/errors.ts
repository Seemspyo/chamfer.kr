import { ApolloError } from 'apollo-server-koa';
import { GQL_ERROR_CODES } from './code';


export { ApolloError as GQLError } from 'apollo-server-koa';

export class GQLInvalidError extends ApolloError {

  constructor(message = 'invalid request') {
    super(message, GQL_ERROR_CODES.INVALID);
  }

}

export class GQLPermissionError extends ApolloError {

  constructor(message = 'not enough permission') {
    super(message, GQL_ERROR_CODES.PERMISSION_DENIED);
  }

}

export class GQLForbiddenError extends ApolloError {

  constructor(message = 'behavior not allowed') {
    super(message, GQL_ERROR_CODES.FORBIDDEN);
  }

}

export class GQLNotFoundError extends ApolloError {

  constructor(message = 'not found') {
    super(message, GQL_ERROR_CODES.NOT_FOUND);
  }

}

export class GQLDuplicationError extends ApolloError {

  constructor(props?: Record<string, any>, message = 'duplicated') {
    if (props) {

      props = {
        properties: Object.keys(props).map(key => {

          return {
            target: key,
            value: props![key]
          }
        })
      }

    }

    super(message, GQL_ERROR_CODES.DUPLICATED, props);
  }

}

export class GQLPasswordInvalidError extends ApolloError {

  constructor(message = 'invalid password') {
    super(message, GQL_ERROR_CODES.INVALID_PASSWORD);
  }

}

export class GQLInternalError extends ApolloError {

  constructor(message = 'internal server error') {
    super(message, GQL_ERROR_CODES.SERVER_ERROR);
  }

}
