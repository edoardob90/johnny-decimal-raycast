import { List, getPreferenceValues, Icon } from "@raycast/api";
import { useState, useMemo } from "react";
import fs from "fs";
import { Preferences, JDType, JDIndex, getIndexPath, readIndex, searchIndex } from "./utils";
import { JDListItem } from "./jd-list-item";

interface SearchCommandProps {
  type: JDType;
  placeholder: string;
  sectionTitle: string;
}

export default function SearchCommand({ type, placeholder, sectionTitle }: SearchCommandProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const prefs = getPreferenceValues<Preferences>();
  const indexPath = getIndexPath(prefs);

  const index: JDIndex | null = useMemo(() => {
    if (!fs.existsSync(indexPath)) return null;
    return readIndex(indexPath);
  }, [indexPath]);

  const results = useMemo(() => {
    if (!index) return [];
    return searchIndex(index, type, searchTerm);
  }, [index, type, searchTerm]);

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
    <List onSearchTextChange={setSearchTerm} searchBarPlaceholder={placeholder} throttle>
      <List.Section title={sectionTitle}>
        {results.map((result) => (
          <JDListItem
            key={result.key}
            result={result}
            rootFolder={prefs.rootFolder}
            index={index}
            indexPath={indexPath}
          />
        ))}
      </List.Section>
    </List>
  );
}
