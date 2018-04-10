# VS Code MarkDown to-do

An extension for displaying `[ ]` checkboxen from MarkDown files in a workspace in a special view.

I am not sure yet if this is feasible, so feasibility research is in progress currently.

- `onView` action event could be used, each time the custom view would open, it would scan for the checkboxen
  - Still need something for when a MarkDown file is changed, the Word Counter extension demo has this reactivity, so check that out
- `registerCommand` versus `registerTextEditorCommand` - the latter executes only of an active editor and has access to edit builder - useful?
- `createOutputChannel` maybe a channel in Output could be used for the list of todoes? Can rich content be presented there or just text?
- `createTreeView` + `createTreeViewDataProvider`
- Maybe `showQuickPick` listing the todoes and clicking takes you to the todo using `showTextDocument`
- Maybe `workspace.textDocuments` used for iterating workspace files regularly? Have to read the files out of band?
- `onDidChangeTextDocument` for triggering reactive behavior like reindexing the todoes, also see other `workspace` events
- `createFileSystemWatcher` might be useful, also `TextDocumentChangeEvent`
- `findFiles` to filter down to MarkDown files in the workspace? But maybe just an extension filter in `textDocuments` suffices?
- Cannot use `openTextDocument` for reading file contents because that would open a tab (methinks)
- Does using the `Task` abstraction make any sense for this? Like, there are these running tasks-todoes, you finish them by removing the todoes
- `TextDocumentContentProvider` is unrelated but cool, explore elsewhere
- `TextLine` could be somehow used, because the todoes will never span lines
- `TreeView<T>` for a custom view?
- `ViewColumn` if feeling crazy? But that doesn't make sense because it would not relate to the doc on the side, instead it would gather all todoes
