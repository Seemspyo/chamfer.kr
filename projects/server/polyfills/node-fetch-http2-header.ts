/**
 * To suppress http2 Header errors
 */
import { Headers } from 'node-fetch';


/**
 * Find the key in the map object given a header name.
 *
 * Returns undefined if not found.
 *
 * @param   { String }  name  Header name
 * @return  { String | Undefined }
 */
function find(map: any, name: string) {
  name = name.toLowerCase();

  for (const key in map) {
    if (key.toLowerCase() === name) {
      return key;
    }
  }

  return undefined;
}

let MAP: symbol|undefined = void 0;

Object.defineProperty(Headers.prototype, 'append', {
  value(name: string, value: string) {
    if (MAP === undefined) {
      MAP = Object.getOwnPropertySymbols(this).find(s => s.toString().includes('(map)'));
      if (MAP === undefined) return;
    }

    const map = this[MAP];

    const key = find(map, name);
    if (key !== undefined) {
      map[key].push(value);
    } else {
      map[name] = [ value ]
    }
  }
});
