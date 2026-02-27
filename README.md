# Raycast Johnny.Decimal

A [Raycast](https://raycast.com) extension to navigate and search your [Johnny.Decimal](https://johnnydecimal.com/) system.
Inspired by [Raycast Store's extension](https://github.com/raycast/extensions/tree/2a72a867f262d0118a8057640b7baf7d93765aea/extensions/johnny-decimal).

## Where it improves

The original extension walks the filesystem recursively on every keystroke.
This version builds a JSON index (`.jdex.json`) once, then searches in-memory — no disk I/O per keystroke.
The difference is likely imperceptible for an average system (a few hundreds items at most), but it could become a bottleneck for large, multi-area systems (1000+ items).

## Commands

| Command | Description |
|---------|-------------|
| **Search IDs** | Search your JD IDs (e.g. `11.01 Returns`) |
| **Search Categories** | Search your JD categories (e.g. `11 Tax`) |
| **Search Areas** | Search your JD areas (e.g. `10-19 Finance`) |
| **Search All** | Fuzzy search across all entries, including descriptions |
| **Rebuild Index** | Rebuild `.jdex.json` from your folder structure |
| **Check Index** | Validate index consistency against the filesystem |

## Index file

The index is a machine-managed JSON file (`.jdex.json`) stored in your root folder. It includes creation/update timestamps and an `entries` object mapping each JD key to its type, name, parent key, and optional description:

```json
{
  "created": "2026-02-27T10:00:00.000Z",
  "updated": "2026-02-27T11:30:00.000Z",
  "entries": {
    "10-19": { "type": "area", "name": "Finance", "parent": null },
    "11": { "type": "category", "name": "Tax", "parent": "10-19" },
    "11.01": { "type": "id", "name": "Returns", "parent": "11", "description": "Annual tax returns" }
  }
}
```

`created` is set once on first build and preserved on every subsequent rebuild. `updated` is refreshed on every write (rebuild or description edit).

Descriptions survive a **Rebuild Index** — the command merges them back into the new index. To add or edit a description, use the **Edit Description** action from the action panel on any search result.

The index file can also be edited manually (e.g. to bulk-add descriptions), but it's recommended to run **Check Index** afterwards to verify consistency with the filesystem.

## Setup

1. Install the extension in Raycast
2. Set your **Root Folder** preference to your JD root directory
3. Run **Rebuild Index** to generate the `.jdex.json` file
4. Use any search command to find and open your JD entries

## Preferences

| Preference | Description |
|------------|-------------|
| **Root Folder** | Path to your JD root directory (required) |
| **Index File** | Custom path for `.jdex.json` (defaults to root folder) |
| **Search Sensitivity** | Fuzzy match strictness for Search All: Strict, Balanced (default), Loose |

## License

This extension is licensed under [MIT](LICENSE).

The [Johnny.Decimal](https://johnnydecimal.com/) system and its terminology are licensed under [CC BY-NC-SA 4.0](https://johnnydecimal.com/00-09-site-administration/01-about/01.02-licence/).
