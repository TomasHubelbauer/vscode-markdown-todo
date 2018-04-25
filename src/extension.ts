'use strict';
import MarkDownDOM from 'markdown-dom';
import { ExtensionContext, window, workspace, Uri, TreeDataProvider, TreeItem, Event, TextDocument, EventEmitter, TreeItemCollapsibleState, ThemeIcon, commands, Selection, Range } from 'vscode';
import * as path from 'path';

type File = { type: 'file'; path: string; headlessTodos: Todo[]; heads: Head[]; };
type Head = { type: 'head'; text: string; line: number; file: File; todos: Todo[]; };
type Todo = { type: 'todo'; text: string; isChecked: boolean; line: number; file: File; indent: string; };
type Item = File | Head | Todo;

export async function activate(context: ExtensionContext): Promise<void> {
    context.subscriptions.push(commands.registerCommand('markdown-todo.openFile', (file: File) => {
        window.showTextDocument(Uri.file(file.path), { preview: true });
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.focusHead', async (head: Head) => {
        const textEditor = await window.showTextDocument(Uri.file(head.file.path), { preview: true });
        const range = textEditor.document.lineAt(head.line).range;
        textEditor.selection = new Selection(range.end, range.start);
        textEditor.revealRange(range);
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.focusTodo', async (todo: Todo) => {
        const textEditor = await window.showTextDocument(Uri.file(todo.file.path), { preview: true });
        const range = textEditor.document.lineAt(todo.line).range;
        textEditor.selection = new Selection(range.end, range.start);
        textEditor.revealRange(range);
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.refreshFile', async (file: File) => {
        //const textDocument = await workspace.openTextDocument(Uri.file(file.path));
        // TODO: Fix the bug where some files do not update removed todos todoTreeDataProvider.refresh(textDocument);
        await todoTreeDataProvider.refreshAll();
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.removeTodo', async (todo: Todo) => {
        const textEditor = await window.showTextDocument(Uri.file(todo.file.path), { preview: true });
        const range = textEditor.document.lineAt(todo.line).rangeIncludingLineBreak;
        textEditor.revealRange(range);
        await textEditor.edit(editBuilder => {
            editBuilder.replace(range, '');
        });
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.toggleTodo', async (todo: Todo) => {
        const textEditor = await window.showTextDocument(Uri.file(todo.file.path), { preview: true });
        const range = textEditor.document.lineAt(todo.line).range;
        textEditor.revealRange(range);
        await textEditor.edit(editBuilder => {
            const document = textEditor.document;
            // TODO: Verify this won't break with -[ which we I guess support (use indexOf otherwise or improve MarkDownDOM to give this)
            const checkStart = document.positionAt(document.offsetAt(range.start) + todo.indent.length + '- ['.length);
            const checkEnd = document.positionAt(document.offsetAt(range.start) + todo.indent.length + '- [?'.length);
            const checkRange = new Range(checkStart, checkEnd);
            editBuilder.replace(checkRange, todo.isChecked ? ' ' : 'x');
        });

        // Update view without saving the file
        todo.isChecked = !todo.isChecked;
        // TODO: Fix the bug where some files do not update removed todos todoTreeDataProvider.refresh(textEditor.document);
        await todoTreeDataProvider.refreshAll();
    }));

    const todoTreeDataProvider = new TodoTreeDataProvider();
    context.subscriptions.push(todoTreeDataProvider);
    context.subscriptions.push(window.createTreeView('to-do', { treeDataProvider: todoTreeDataProvider }));

    workspace.onDidSaveTextDocument(async textDocument => {
        // Ignore irrelevant documents that will not affect the to-do items
        if (textDocument.uri.scheme !== 'file' || textDocument.languageId !== 'markdown') {
            return;
        }

        // TODO: Fix the bug where some files do not update removed todos todoTreeDataProvider.refresh(textDocument);
        await todoTreeDataProvider.refreshAll();
    });

    await todoTreeDataProvider.refreshAll();
}

class TodoTreeDataProvider implements TreeDataProvider<Item> {
    private cache: File[] = [];
    private _onDidChangeTreeData: EventEmitter<Item | undefined> = new EventEmitter<Item | undefined>();
    readonly onDidChangeTreeData?: Event<Item | null | undefined> | undefined = this._onDidChangeTreeData.event;

    getTreeItem(element: Item) {
        switch (element.type) {
            case 'file': {
                const count = element.headlessTodos.length + element.heads.reduce((count, head) => count + head.todos.length, 0);
                const item = new TreeItem(`${path.parse(element.path).name} (${count})`, TreeItemCollapsibleState.Expanded);
                item.command = { title: 'Open file', command: 'markdown-todo.openFile', arguments: [element] };
                item.contextValue = 'file';
                item.iconPath = ThemeIcon.Folder;
                item.id = element.path;
                item.tooltip = element.path;
                return item;
            }
            case 'head': {
                const item = new TreeItem(`${element.text} (${element.todos.length})`, TreeItemCollapsibleState.Expanded);
                item.command = { title: 'Focus header', command: 'markdown-todo.focusHead', arguments: [element] };
                item.contextValue = 'head';
                item.iconPath = ThemeIcon.Folder;
                item.id = element.file.path + ':' + element.line;
                item.tooltip = element.text;
                return item;
            }
            case 'todo': {
                const item = new TreeItem(element.isChecked ? 'DONE: ' + element.text : element.text);
                item.command = { title: 'Focus todo', command: 'markdown-todo.focusTodo', arguments: [element] };
                item.contextValue = 'todo';
                item.iconPath = ThemeIcon.File;
                item.id = element.file.path + ':' + element.line;
                item.tooltip = element.text;
                return item;
            }
            default: {
                // TODO: Telemetry.
                throw new Error(`Unexpected type ${(element as Item /* never */).type}`);
            }
        }
    }

    getChildren(element?: Item | undefined) {
        if (element === undefined) {
            return this.cache.map(file => file);
        }

        if (element.type === 'file') {
            return [...element.headlessTodos, ...element.heads];
        }

        if (element.type === 'head') {
            return element.todos;
        }

        // Todos do not have children.
    }

    async refreshAll() {
        this.cache = [];
        const files = await workspace.findFiles('**/*.md', undefined); // https://github.com/Microsoft/vscode/issues/47645
        for (const file of files) {
            // TODO: Figure out https://github.com/Microsoft/vscode/issues/48674
            if (file.fsPath.includes('node_modules')) {
                continue;
            }

            const textDocument = await workspace.openTextDocument(file);
            this.refresh(textDocument);
        }
    }

    refresh(textDocument: TextDocument) {
        const headlessTodos: { text: string; isChecked: boolean; line: number; indent: string; }[] = [];
        const heads: { text: string; line: number; todos: { text: string; isChecked: boolean; line: number; indent: string; }[] }[] = [];
        for (let index = 0; index < textDocument.lineCount; index++) {
            const line = textDocument.lineAt(index);
            const dom = MarkDownDOM.parse(line.text.trim());
            if (dom.blocks && dom.blocks.length === 1) {
                const block = dom.blocks[0];
                switch (block.type) {
                    case 'header': {
                        let text = '';
                        for (const span of block.spans) {
                            switch (span.type) {
                                case 'run': text += span.text; break;
                                case 'link': text += span.text; break;
                            }
                        }

                        // TODO: Fix this in MarkDownDOM
                        const trash = /^#+/.exec(text);
                        if (trash !== null) {
                            text = text.substring(trash.length);
                        }

                        heads.push({ text, line: line.lineNumber, todos: [] });
                        break;
                    }
                    case 'unordered-list': {
                        if (block.items.length === 1) {
                            const item = block.items[0];
                            if (item.type === 'checkbox') {
                                // TODO: Figure out why item.indent is always zero
                                const indent = (/^\s+/.exec(line.text) || [''])[0];
                                const todo = { text: item.text.trim(), isChecked: item.check !== null, line: line.lineNumber, indent };
                                if (heads.length === 0) {
                                    headlessTodos.push(todo);
                                } else {
                                    heads[heads.length - 1].todos.push(todo);
                                }
                            }
                        } else {
                            // TODO: Telemetry.
                            throw new Error(`Unexpected item count ${block.items.length}.`);
                        }
                        break;
                    }
                }
            }
        }

        if (headlessTodos.length > 0 || heads.reduce((count, head) => count + head.todos.length, 0) > 0) {
            const path = textDocument.uri.fsPath;
            let file = this.cache.find(item => item.type === 'file' && item.path === path);
            if (file === undefined) {
                file = { type: 'file', path, headlessTodos: [], heads: [] };
                this.cache.push(file);
            }

            file.headlessTodos = headlessTodos.map(todo => ({ ...todo, file: file!, type: 'todo' as 'todo' }));
            file.heads = heads.filter(head => head.todos.length > 0).map(head => ({
                type: 'head' as 'head',
                ...head,
                file: file!,
                todos: head.todos.map(todo => ({ ...todo, file: file!, type: 'todo' as 'todo' }))
            }));
        }

        this._onDidChangeTreeData.fire();
    }

    dispose() {
        delete this.cache;
        this._onDidChangeTreeData.dispose();
    }
}
