import * as vscode from 'vscode';
import * as path from 'path';
import {
  Background,
  buildContentSecurityPolicy,
  clampDebounceMs,
  coerceBackground,
  generateNonce,
  isSvgFileName,
  isSvgLanguageId,
} from './util';

const VIEW_TYPE = 'lightweightSvgPreviewer.preview';
const CONFIG_SECTION = 'lightweightSvgPreviewer';

interface PreviewEntry {
  panel: vscode.WebviewPanel;
  debounceTimer?: NodeJS.Timeout;
}

const panels = new Map<string, PreviewEntry>();

function isSvgDocument(doc: vscode.TextDocument): boolean {
  if (doc.uri.scheme !== 'file' && doc.uri.scheme !== 'untitled') {
    return false;
  }
  if (doc.languageId === 'svg') return true;
  if (isSvgLanguageId(doc.languageId) && isSvgFileName(doc.fileName)) return true;
  return isSvgFileName(doc.fileName);
}

function getConfig() {
  const c = vscode.workspace.getConfiguration(CONFIG_SECTION);
  return {
    debounceMs: clampDebounceMs(c.get<number>('debounceMs')),
    autoOpen: c.get<boolean>('autoOpen', false),
    background: coerceBackground(c.get<Background>('background')),
  };
}

function buildHtml(webview: vscode.Webview, mediaRoot: vscode.Uri, background: Background): string {
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
<body data-bg="${background}">
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

function postUpdate(panel: vscode.WebviewPanel, doc: vscode.TextDocument): void {
  panel.webview.postMessage({
    type: 'update',
    content: doc.getText(),
    fileName: path.basename(doc.fileName),
  });
}

function openPreview(context: vscode.ExtensionContext, doc: vscode.TextDocument): void {
  const key = doc.uri.toString();
  const existing = panels.get(key);
  if (existing) {
    existing.panel.reveal(vscode.ViewColumn.Beside, true);
    return;
  }

  const mediaRoot = vscode.Uri.joinPath(context.extensionUri, 'media');
  const cfg = getConfig();
  const panel = vscode.window.createWebviewPanel(
    VIEW_TYPE,
    `SVG Preview — ${path.basename(doc.fileName)}`,
    { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [mediaRoot],
    },
  );

  panel.webview.html = buildHtml(panel.webview, mediaRoot, cfg.background);

  const entry: PreviewEntry = { panel };
  panels.set(key, entry);

  panel.webview.onDidReceiveMessage(
    (msg) => {
      if (msg && msg.type === 'ready') {
        postUpdate(panel, doc);
      }
    },
    undefined,
    context.subscriptions,
  );

  panel.onDidDispose(
    () => {
      const e = panels.get(key);
      if (e?.debounceTimer) clearTimeout(e.debounceTimer);
      panels.delete(key);
    },
    undefined,
    context.subscriptions,
  );

  postUpdate(panel, doc);
}

function scheduleUpdate(doc: vscode.TextDocument): void {
  const key = doc.uri.toString();
  const entry = panels.get(key);
  if (!entry) return;
  const { debounceMs } = getConfig();
  if (entry.debounceTimer) clearTimeout(entry.debounceTimer);
  entry.debounceTimer = setTimeout(() => {
    entry.debounceTimer = undefined;
    postUpdate(entry.panel, doc);
  }, debounceMs);
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('lightweightSvgPreviewer.togglePreview', () => {
      const doc = vscode.window.activeTextEditor?.document;
      if (!doc || !isSvgDocument(doc)) {
        vscode.window.showWarningMessage('Open an .svg file first to toggle SVG Preview.');
        return;
      }
      const existing = panels.get(doc.uri.toString());
      if (existing) {
        existing.panel.dispose();
      } else {
        openPreview(context, doc);
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
      openPreview(context, doc);
    }),
  );

  const maybeAutoOpen = (doc: vscode.TextDocument) => {
    if (!getConfig().autoOpen) return;
    if (!isSvgDocument(doc)) return;
    openPreview(context, doc);
  };

  for (const editor of vscode.window.visibleTextEditors) {
    maybeAutoOpen(editor.document);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => maybeAutoOpen(doc)),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) maybeAutoOpen(editor.document);
    }),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (!isSvgDocument(e.document)) return;
      scheduleUpdate(e.document);
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      const key = doc.uri.toString();
      const entry = panels.get(key);
      if (entry) {
        entry.panel.dispose();
      }
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`${CONFIG_SECTION}.background`)) {
        for (const [, entry] of panels) {
          entry.panel.webview.postMessage({ type: 'config', background: getConfig().background });
        }
      }
    }),
  );
}

export function deactivate(): void {
  for (const [, entry] of panels) {
    if (entry.debounceTimer) clearTimeout(entry.debounceTimer);
    entry.panel.dispose();
  }
  panels.clear();
}
