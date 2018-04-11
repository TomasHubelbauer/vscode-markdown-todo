# Consider using a tree view

Instead of an Output pane channel, we could contribute a view to the Explorer pane and show to-do items with icons etc.

- `window.createTreeView` + `createTreeViewDataProvider`
- `contributes.views` in `package.json`
- `onView` activation event
- Maybe a keyboard shortcut / command (or both) for activating and showing the tree view
- Clicking would use `showTextDocument`

Alternative proposal is to use a quick pick.
