import { List, getPreferenceValues, Icon, LocalStorage } from "@raycast/api";
import { useState, useMemo, useEffect } from "react";
import fs from "fs";
import {
  Preferences,
  JDType,
  JDIndex,
  getIndexPath,
  readIndex,
  searchIndex,
  ACTIVE_SYSTEM_KEY,
  getConfiguredSystems,
} from "./utils";
import { JDListItem } from "./jd-list-item";

interface SearchCommandProps {
  type: JDType;
  placeholder: string;
  sectionTitle: string;
}

export default function SearchCommand({ type, placeholder, sectionTitle }: SearchCommandProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const prefs = getPreferenceValues<Preferences>();

  const [activeRoot, setActiveRoot] = useState(prefs.rootFolder);
  const [activeIndexPath, setActiveIndexPath] = useState(getIndexPath(prefs));

  useEffect(() => {
    LocalStorage.getItem<string>(ACTIVE_SYSTEM_KEY).then(async (storedRoot) => {
      if (!storedRoot) return;
      const systems = await getConfiguredSystems();
      const match = systems.find((s) => s.rootFolder === storedRoot);
      if (match) {
        setActiveRoot(match.rootFolder);
        setActiveIndexPath(match.indexPath);
      }
    });
  }, []);

  const index: JDIndex | null = useMemo(() => {
    if (!fs.existsSync(activeIndexPath)) return null;
    return readIndex(activeIndexPath);
  }, [activeIndexPath, refreshToken]);

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
            rootFolder={activeRoot}
            index={index}
            indexPath={activeIndexPath}
            onDescriptionSaved={() => setRefreshToken((t) => t + 1)}
          />
        ))}
      </List.Section>
    </List>
  );
}
