export abstract class Logger {

  abstract name: string;

  abstract log(message: string): void|Promise<void>;

}
