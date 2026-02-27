import { List, getPreferenceValues, Icon, Color, ActionPanel, Action, LocalStorage } from "@raycast/api";
import { useState, useMemo, useEffect } from "react";
import fs from "fs";
import { Preferences, getIndexPath, checkIndex, ACTIVE_SYSTEM_KEY, getConfiguredSystems } from "./utils";

export default function Command() {
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

  const { result, entryCount, error } = useMemo(() => {
    if (!fs.existsSync(activeIndexPath)) return { result: null, entryCount: 0, error: "No index found" };
    try {
      const raw = JSON.parse(fs.readFileSync(activeIndexPath, "utf-8"));
      const index = "entries" in raw ? raw.entries : raw;
      return { result: checkIndex(activeRoot, index, raw), entryCount: Object.keys(index).length, error: null };
    } catch (e) {
      return { result: null, entryCount: 0, error: String(e) };
    }
  }, [activeIndexPath, activeRoot]);

  if (error || !result) {
    return (
      <List>
        <List.EmptyView
          title={error === "No index found" ? "No index found" : "Check failed"}
          description={error === "No index found" ? 'Run "Rebuild Index" first.' : (error ?? undefined)}
          icon={Icon.Warning}
        />
      </List>
    );
  }

  const totalIssues =
    result.invalidEntries.length +
    result.orphanParents.length +
    result.missingOnDisk.length +
    result.missingInIndex.length;

  return (
    <List>
      {totalIssues === 0 ? (
        <List.EmptyView
          title="Index is consistent"
          description={`${entryCount} entries verified.`}
          icon={{ source: Icon.CheckCircle, tintColor: Color.Green }}
        />
      ) : (
        <>
          <IssueSection
            title="Invalid Entries"
            subtitle="Structural validation failures"
            items={result.invalidEntries.map((e) => ({ key: e.key, detail: e.error }))}
            indexPath={activeIndexPath}
          />
          <IssueSection
            title="Orphan Parents"
            subtitle="Parent key not found in index"
            items={result.orphanParents.map((e) => ({ key: e.key, detail: `parent: ${e.parent}` }))}
            indexPath={activeIndexPath}
          />
          <IssueSection
            title="Missing on Disk"
            subtitle="In index but folder not found"
            items={result.missingOnDisk.map((key) => ({ key, detail: "folder not found" }))}
            indexPath={activeIndexPath}
          />
          <IssueSection
            title="Missing in Index"
            subtitle="Folder on disk but not indexed"
            items={result.missingInIndex.map((e) => ({ key: e.key, detail: `${e.type}: ${e.name}` }))}
            indexPath={activeIndexPath}
          />
        </>
      )}
    </List>
  );
}

function IssueSection({
  title,
  subtitle,
  items,
  indexPath,
}: {
  title: string;
  subtitle: string;
  items: Array<{ key: string; detail: string }>;
  indexPath: string;
}) {
  if (items.length === 0) return null;
  return (
    <List.Section title={title} subtitle={subtitle}>
      {items.map((item) => (
        <List.Item
          key={item.key}
          title={item.key}
          subtitle={item.detail}
          icon={{ source: Icon.XMarkCircle, tintColor: Color.Red }}
          actions={
            <ActionPanel>
              <Action.Open title="Open Index File" target={indexPath} />
              <Action.CopyToClipboard title="Copy Key" content={item.key} />
              <Action.ShowInFinder path={indexPath} />
            </ActionPanel>
          }
        />
      ))}
    </List.Section>
  );
}
