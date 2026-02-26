# Johnny Decimal

A [Raycast](https://raycast.com) extension to navigate and search your [Johnny.Decimal](https://johnnydecimal.com/) system.

## How it works

The extension builds a YAML index (`.jdex.yaml`) from your JD folder structure and searches against it, rather than traversing the filesystem on every keystroke.

## Commands

| Command | Description |
|---------|-------------|
| **Search IDs** | Search your JD IDs (e.g. `11.01 Returns`) |
| **Search Categories** | Search your JD categories (e.g. `11 Tax`) |
| **Search Areas** | Search your JD areas (e.g. `10-19 Finance`) |
| **Search All** | Fuzzy search across all entries |
| **Rebuild Index** | Rebuild `.jdex.yaml` from your folder structure |
| **Check Index** | Validate index consistency against the filesystem |

## Setup

1. Install the extension in Raycast
2. Set your **Root Folder** preference to your JD root directory
3. Run **Rebuild Index** to generate the `.jdex.yaml` file
4. Use any search command to find and open your JD entries
