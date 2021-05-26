export function ifAllExists<T>(params: any[], data: T) {

  return params.every(param => Boolean(param)) ? data : null;
}
