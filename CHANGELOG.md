# Changelog

## `9.0.0` (2018-05-21)

- Display the to-do checkbox age in the CodeLens next to the date
- Hide the `done` portion of the tree view item label with counts if it is zero
- Reveal to-do item checkboxes in the center of the editor after clicking
  - The default caused issue with releaving outside of visible range
  - The at-top option caused CodeLens for that item to be hidden
- Contribute a detick command for removing just the checkbox leaving the text

## `8.0.0` (2018-05-20)

Contribute a custom view container with the MarkDown To-Do tree view.

## `7.0.1` (2018-05-20)

Create an icon for the extension when shown in the VS Code Marketplace.

## `7.0.0` (2018-05-19)

- Contribute a refresh command to the MarkDown To-Do tree view title context (reflects even unsaved changes)
- Contribute a toggle ticked command to the MarkDown To-Do tree view title context (whether to show ticked or not)
- Implement code lens for MarkDow checkboxes with contextual tick/untick command, remove command and date and time of line commit
- Display contextual tick/untick command only, not both, in the MarkDown To-Do tree view to-do item context
- Contribute a toggle sort order command to the MarkDown To-Do tree view title context:
  - Sort by file name and header order in document
  - Sort by unticked to-do item count

## `6.0.1` (2018-05-09)

- Split the toggle command into two *Tick* and *Untick* commands
- Display graphical icons to the right of the to-do items in the tree instead of in the context menu
- Introduce also an icon for the *Remove* command and show that command in the tree as well

## `6.0.0` (2018-05-08)

- Use `fileSystemWatcher` instead of `findFiles` as the latter has been unreliable
- Remove the *Open file* and *Focus header* commands as they interfered with the folding/unfolding behavior of the tree item ([a known VS Code issue](https://github.com/Microsoft/vscode/issues/34130))
- Remove the *Refresh file* command as it should not be needed anymore (the file system watcher should be reliable)
- Display checked, unchecked and total counts separately
- Save files after toggling or removing to-do items

## `5.0.5` (2018-04-26)

Exclude `files.exclude` specifically.

## `5.0.4` (2018-04-25)

Hide entries with no to-do items.

## `5.0.3` (2018-04-23)

Exclude default exclusions when looking for workspace MarkDown files.

## `5.0.2` (2018-04-23)

Upgrade MarkDownDOM for unordered list item indent calculation and do toggling replace precisely at the check character range.

## `5.0.1` (2018-04-23)

Fix parsing MarkDown headers to group items under by upgrading MarkDownDOM.

## `5.0.0` (2018-04-23)

Group to-do items underneath MarkDown headers in the tree view

## `4.0.0` (2018-04-22)

- Filter to only files that have to-do items
- Fix a bug where nested list items we're inspected to to-do items
- Display the number of to-do items in the file tree view item
- Fix a bug where nested to-do items would have their indent reset upon toggling
- Scroll to the to-do in the editor upon selecting, toggling or removing

## `3.0.0` (2018-04-22)

Convert to a version which uses a tree view to collect the to-do items.

## `2.0.0` (2018-04-22)

- Use MarkDownDOM to parse the unordered checkbox list blocks
- Use `lineCount` and `lineAt` instead of my own regex to be 100 % compatible with VS Code behavior

## `1.0.0` (2018-04-11)

- Initial release
