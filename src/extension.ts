'use strict';
import * as vscode from 'vscode';

let channel: vscode.OutputChannel;
let isUpdating = false;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    channel = vscode.window.createOutputChannel('To-Do');
    context.subscriptions.push(channel);
    vscode.workspace.onDidSaveTextDocument(async textDocument => {
        // Ignore irrelevant documents that will not affect the to-do items
        if (textDocument.uri.scheme !== 'file' || textDocument.languageId !== 'markdown') {
            return;
        }

        console.log('Saved', textDocument.fileName);
        await update();
    });
    await update();
}

async function update() {
    if (isUpdating) {
        console.log('Ignoring.');
        return;
    }

    isUpdating = true;
    console.log('Updating…');

    // https://github.com/Microsoft/vscode/issues/47645
    const files = await vscode.workspace.findFiles('**/*.md');
    channel.clear();
    for (const file of files) {
        const textDocument = await vscode.workspace.openTextDocument(file);

        const lines = textDocument.getText().split(/\r|\n/).map((line, index) => {
            line = line.trim();
            if (line.length === 0) {
                return undefined;
            } else if (line.startsWith('- [ ]') || line.startsWith('- [x]') || line.startsWith('- [X]')) {
                return textDocument.fileName + ':' + (index + 1) + ' ' + line.substring('- [ ]'.length).trim();
            } else if (line.startsWith('-[ ]') || line.startsWith('-[x]') || line.startsWith('-[X]')) {
                return textDocument.fileName + ':' + (index + 1) + ' ' + line.substring('-[ ]'.length).trim();
            } else if (line.startsWith('[ ]') || line.startsWith('[x]') || line.startsWith('[X]')) {
                return textDocument.fileName + ':' + (index + 1) + ' ' + line.substring('[ ]'.length).trim();
            }

            return undefined;
        }).filter(line => line !== undefined);

        for (const line of lines) {
            channel.appendLine(line!);
        }
    }

    console.log('Updated');
    isUpdating = false;
}
