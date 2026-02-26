import { List, ActionPanel, Action, getPreferenceValues, Icon, Color } from "@raycast/api";
import { useState, useMemo } from "react";
import fs from "fs";
import Fuse from "fuse.js";
import { Preferences, JDSearchResult, getIndexPath, readIndex, resolveEntryPath } from "./utils";

const TYPE_COLORS: Record<string, Color> = {
  area: Color.Blue,
  category: Color.Green,
  id: Color.Orange,
};

export default function Command() {
  const [searchTerm, setSearchTerm] = useState("");
  const prefs = getPreferenceValues<Preferences>();
  const indexPath = getIndexPath(prefs);

  const { allEntries, index } = useMemo(() => {
    if (!fs.existsSync(indexPath)) return { allEntries: [] as JDSearchResult[], index: null };
    const idx = readIndex(indexPath);
    const entries = Object.entries(idx)
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true, sensitivity: "base" }));
    return { allEntries: entries, index: idx };
  }, [indexPath]);

  const fuse = useMemo(
    () =>
      new Fuse(allEntries, {
        keys: [
          { name: "key", weight: 0.6 },
          { name: "name", weight: 0.4 },
        ],
        threshold: 0.4,
      }),
    [allEntries],
  );

  const results = useMemo(() => {
    if (!searchTerm) return allEntries;
    return fuse.search(searchTerm).map((r) => r.item);
  }, [searchTerm, allEntries, fuse]);

  if (!index) {
    return (
      <List>
        <List.EmptyView
          title="No index found"
          description='Run the "Rebuild Index" command first to build your .jdex.yaml file.'
          icon={Icon.Warning}
        />
      </List>
    );
  }

  return (
    <List onSearchTextChange={setSearchTerm} searchBarPlaceholder="Search all Johnny.Decimal entries..." throttle>
      <List.Section title="All Entries">
        {results.map((result) => (
          <List.Item
            key={result.key}
            title={result.name}
            subtitle={result.key}
            accessories={[{ tag: { value: result.type, color: TYPE_COLORS[result.type] } }]}
            actions={
              <ActionPanel>
                <Action.ShowInFinder path={resolveEntryPath(prefs.rootFolder, index, result.key)} />
                <Action.CopyToClipboard title="Copy JD Key" content={result.key} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
