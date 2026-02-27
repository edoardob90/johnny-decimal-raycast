import { List, getPreferenceValues, Icon, Color } from "@raycast/api";
import { useState, useMemo } from "react";
import fs from "fs";
import Fuse from "fuse.js";
import { Preferences, JDSearchResult, getIndexPath, readIndex } from "./utils";
import { JDListItem } from "./jd-list-item";

const TYPE_COLORS: Record<string, Color> = {
  area: Color.Blue,
  category: Color.Green,
  id: Color.Orange,
};

const SENSITIVITY_THRESHOLDS: Record<string, number> = {
  strict: 0.2,
  balanced: 0.4,
  loose: 0.6,
};

export default function Command() {
  const [searchTerm, setSearchTerm] = useState("");
  const prefs = getPreferenceValues<Preferences>();
  const indexPath = getIndexPath(prefs);
  const threshold = SENSITIVITY_THRESHOLDS[prefs.searchSensitivity ?? "balanced"];

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
          { name: "key", weight: 0.5 },
          { name: "name", weight: 0.35 },
          { name: "description", weight: 0.15 },
        ],
        threshold,
      }),
    [allEntries, threshold],
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
          description='Run the "Rebuild Index" command first to build your .jdex.json file.'
          icon={Icon.Warning}
        />
      </List>
    );
  }

  return (
    <List onSearchTextChange={setSearchTerm} searchBarPlaceholder="Search all Johnny.Decimal entries..." throttle>
      <List.Section title="All Entries">
        {results.map((result) => (
          <JDListItem
            key={result.key}
            result={result}
            rootFolder={prefs.rootFolder}
            index={index}
            indexPath={indexPath}
            accessories={[{ tag: { value: result.type, color: TYPE_COLORS[result.type] } }]}
          />
        ))}
      </List.Section>
    </List>
  );
}
