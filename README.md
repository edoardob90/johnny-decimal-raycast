# Raycast Johnny.Decimal

A [Raycast](https://raycast.com) extension to navigate and search your [Johnny.Decimal](https://johnnydecimal.com/) system.

Builds a JSON index (`.jdex.json`) once, then searches in-memory — fast and responsive even for large systems.

## Commands

| Command | Description |
|---------|-------------|
| **Search IDs** | Search your JD IDs (e.g. `11.01 Returns`) |
| **Search Categories** | Search your JD categories (e.g. `11 Tax`) |
| **Search Areas** | Search your JD areas (e.g. `10-19 Finance`) |
| **Search All** | Fuzzy search across all entries, including descriptions |
| **Rebuild Index** | Rebuild `.jdex.json` from your folder structure |
| **Check Index** | Validate index consistency against the filesystem |
| **Open Index** | Open the `.jdex.json` index file with the default app |
| **Switch System** | Switch between registered JD systems |

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

## Installation

This extension is not yet published to the Raycast Store. To install it locally:

1. Clone this repository and install dependencies:
   ```bash
   git clone https://github.com/edoardob90/johnny-decimal-raycast.git
   cd johnny-decimal-raycast
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. Open Raycast, search for **Import Extension**, and select the cloned folder.

The extension will appear permanently in Raycast. To get updates, pull the latest changes and run `npm run build` again.

> **Developing?** Run `npm run dev` instead of building — the extension will be available in Raycast with hot reload while the process is running. See the [Raycast developer docs](https://developers.raycast.com/basics/getting-started) for more.

## Setup

1. Install the extension in Raycast (see [Installation](#installation) above)
2. Set your **Root Folder** preference to your JD root directory
3. Run **Rebuild Index** to generate the `.jdex.json` file
4. Use any search command to find and open your JD entries

## Multiple systems

The extension supports multiple JD systems. Systems are registered automatically when you run **Rebuild Index**:

1. Set **Root Folder** to System A → run **Rebuild Index** (registers System A, makes it active)
2. Set **Root Folder** to System B → run **Rebuild Index** (registers System B, makes it active)
3. Use **Switch System** to toggle between them — all search and check commands follow the active system

## Preferences

| Preference | Description |
|------------|-------------|
| **Root Folder** | Path to your JD root directory (required) |
| **Search Sensitivity** | Fuzzy match strictness for Search All: Strict, Balanced (default), Loose |

## License

This extension is licensed under [MIT](LICENSE).

The [Johnny.Decimal](https://johnnydecimal.com/) system was created by Johnny Noble and Lucy Butcher and is licensed under [CC BY-NC-SA 4.0](https://johnnydecimal.com/00-09-site-administration/01-about/01.02-licence/). This extension implements the JD concept independently and does not reproduce any licensed content.
