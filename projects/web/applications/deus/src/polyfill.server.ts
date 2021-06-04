import { createWindow } from 'domino';


const win = createWindow() as Window & typeof globalThis;

globalThis.window = win;
globalThis.Element = win.Element;
globalThis.navigator = win.navigator;
globalThis.document = win.document;
