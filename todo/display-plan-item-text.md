# Display plain item text

Improve MarkDownDOM enough to be able to strip inline formatting from the unordered list items.

One MarkDownDOM elements are switched to be classes, add a `strip` or `getPlainText` or something method to `UnorderedListItem` which would do this in one call so we can avoid the `switch` over spand types in every consumer project.
