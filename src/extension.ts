'use strict';
import MarkDownDOM, { MarkDownUnorderedListBlock } from 'markdown-dom';
import { OutputChannel, ExtensionContext, window, workspace, Uri } from 'vscode';

let channel: OutputChannel;
let isUpdating = false;

export async function activate(context: ExtensionContext): Promise<void> {
    channel = window.createOutputChannel('To-Do');
    context.subscriptions.push(channel);
    workspace.onDidSaveTextDocument(async textDocument => {
        // Ignore irrelevant documents that will not affect the to-do items
        if (textDocument.uri.scheme !== 'file' || textDocument.languageId !== 'markdown') {
            return;
        }

        await update();
    });
    await update();
}

async function update() {
    if (isUpdating) {
        return;
    }

    isUpdating = true;

    // https://github.com/Microsoft/vscode/issues/47645
    const files = await workspace.findFiles('**/*.md');
    channel.clear();
    for (const file of files) {
        const filePath = file.fsPath.substring(workspace.getWorkspaceFolder(Uri.file(file.fsPath))!.uri.fsPath.length + 1);
        const textDocument = await workspace.openTextDocument(file);

        for (let index = 0; index < textDocument.lineCount; index++) {
            const line = textDocument.lineAt(index);
            const dom = MarkDownDOM.parse(line.text);
            if (dom.blocks && dom.blocks.length === 1 && dom.blocks[0].type === 'unordered-list') {
                const block = dom.blocks[0] as MarkDownUnorderedListBlock;

                if (block.items.length === 1) {
                    const item = block.items[0];
                    if (item.type === 'checkbox') {
                        channel.appendLine(`${filePath}:${line.lineNumber + 1} ${item.check !== null ? 'DONE: ' : ''}${item.text.trim()}`);
                    }
                } else {
                    // TODO: Telemetry.
                    console.log(`Unexpected item count ${block.items.length}.`);
                }
            }
        }
    }

    isUpdating = false;
}
