import {
  DecorationOptions,
  DecorationRangeBehavior,
  Disposable,
  Range,
  TextDocumentChangeEvent,
  TextEditor,
  window,
  workspace,
} from 'vscode';
import * as ls from 'vscode-languageclient';
import { disposeAll, normalizeUri, textDocumentToTextEditor, trim } from './utils';

interface Parameter {
  readonly pos: ls.Position;
  readonly name: string;
  readonly isLiteral: boolean;
  readonly isNonConstLValueRef: boolean;
}
interface Call {
  readonly params: Parameter[];
}

interface InlineParameterHintsArgs {
  readonly uri: string;
  readonly calls: Call[];
}

export class InlineParameterHints implements Disposable {
  private disposables: Disposable[] = [];
  private paramsCache = new Map<string, DecorationOptions[]>();
  private readonly deco = window.createTextEditorDecorationType({
    after: {
      color: '#838383',
    },
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  });

  constructor(private client: ls.LanguageClient) {
    this.disposables.push(
      window.onDidChangeActiveTextEditor((editor?: TextEditor) => {
        if (editor) {
          this.setDecorations(editor);
        }
      })
    );

    this.disposables.push(
      workspace.onDidChangeTextDocument((changeEvent: TextDocumentChangeEvent) => {
        if (changeEvent.document.isDirty) {
          const editor = textDocumentToTextEditor(changeEvent.document);
          if (editor) {
            editor.setDecorations(this.deco, []);
          }
        }
      })
    );

    client.onNotification('$ccls/publishInlineParameterHints', (args) =>
      this.onNotification(args)
    );
  }
  dispose(): void {
    // if (window.activeTextEditor) {
    //   window.activeTextEditor.setDecorations(this.deco, []);
    // } else if (window.visibleTextEditors.length > 0) {
    //   window.visibleTextEditors[0].setDecorations(this.deco, []);
    // }
    this.deco.dispose();
    disposeAll(this.disposables);
  }

  onNotification({ uri, calls }: InlineParameterHintsArgs): void {
    uri = normalizeUri(uri);
    for (const visibleEditor of window.visibleTextEditors) {
      if (uri !== visibleEditor.document.uri.toString(true)) continue;
      const opts = new Array<DecorationOptions>();

      for (const call of calls) {
        for (const param of call.params) {
          if (!param.isNonConstLValueRef && param.name.length == 0) {
            continue;
          }
          const trimmedName = trim(param.name, '_');
          const codePos = this.client.protocol2CodeConverter.asPosition(param.pos);
          const ref = param.isNonConstLValueRef ? '&' : '';
          opts.push({
            range: new Range(codePos, codePos),
            renderOptions: {
              after: {
                contentText: ref + `${trimmedName}: `,
              },
            },
          });
        }
      }
      this.paramsCache.set(uri, opts);
      this.setDecorations(visibleEditor);
    }
  }

  setDecorations(editor: TextEditor): void {
    const uri = editor.document.uri.toString(true);
    const opts = this.paramsCache.get(uri);
    if (opts) {
      editor.setDecorations(this.deco, opts);
    }
  }
}
