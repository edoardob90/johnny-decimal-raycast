# Johnny Decimal Changelog

## [Improve Check Index diagnostics] - {PR_MERGE_DATE}

### Added
- **Check Index** now has a "Rebuild Index" action in the action panel of every issue item and on the "no index found" empty view — no need to navigate away to fix a stale index

### Improved
- **Check Index** validation errors are now human-readable: `missing required field 'parent'` instead of `Invalid input: expected string, received undefined`
- Each invalid field on the same entry is reported as its own row, so no information is hidden
- "Missing on Disk" entries now show the folder name (e.g. `"Inbox" not found`) instead of a generic `folder not found`
- Structurally invalid entries are skipped from the orphan-parent and missing-on-disk checks, eliminating cascading duplicates from a single root cause

## [Simplify index path & fix rootFolder change detection] - {PR_MERGE_DATE}

### Removed
- **Index File** preference — the index is now always `rootFolder/.jdex.json`, with no custom path option

### Fixed
- Changing the `rootFolder` preference no longer leaves commands pointing at a stale index from the previous root

## [Open Index & UX Improvements] - {PR_MERGE_DATE}

### Added
- **Open Index** command — opens the `.jdex.json` index file immediately with the default app; shows an error if no index exists yet

### Improved
- **Check Index** now exposes "Open Index File" and "Show in Finder" actions via the action panel even when the index is fully consistent, not only on issue items
- Editing a description refreshes the index list in-place instead of requiring a command relaunch

## [Initial Release] - {PR_MERGE_DATE}

- Index-based search: build a `.jdex.json` index once, then search in-memory across areas, categories, and IDs
- Fuzzy search across all entries (key, name, description) with configurable sensitivity
- Persistent descriptions that survive index rebuilds
- Index consistency check against the filesystem
- Multi-system support: register multiple JD roots and switch between them
