'use strict';
import MarkDownDOM from 'markdown-dom';
import { ExtensionContext, window, workspace, Uri, TreeDataProvider, TreeItem, TextDocument, EventEmitter, TreeItemCollapsibleState, ThemeIcon, commands, Selection, Range, RelativePattern, FileSystemWatcher, languages, CodeLensProvider, Event, CancellationToken, CodeLens, TextEditorLineNumbersStyle, TextEditorRevealType } from 'vscode';
import * as path from 'path';
import * as child_process from 'child_process';
import * as ta from 'time-ago';

const FileType: 'file' = 'file';
type File = { type: typeof FileType; path: string; headlessTodos: Todo[]; heads: Head[]; };
const HeadType: 'head' = 'head';
type Head = { type: typeof HeadType; text: string; line: number; file: File; todos: Todo[]; };
const TodoType: 'todo' = 'todo';
type Todo = { type: typeof TodoType; text: string; isChecked: boolean; line: number; file: File; indent: string; };
type Item = File | Head | Todo;

export async function activate(context: ExtensionContext): Promise<void> {
    const todoTreeDataProvider = new TodoTreeDataProvider();
    const todoCodeLensProvider = new TodoCodeLensProvider();

    context.subscriptions.push(commands.registerCommand('markdown-todo.refresh', () => {
        todoTreeDataProvider.reindex();
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.toggleTicked', () => {
        todoTreeDataProvider.displayTicked = !todoTreeDataProvider.displayTicked;
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.toggleOrder', () => {
        todoTreeDataProvider.sortByCount = !todoTreeDataProvider.sortByCount;
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.focus', async (todo: Todo) => {
        const textEditor = await window.showTextDocument(Uri.file(todo.file.path), { preview: true });
        const range = textEditor.document.lineAt(todo.line).range;
        textEditor.selection = new Selection(range.end, range.start);
        textEditor.revealRange(range, TextEditorRevealType.InCenter);
    }));

    context.subscriptions.push(commands.registerCommand('markdown-todo.remove', remove));
    context.subscriptions.push(commands.registerCommand('markdown-todo.tick', tick));
    context.subscriptions.push(commands.registerCommand('markdown-todo.untick', untick));
    context.subscriptions.push(commands.registerCommand('markdown-todo.detick', detick));

    context.subscriptions.push(todoTreeDataProvider);
    context.subscriptions.push(window.createTreeView('to-do-explorer', { treeDataProvider: todoTreeDataProvider }));
    context.subscriptions.push(window.createTreeView('to-do-view-container', { treeDataProvider: todoTreeDataProvider }));
    context.subscriptions.push(languages.registerCodeLensProvider({ language: 'markdown' }, todoCodeLensProvider));

    workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('markdown-todo.sortByCount')) {
            todoTreeDataProvider.reraise();
        }
    });
}

async function remove(todo: Todo): Promise<void>;
async function remove(path: string, line: number): Promise<void>;
async function remove(todoOrPath: Todo | string, ln?: number): Promise<void> {
    let path: string;
    let line: number;
    if (typeof todoOrPath === 'string') {
        path = todoOrPath;
        line = ln!;
    } else {
        path = todoOrPath.file.path;
        line = todoOrPath.line;
    }

    const textEditor = await window.showTextDocument(Uri.file(path), { preview: true });
    const range = textEditor.document.lineAt(line).rangeIncludingLineBreak;
    textEditor.revealRange(range);
    await textEditor.edit(editBuilder => {
        editBuilder.replace(range, '');
    });

    await textEditor.document.save();
}

async function tick(todo: Todo): Promise<void>;
async function tick(path: string, line: number, indent: string): Promise<void>;
async function tick(todoOrPath: Todo | string, ln?: number, ind?: string): Promise<void> {
    let path: string;
    let line: number;
    let indent: string;
    if (typeof todoOrPath === 'string') {
        path = todoOrPath;
        line = ln!;
        indent = ind!;
    } else {
        path = todoOrPath.file.path;
        line = todoOrPath.line;
        indent = todoOrPath.indent;
    }

    const textEditor = await window.showTextDocument(Uri.file(path), { preview: true });
    const range = textEditor.document.lineAt(line).range;
    textEditor.revealRange(range);
    await textEditor.edit(editBuilder => {
        const document = textEditor.document;
        // TODO: Verify this won't break with -[ which we I guess support (use indexOf otherwise or improve MarkDownDOM to give this)
        const checkStart = document.positionAt(document.offsetAt(range.start) + indent.length + '- ['.length);
        const checkEnd = document.positionAt(document.offsetAt(range.start) + indent.length + '- [?'.length);
        const checkRange = new Range(checkStart, checkEnd);
        editBuilder.replace(checkRange, 'x');
    });

    await textEditor.document.save();
}

async function untick(todo: Todo): Promise<void>;
async function untick(path: string, line: number, indent: string): Promise<void>;
async function untick(todoOrPath: Todo | string, ln?: number, ind?: string): Promise<void> {
    let path: string;
    let line: number;
    let indent: string;
    if (typeof todoOrPath === 'string') {
        path = todoOrPath;
        line = ln!;
        indent = ind!;
    } else {
        path = todoOrPath.file.path;
        line = todoOrPath.line;
        indent = todoOrPath.indent;
    }

    const textEditor = await window.showTextDocument(Uri.file(path), { preview: true });
    const range = textEditor.document.lineAt(line).range;
    textEditor.revealRange(range);
    await textEditor.edit(editBuilder => {
        const document = textEditor.document;
        // TODO: Verify this won't break with -[ which we I guess support (use indexOf otherwise or improve MarkDownDOM to give this)
        const checkStart = document.positionAt(document.offsetAt(range.start) + indent.length + '- ['.length);
        const checkEnd = document.positionAt(document.offsetAt(range.start) + indent.length + '- [?'.length);
        const checkRange = new Range(checkStart, checkEnd);
        editBuilder.replace(checkRange, ' ');
    });

    await textEditor.document.save();
}

async function detick(todo: Todo): Promise<void>;
async function detick(path: string, line: number, indent: string): Promise<void>;
async function detick(todoOrPath: Todo | string, ln?: number, ind?: string): Promise<void> {
    let path: string;
    let line: number;
    let indent: string;
    if (typeof todoOrPath === 'string') {
        path = todoOrPath;
        line = ln!;
        indent = ind!;
    } else {
        path = todoOrPath.file.path;
        line = todoOrPath.line;
        indent = todoOrPath.indent;
    }

    const textEditor = await window.showTextDocument(Uri.file(path), { preview: true });
    const range = textEditor.document.lineAt(line).range;
    textEditor.revealRange(range);
    await textEditor.edit(editBuilder => {
        const document = textEditor.document;
        // TODO: Verify this won't break with -[ which we I guess support (use indexOf otherwise or improve MarkDownDOM to give this)
        const checkStart = document.positionAt(document.offsetAt(range.start) + indent.length + '- '.length);
        const checkEnd = document.positionAt(document.offsetAt(range.start) + indent.length + '- [?] '.length);
        const checkRange = new Range(checkStart, checkEnd);
        editBuilder.delete(checkRange);
    });

    await textEditor.document.save();
}

class TodoTreeDataProvider implements TreeDataProvider<Item> {
    // Type as an array of `File`s as only files are kept at the top level
    private cache: File[] = [];
    private _onDidChangeTreeData: EventEmitter<Item | undefined> = new EventEmitter<Item | undefined>();
    private _displayTicked = true;
    public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private readonly watcher: FileSystemWatcher;

    constructor() {
        this.watcher = workspace.createFileSystemWatcher('**/*.md');

        this.watcher.onDidChange(async uri => {
            this.refresh(await workspace.openTextDocument(uri));
        });

        this.watcher.onDidCreate(async uri => {
            this.refresh(await workspace.openTextDocument(uri));
        });

        this.watcher.onDidDelete(uri => {
            const index = this.cache.findIndex(file => file.path === uri.fsPath);
            this.cache.splice(index, 1);
            this._onDidChangeTreeData.fire();
        });

        this.index();
    }

    public getTreeItem(element: Item) {
        switch (element.type) {
            case 'file': {
                const headlessCounts = this.count(element.headlessTodos);
                const headfulCounts = element.heads.reduce((counts, head) => {
                    const { checked, unchecked } = this.count(head.todos);
                    return { checked: counts.checked + checked, unchecked: counts.unchecked + unchecked };
                }, { checked: 0, unchecked: 0 });
                const checked = headlessCounts.checked + headfulCounts.checked;
                const unchecked = headlessCounts.unchecked + headfulCounts.unchecked;
                const total = checked + unchecked;
                const done = checked === 0 ? '' : `${checked} done, `;
                const item = new TreeItem(`${path.parse(element.path).name} (${done}${unchecked} to do, ${total} total)`, TreeItemCollapsibleState.Expanded);
                item.contextValue = 'file';
                item.iconPath = ThemeIcon.Folder;
                item.id = element.path;
                item.tooltip = element.path;
                return item;
            }
            case 'head': {
                const { checked, unchecked } = this.count(element.todos);
                const total = checked + unchecked;
                const done = checked === 0 ? '' : `${checked} done, `;
                const item = new TreeItem(`${element.text} (${done}${unchecked} to do, ${total} total)`, TreeItemCollapsibleState.Expanded);
                item.contextValue = 'head';
                item.iconPath = ThemeIcon.Folder;
                item.id = element.file.path + ':' + element.line;
                item.tooltip = element.text;
                return item;
            }
            case 'todo': {
                const item = new TreeItem(element.isChecked ? '✓ ' + element.text : element.text);
                item.command = { title: 'Focus todo', command: 'markdown-todo.focus', arguments: [element] };
                item.contextValue = 'todo-' + (element.isChecked ? 'ticked' : 'unticked');
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

    public getChildren(element?: Item | undefined) {
        if (element === undefined) {
            if (this.sortByCount) {
                return this.cache.slice().sort((a, b) => {
                    const aCount = this.count(a.headlessTodos).unchecked + a.heads.reduce((count, head) => count + this.count(head.todos).unchecked, 0);
                    const bCount = this.count(b.headlessTodos).unchecked + b.heads.reduce((count, head) => count + this.count(head.todos).unchecked, 0);
                    return bCount - aCount;
                });
            }

            return this.cache as Item[];
        }

        if (element.type === 'file') {
            if (this.sortByCount) {
                return [...element.headlessTodos, ...element.heads.slice().sort((a, b) => this.count(b.todos).unchecked - this.count(a.todos).unchecked)];
            }

            return [...element.headlessTodos, ...element.heads];
        }

        if (element.type === 'head') {
            return this._displayTicked ? element.todos : element.todos.filter(todo => !todo.isChecked);
        }

        // Todos do not have children.
    }

    public get displayTicked() {
        return this._displayTicked;
    }

    public set displayTicked(value: boolean) {
        this._displayTicked = value;
        this._onDidChangeTreeData.fire();
    }

    public get sortByCount() {
        const { sortByCount } = workspace.getConfiguration('markdown-todo');
        return !!sortByCount;
    }

    public set sortByCount(value: boolean) {
        workspace.getConfiguration('markdown-todo').update('sortByCount', value);
    }

    public reindex() {
        this.cache = [];
        this.index();
    }

    public reraise() {
        this._onDidChangeTreeData.fire();
    }

    private async index() {
        // TODO: https://github.com/Microsoft/vscode/issues/48674
        const excludes = await workspace.getConfiguration('search', null).get('exclude')!;
        const globs = Object.keys(excludes).map(exclude => new RelativePattern(workspace.workspaceFolders![0], exclude));
        const occurences: { [fsPath: string]: number; } = {};
        for (const glob of globs) {
            // TODO: https://github.com/Microsoft/vscode/issues/47645
            for (const file of await workspace.findFiles('**/*.md', glob)) {
                occurences[file.fsPath] = (occurences[file.fsPath] || 0) + 1;
            }
        }

        // Accept only files not excluded in any of the globs
        const files = Object.keys(occurences).filter(fsPath => occurences[fsPath] === globs.length);
        for (const file of files) {
            const textDocument = await workspace.openTextDocument(Uri.file(file));
            this.refresh(textDocument);
        }

        this._onDidChangeTreeData.fire();
    }

    private refresh(textDocument: TextDocument) {
        const path = textDocument.uri.fsPath;
        const index = this.cache.findIndex(file => file.path === path);
        let file = this.cache[index] as File | undefined;
        if (file !== undefined) {
            file.headlessTodos = [];
            file.heads = [];
        } else {
            file = { type: FileType, path, headlessTodos: [], heads: [] };
        }

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

                        const head: Head = { type: HeadType, text, line: line.lineNumber, todos: [], file };
                        file.heads.push(head);
                        break;
                    }
                    case 'unordered-list': {
                        if (block.items.length === 1) {
                            const item = block.items[0];
                            if (item.type === 'checkbox') {
                                // TODO: Figure out why item.indent is always zero
                                const indent = (/^\s+/.exec(line.text) || [''])[0];
                                const todo: Todo = { type: TodoType, text: item.text.trim(), isChecked: item.check !== null, line: line.lineNumber, indent, file };
                                if (file.heads.length === 0) {
                                    file.headlessTodos.push(todo);
                                } else {
                                    file.heads[file.heads.length - 1].todos.push(todo);
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

        file.heads = file.heads.filter(head => head.todos.length > 0);

        if (index !== -1) {
            // Remove file after ites last to-do item has been deleted
            if (file.headlessTodos.length === 0 && file.heads.length === 0) {
                this.cache.splice(index, 1);
                this._onDidChangeTreeData.fire();
            } else {
                // Sort all in case counts change and we sort by them
                if (this.sortByCount) {
                    this._onDidChangeTreeData.fire();
                } else {
                    this._onDidChangeTreeData.fire(file);
                }
            }
        } else {
            // Do not include empty files
            if (file.headlessTodos.length !== 0 || file.heads.length !== 0) {
                this.cache.push(file);
                // Refresh the tree to find the new file
                this._onDidChangeTreeData.fire();
            }
        }
    }

    private count(todos: Todo[]) {
        return todos.reduce((counts, todo) => {
            if (todo.isChecked) {
                counts.checked++;
            } else {
                counts.unchecked++;
            }

            return counts;
        }, { checked: 0, unchecked: 0 });
    }

    public dispose() {
        delete this.cache;
        this._onDidChangeTreeData.dispose();
        this.watcher.dispose();
    }
}

class TodoCodeLensProvider implements CodeLensProvider {
    onDidChangeCodeLenses?: Event<void> | undefined;

    provideCodeLenses(document: TextDocument, token: CancellationToken): CodeLens[] {
        const lenses: CodeLens[] = [];
        for (let index = 0; index < document.lineCount; index++) {
            const line = document.lineAt(index);
            const dom = MarkDownDOM.parse(line.text.trim());
            if (dom.blocks && dom.blocks.length === 1) {
                const block = dom.blocks[0];
                if (block.type === 'unordered-list' && block.items.length === 1) {
                    const item = block.items[0];
                    if (item.type === 'checkbox') {
                        lenses.push(new TodoCodeLens(line.range, document.uri.fsPath));
                        lenses.push(new CodeLens(line.range, {
                            title: 'Remove',
                            command: 'markdown-todo.remove',
                            arguments: [document.uri.fsPath, line.lineNumber],
                        }));

                        // TODO: Figure out why item.indent is always zero
                        const indent = (/^\s+/.exec(line.text) || [''])[0];

                        lenses.push(new CodeLens(line.range, {
                            title: 'Detick',
                            command: 'markdown-todo.detick',
                            arguments: [document.uri.fsPath, line.lineNumber, indent],
                        }));

                        if (item.check !== null) {
                            lenses.push(new CodeLens(line.range, {
                                title: 'Untick',
                                command: 'markdown-todo.untick',
                                arguments: [document.uri.fsPath, line.lineNumber, indent],
                            }));
                        } else {
                            lenses.push(new CodeLens(line.range, {
                                title: 'Tick',
                                command: 'markdown-todo.tick',
                                arguments: [document.uri.fsPath, line.lineNumber, indent],
                            }));
                        }
                    }
                }

            }
        }

        return lenses;
    }

    async resolveCodeLens(codeLens: CodeLens, token: CancellationToken): Promise<CodeLens> {
        if (codeLens instanceof TodoCodeLens && codeLens.age === undefined) {
            const workspaceDirectoryPath = workspace.workspaceFolders![0].uri.fsPath;
            const absoluteFilePath = codeLens.path;
            const relativeFilePath = path.relative(workspaceDirectoryPath, absoluteFilePath);
            const { stdout, stderr } = await new Promise<{ stdout: string, stderr: string }>((resolve, reject) => {
                child_process.exec(
                    `git --no-pager blame -pL ${codeLens.range.start.line + 1},${codeLens.range.start.line + 1} -- ${relativeFilePath}`,
                    { cwd: workspaceDirectoryPath },
                    (error, stdout, stderr) => {
                        if (!!error) {
                            reject(error);
                            return;
                        }

                        resolve({ stdout, stderr });
                    },
                );
            });

            if (stderr) {
                return codeLens;
            }

            const dateAndTimeRaw = stdout.split('\n').find(line => line.startsWith('author-time'))!.split(' ')[1];
            const dateAndTime = new Date(Number(dateAndTimeRaw) * 1000);
            codeLens.command = { title: `${ta.ago(dateAndTime)} (${dateAndTime.toLocaleString()})`, command: 'extension.sayHello' };
            return codeLens;
        }

        return codeLens;
    }
}

class TodoCodeLens extends CodeLens {
    public age?: string;
    public readonly path: string;
    constructor(range: Range, path: string) {
        super(range);
        this.path = path;
    }
}
