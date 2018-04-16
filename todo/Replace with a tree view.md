# Consider using a tree view

Instead of an Output pane channel, contribute a view to the Explorer pane and show to-do items with icons etc.

- `window.createTreeView` + `createTreeViewDataProvider`
- `contributes.views` in `package.json`
- `onView` activation event
- Maybe a keyboard shortcut / command (or both) for activating and showing the tree view
- Clicking would use `showTextDocument`

Upon each sync, flash new items (maybe the green decorator or something) so it's visually clear what showed up new and what stayed the same.

Also contribute an editor thingy which will underline the `[ ]` bit and when clicking on it, will open the corresponding item in the tree view.
