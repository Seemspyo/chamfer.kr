import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { Logger } from './@logger';


export class LocalLogger implements Logger {

  private dir: string;
  private base: string;

  constructor(public name: string, url: string) {
    const { dir, base } = path.parse(url);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.dir = dir;
    this.base = base;
  }

  public log(message: string) {
    const
    { name, dir, base } = this,
    dateString = new Date().toLocaleString('ko-KR');

    const data = Buffer.from(`${ dateString }(${ name }: ${ process.pid }) : ${ message }\n`);

    writeFileSync(path.resolve(dir, base), data, { flag: 'a' });
  }

}
