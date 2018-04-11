'use strict';
import * as vscode from 'vscode';

let channel: vscode.OutputChannel;
let lastUpdate: Date | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('activated');
    channel = vscode.window.createOutputChannel('To-Do');
    context.subscriptions.push(channel);
    // TODO: Use this instead of interval, but currently it happens too often so I need to do some guarding.
    //vscode.workspace.onDidChangeTextDocument(async event => await update());
    await update();
    // Auto-update every ten seconds until we do `onDidChangeTextDocument`
    setInterval(update, 10 * 1000);
}

async function update() {
    // Update at most every five seconds (for when we do `onDidChangeTextDocument`).
    // if (lastUpdate !== undefined && (Date.now() - lastUpdate.getTime()) < 1000 * 60 * 5) {
    //     return;
    // }

    channel.clear();
    // https://github.com/Microsoft/vscode/issues/47645
    const files = await vscode.workspace.findFiles('**/*.md');
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
            console.log(line);
            channel.appendLine(line!);
        }
    }

    lastUpdate = new Date();
    channel.appendLine('Last updated ' + lastUpdate.toLocaleTimeString());
    console.log('updated');
}

export function deactivate() {
    console.log('deactivated');
}
