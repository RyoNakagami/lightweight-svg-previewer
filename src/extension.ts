import * as vscode from 'vscode';
import * as path from 'path';
import {
  Background,
  buildContentSecurityPolicy,
  clampDebounceMs,
  coerceBackground,
  generateNonce,
  isSvgFileName,
} from './util';

const VIEW_TYPE = 'lightweightSvgPreviewer.preview';
const EDITOR_VIEW_TYPE = 'lightweightSvgPreviewer.editor';
const CONFIG_SECTION = 'lightweightSvgPreviewer';

interface Config {
  debounceMs: number;
  autoOpen: boolean;
  background: Background;
}

interface Preview {
  panel: vscode.WebviewPanel;
  doc: vscode.TextDocument;
  // True for the preview-only custom editor, false for a side panel.
  isEditor: boolean;
  // Document version last delivered to the webview; undefined until the webview is ready.
  sentVersion?: number;
}

// All live previews, keyed by document URI. One document can have several
// (split custom editors plus a side panel).
const previews = new Map<string, Set<Preview>>();
// Side panels only, so togglePreview / showPreview reuse a single one per document.
const sidePanels = new Map<string, vscode.WebviewPanel>();
// One debounce timer per document, shared by all of its previews.
const debounceTimers = new Map<string, NodeJS.Timeout>();

let config: Config;
let mediaRoot: vscode.Uri;

function readConfig(): Config {
  const c = vscode.workspace.getConfiguration(CONFIG_SECTION);
  return {
    debounceMs: clampDebounceMs(c.get<number>('debounceMs')),
    autoOpen: c.get<boolean>('autoOpen', false),
    background: coerceBackground(c.get<Background>('background')),
  };
}

function isSvgDocument(doc: vscode.TextDocument): boolean {
  if (doc.uri.scheme !== 'file' && doc.uri.scheme !== 'untitled') return false;
  return doc.languageId === 'svg' || isSvgFileName(doc.fileName);
}

function buildHtml(webview: vscode.Webview): string {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'preview.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'preview.css'));
  const n = generateNonce();
  const csp = buildContentSecurityPolicy(webview.cspSource, n);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="${styleUri}" />
<title>SVG Preview</title>
</head>
<body data-bg="${config.background}">
<div id="toolbar">
  <button data-action="zoom-out" title="Zoom out">−</button>
  <button data-action="zoom-reset" title="Reset zoom">100%</button>
  <button data-action="zoom-in" title="Zoom in">+</button>
  <button data-action="fit" title="Fit to window">fit</button>
  <span id="status"></span>
</div>
<div id="viewport"><div id="root"></div></div>
<script nonce="${n}" src="${scriptUri}"></script>
</body>
</html>`;
}

function send(preview: Preview, content: string): void {
  preview.sentVersion = preview.doc.version;
  preview.panel.webview.postMessage({ type: 'update', content });
}

// Pushes the current text to every visible, out-of-date preview of the document.
// Hidden webviews are discarded by VS Code and resync via 'ready' when shown again.
function flush(key: string): void {
  const set = previews.get(key);
  if (!set) return;
  let content: string | undefined;
  for (const p of set) {
    if (p.sentVersion === undefined || !p.panel.visible) continue;
    if (p.sentVersion === p.doc.version) continue;
    content ??= p.doc.getText();
    send(p, content);
  }
}

function attachPreview(panel: vscode.WebviewPanel, doc: vscode.TextDocument, isEditor: boolean): Preview {
  const key = doc.uri.toString();
  const preview: Preview = { panel, doc, isEditor };
  let set = previews.get(key);
  if (!set) previews.set(key, (set = new Set()));
  set.add(preview);

  const sub = panel.webview.onDidReceiveMessage((msg) => {
    if (!msg || msg.type !== 'ready') return;
    // The webview may be a reload of a discarded one, so resync settings too.
    panel.webview.postMessage({ type: 'config', background: config.background });
    send(preview, doc.getText());
  });

  panel.onDidDispose(() => {
    sub.dispose();
    set!.delete(preview);
    if (set!.size === 0) {
      previews.delete(key);
      const t = debounceTimers.get(key);
      if (t) clearTimeout(t);
      debounceTimers.delete(key);
    }
  });

  panel.webview.html = buildHtml(panel.webview);
  return preview;
}

function hasEditorPreview(key: string): boolean {
  const set = previews.get(key);
  if (!set) return false;
  for (const p of set) if (p.isEditor) return true;
  return false;
}

function openPreview(doc: vscode.TextDocument): void {
  const key = doc.uri.toString();
  const existing = sidePanels.get(key);
  if (existing) {
    existing.reveal(vscode.ViewColumn.Beside, true);
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    VIEW_TYPE,
    `SVG Preview — ${path.basename(doc.fileName)}`,
    { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
    { enableScripts: true, localResourceRoots: [mediaRoot] },
  );

  sidePanels.set(key, panel);
  panel.onDidDispose(() => sidePanels.delete(key));
  attachPreview(panel, doc, false);
}

class SvgPreviewEditorProvider implements vscode.CustomTextEditorProvider {
  resolveCustomTextEditor(doc: vscode.TextDocument, panel: vscode.WebviewPanel): void {
    panel.webview.options = { enableScripts: true, localResourceRoots: [mediaRoot] };
    attachPreview(panel, doc, true);
  }
}

function activeCustomEditorUri(): vscode.Uri | undefined {
  const input = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
  if (input instanceof vscode.TabInputCustom && input.viewType === EDITOR_VIEW_TYPE) {
    return input.uri;
  }
  return undefined;
}

export function activate(context: vscode.ExtensionContext): void {
  mediaRoot = vscode.Uri.joinPath(context.extensionUri, 'media');
  config = readConfig();

  context.subscriptions.push(
    vscode.commands.registerCommand('lightweightSvgPreviewer.togglePreview', () => {
      const doc = vscode.window.activeTextEditor?.document;
      if (!doc || !isSvgDocument(doc)) {
        vscode.window.showWarningMessage('Open an .svg file first to toggle SVG Preview.');
        return;
      }
      const existing = sidePanels.get(doc.uri.toString());
      if (existing) {
        existing.dispose();
      } else {
        openPreview(doc);
      }
    }),
    vscode.commands.registerCommand('lightweightSvgPreviewer.showPreview', async (uri?: vscode.Uri) => {
      let doc: vscode.TextDocument | undefined;
      if (uri instanceof vscode.Uri) {
        doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false });
      } else {
        doc = vscode.window.activeTextEditor?.document;
      }
      if (!doc || !isSvgDocument(doc)) {
        vscode.window.showWarningMessage('Open an .svg file first to use SVG Preview.');
        return;
      }
      openPreview(doc);
    }),
    vscode.commands.registerCommand('lightweightSvgPreviewer.showSource', async (uri?: vscode.Uri) => {
      const target = uri instanceof vscode.Uri ? uri : activeCustomEditorUri();
      if (!target) return;
      await vscode.commands.executeCommand('vscode.openWith', target, 'default', vscode.ViewColumn.Beside);
    }),
    vscode.window.registerCustomEditorProvider(EDITOR_VIEW_TYPE, new SvgPreviewEditorProvider()),
  );

  const maybeAutoOpen = (doc: vscode.TextDocument) => {
    if (!config.autoOpen) return;
    if (!isSvgDocument(doc)) return;
    // The custom editor already shows a live preview of this document.
    if (hasEditorPreview(doc.uri.toString())) return;
    openPreview(doc);
  };

  for (const editor of vscode.window.visibleTextEditors) {
    maybeAutoOpen(editor.document);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) maybeAutoOpen(editor.document);
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.contentChanges.length === 0) return;
      const key = e.document.uri.toString();
      if (!previews.has(key)) return;
      const t = debounceTimers.get(key);
      if (t) clearTimeout(t);
      debounceTimers.set(
        key,
        setTimeout(() => {
          debounceTimers.delete(key);
          flush(key);
        }, config.debounceMs),
      );
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      sidePanels.get(doc.uri.toString())?.dispose();
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration(CONFIG_SECTION)) return;
      const prev = config.background;
      config = readConfig();
      if (config.background === prev) return;
      for (const set of previews.values()) {
        for (const p of set) {
          p.panel.webview.postMessage({ type: 'config', background: config.background });
        }
      }
    }),
  );
}

export function deactivate(): void {
  for (const t of debounceTimers.values()) clearTimeout(t);
  debounceTimers.clear();
}
