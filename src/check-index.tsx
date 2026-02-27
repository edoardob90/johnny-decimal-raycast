import { List, getPreferenceValues, Icon, Color, ActionPanel, Action } from "@raycast/api";
import { useMemo } from "react";
import fs from "fs";
import { Preferences, getIndexPath, checkIndex } from "./utils";

export default function Command() {
  const prefs = getPreferenceValues<Preferences>();
  const indexPath = getIndexPath(prefs);

  const { result, entryCount, error } = useMemo(() => {
    if (!fs.existsSync(indexPath)) return { result: null, entryCount: 0, error: "No index found" };
    try {
      const raw = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
      const index = "entries" in raw ? raw.entries : raw;
      return { result: checkIndex(prefs.rootFolder, index, raw), entryCount: Object.keys(index).length, error: null };
    } catch (e) {
      return { result: null, entryCount: 0, error: String(e) };
    }
  }, [indexPath, prefs.rootFolder]);

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
            indexPath={indexPath}
          />
          <IssueSection
            title="Orphan Parents"
            subtitle="Parent key not found in index"
            items={result.orphanParents.map((e) => ({ key: e.key, detail: `parent: ${e.parent}` }))}
            indexPath={indexPath}
          />
          <IssueSection
            title="Missing on Disk"
            subtitle="In index but folder not found"
            items={result.missingOnDisk.map((key) => ({ key, detail: "folder not found" }))}
            indexPath={indexPath}
          />
          <IssueSection
            title="Missing in Index"
            subtitle="Folder on disk but not indexed"
            items={result.missingInIndex.map((e) => ({ key: e.key, detail: `${e.type}: ${e.name}` }))}
            indexPath={indexPath}
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
