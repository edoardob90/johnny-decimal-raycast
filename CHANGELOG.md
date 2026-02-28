# Johnny Decimal Changelog

## [Initial Release] - {PR_MERGE_DATE}

- Index-based search: build a `.jdex.json` index once, then search in-memory across areas, categories, and IDs
- Fuzzy search across all entries (key, name, description) with configurable sensitivity
- Persistent descriptions that survive index rebuilds
- Index consistency check against the filesystem
- Multi-system support: register multiple JD roots and switch between them
