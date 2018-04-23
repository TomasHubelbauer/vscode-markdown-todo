# Figure out efficient rescan

Doesn't appear as though there is a workspace even for when a file gets deleted to remove it and it's heads and todos from the cache.

Instead, probably the best choice will be to utilize a file system watcher on the repository (make sure it respects the default excludes).

It's important to only refresh individual files that have changed, not the whole tree on each event.
