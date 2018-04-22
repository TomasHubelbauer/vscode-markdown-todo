# Changelog

## `5.0.0` (Unreleased)

- Group to-do items underneath MarkDown headers in the tree view

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
