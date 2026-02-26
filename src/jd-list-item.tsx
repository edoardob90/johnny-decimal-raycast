import { List, ActionPanel, Action } from "@raycast/api";
import { JDIndex, JDSearchResult, resolveEntryPath } from "./utils";

export function JDListItem({
  result,
  rootFolder,
  index,
  accessories,
}: {
  result: JDSearchResult;
  rootFolder: string;
  index: JDIndex;
  accessories?: List.Item.Props["accessories"];
}) {
  const entryPath = resolveEntryPath(rootFolder, index, result.key);

  return (
    <List.Item
      key={result.key}
      title={result.name}
      subtitle={result.key}
      accessories={accessories}
      actions={
        <ActionPanel>
          <Action.ShowInFinder path={entryPath} />
          <Action.Open title="Open in Finder" target={entryPath} />
          <Action.CopyToClipboard title="Copy JD Key" content={result.key} />
        </ActionPanel>
      }
    />
  );
}
