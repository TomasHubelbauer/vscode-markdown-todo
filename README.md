# [VSCode MarkDown To-Do](https://marketplace.visualstudio.com/items?itemName=TomasHubelbauer.vscode-markdown-todo)
![Installs](https://vsmarketplacebadge.apphb.com/installs-short/TomasHubelbauer.vscode-markdown-todo.svg)
Collects to-do items in MarkDown files to an Explorer tree view with contextual menues for toggling and removing to-do items and keeps the tree view up-to-date as to-do items are inserted, updated and deleted in any MarkDown file in the workspace.

![Screenshot](screenshot.gif)

## Features

- Watches for new files being created and shows them in the To-Do tree view
- Updates the tree view by updating the headers and to-do items of changed files
- Removes changes files from the tree view if they no longer contain any to-do items
- Handles file detetions by removing the affected files fully from the tree view
- Contributes a context menu command for removing and toggling to-do items
- Indexes the workspace in memory after activation and displays the initial tree of workspace files, their headers and to-do items
