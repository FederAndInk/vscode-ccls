import * as path from 'path';
import * as util from 'util';
import { commands, Disposable, TextDocument, TextEditor, Uri, window } from 'vscode';

export function resourcePath(...paths: string[]): string {
  return path.join(__dirname, '..', 'resources', ...paths);
}

export function unwrap<T>(value: T | undefined, tip = '?'): T {
  if (value === undefined) throw new Error('undefined ' + tip);
  return value;
}

export function disposeAll(items: Disposable[]): any[] {
  return items.reverse().map((d) => d.dispose());
}

export function normalizeUri(u: string): string {
  return Uri.parse(u).toString(true);
}

export function setContext(name: string, value: any): void {
  commands.executeCommand('setContext', name, value);
}

export function dedent(templateStrings: TemplateStringsArray, ...args: any[]) {
  const strings = templateStrings.map((value) => value.replace(/\r?\n[ ]*$/, '\n'));
  let result = strings[0];
  for (let i = 0; i < args.length; i++) {
    result += args[i] + strings[i + 1];
  }
  return result;
}

const setTimeoutPromised = util.promisify(setTimeout);

export async function wait(millisecs: number) {
  return setTimeoutPromised(millisecs);
}

/**
 * trim a string with a specified sequence
 *
 * @param str string to trim
 * @param toRemove what to trim
 */
export function trim(str: string, toRemove: string): string {
  if (toRemove.length == 0) {
    return str;
  }
  let newBeg = 0;
  let newEnd = str.length;
  while (str.startsWith(toRemove, newBeg)) {
    newBeg += toRemove.length;
  }
  while (str.endsWith(toRemove, newEnd)) {
    newEnd -= toRemove.length;
  }

  return str.substring(newBeg, newEnd);
}

export function textDocumentToTextEditor(textDoc: TextDocument): TextEditor | undefined {
  for (const textEditor of window.visibleTextEditors) {
    if (textEditor.document == textDoc) {
      return textEditor;
    }
  }
  return undefined;
}
