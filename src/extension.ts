'use strict';
import MarkDownDOM, { MarkDownUnorderedListBlock } from 'markdown-dom';
import { ExtensionContext, window, workspace, Uri, TreeDataProvider, TreeItem, Event, TextDocument, EventEmitter, TreeItemCollapsibleState, ThemeIcon, commands, Command, Range, Selection } from 'vscode';
import * as path from 'path';

type File = { type: 'file'; path: string; todos: Todo[]; };
type Todo = { type: 'todo'; text: string; isChecked: boolean; line: number; file: File; };
type Item = File | Todo;

export async function activate(context: ExtensionContext): Promise<void> {
    context.subscriptions.push(commands.registerCommand('markdown-todo.openFile', (file: File) => {
        window.showTextDocument(Uri.file(file.path), { preview: true });
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.focusTodo', async (todo: Todo) => {
        const textEditor = await window.showTextDocument(Uri.file(todo.file.path), { preview: true });
        const range = textEditor.document.lineAt(todo.line).range;
        textEditor.selection = new Selection(range.end, range.start);
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.refreshFile', async (file: File) => {
        const textDocument = await workspace.openTextDocument(Uri.file(file.path));
        todoTreeDataProvider.refresh(textDocument);
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.removeTodo', async (todo: Todo) => {
        const textEditor = await window.showTextDocument(Uri.file(todo.file.path), { preview: true });
        const range = textEditor.document.lineAt(todo.line).rangeIncludingLineBreak;
        await textEditor.edit(editBuilder => {
            editBuilder.replace(range, '');
        });
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.toggleTodo', async (todo: Todo) => {
        const textEditor = await window.showTextDocument(Uri.file(todo.file.path), { preview: true });
        const range = textEditor.document.lineAt(todo.line).range;
        await textEditor.edit(editBuilder => {
            editBuilder.replace(range, `- [${todo.isChecked ? ' ' : 'x'}] ${todo.text}`);
        });

        // Update view without saving the file
        todo.isChecked = !todo.isChecked;
        todoTreeDataProvider.refresh(textEditor.document);
    }));

    const todoTreeDataProvider = new TodoTreeDataProvider();
    context.subscriptions.push(todoTreeDataProvider);
    context.subscriptions.push(window.createTreeView('to-do', { treeDataProvider: todoTreeDataProvider }));

    workspace.onDidSaveTextDocument(async textDocument => {
        // Ignore irrelevant documents that will not affect the to-do items
        if (textDocument.uri.scheme !== 'file' || textDocument.languageId !== 'markdown') {
            return;
        }

        todoTreeDataProvider.refresh(textDocument);
    });

    await todoTreeDataProvider.refreshAll();
}

class TodoTreeDataProvider implements TreeDataProvider<Item> {
    private cache: File[] = [];
    private _onDidChangeTreeData: EventEmitter<Item | undefined> = new EventEmitter<Item | undefined>();
    readonly onDidChangeTreeData?: Event<Item | null | undefined> | undefined = this._onDidChangeTreeData.event;
    getTreeItem(element: Item): TreeItem | Thenable<TreeItem> {
        switch (element.type) {
            case 'file': {
                const item = new TreeItem(path.parse(element.path).name, TreeItemCollapsibleState.Expanded);
                item.command = { title: 'Open file', command: 'markdown-todo.openFile', arguments: [element] };
                item.contextValue = 'file';
                item.iconPath = ThemeIcon.Folder;
                item.id = element.path;
                item.tooltip = element.path;
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

    getChildren(element?: Item | undefined): Item[] | Thenable<Item[] | null | undefined> | null | undefined {
        if (element === undefined) {
            return this.cache.map(file => file);
        }

        if (element.type === 'file') {
            return element.todos;
        }

        // Todos do not have children.
    }

    async refreshAll() {
        const files = await workspace.findFiles('**/*.md'); // https://github.com/Microsoft/vscode/issues/47645
        for (const file of files) {
            const textDocument = await workspace.openTextDocument(file);
            this.refresh(textDocument);
        }
    }

    refresh(textDocument: TextDocument) {
        const path = textDocument.uri.fsPath;
        let file = this.cache.find(item => item.type === 'file' && item.path === path);
        if (file === undefined) {
            file = { type: 'file', path, todos: [] };
            this.cache.push(file);
        } else {
            file.todos = [];
        }

        for (let index = 0; index < textDocument.lineCount; index++) {
            const line = textDocument.lineAt(index);
            const dom = MarkDownDOM.parse(line.text);
            if (dom.blocks && dom.blocks.length === 1 && dom.blocks[0].type === 'unordered-list') {
                const block = dom.blocks[0] as MarkDownUnorderedListBlock;

                if (block.items.length === 1) {
                    const item = block.items[0];
                    if (item.type === 'checkbox') {
                        file.todos.push({ type: 'todo', text: item.text.trim(), isChecked: item.check !== null, file, line: line.lineNumber });
                    }
                } else {
                    // TODO: Telemetry.
                    throw new Error(`Unexpected item count ${block.items.length}.`);
                }
            }
        }

        this._onDidChangeTreeData.fire();
    }

    dispose() {
        delete this.cache;
        this._onDidChangeTreeData.dispose();
    }
}
