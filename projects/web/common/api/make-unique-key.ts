import { encode } from 'js-base64';

/**
 * For TransferModule to work with graphql
 */
export function makeUniqueKey(...chunks: any[]) {

  return encode(chunks.map(chunk => JSON.stringify(chunk)).join(''));
}
