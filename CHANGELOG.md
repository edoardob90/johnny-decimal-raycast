# Johnny Decimal Changelog

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
