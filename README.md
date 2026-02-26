# Raycast Johnny.Decimal

A [Raycast](https://raycast.com) extension to navigate and search your [Johnny.Decimal](https://johnnydecimal.com/) system.
Inspired by [Raycast Store's extension](https://github.com/raycast/extensions/tree/2a72a867f262d0118a8057640b7baf7d93765aea/extensions/johnny-decimal).

## Where it improves

The original extension walks the filesystem recursively on every keystroke.
This version builds a YAML index (`.jdex.yaml`) once, then searches in-memory — no disk I/O per keystroke.
The difference is likely imperceptible for an average system (a few hundreds items at most), but it could become a bottleneck for large, multi-area systems (1000+ items).

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
