import { List, ActionPanel, Action, Form, useNavigation, showToast, Toast, Icon } from "@raycast/api";
import type { JDIndex } from "./schema";
import { JDSearchResult, resolveEntryPath, updateEntryDescription } from "./utils";

function EditDescriptionForm({
  entryKey,
  currentDescription,
  indexPath,
  onSaved,
}: {
  entryKey: string;
  currentDescription?: string;
  indexPath: string;
  onSaved?: () => void;
}) {
  const { pop } = useNavigation();

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save Description"
            onSubmit={async (values: { description: string }) => {
              updateEntryDescription(indexPath, entryKey, values.description);
              await showToast({ style: Toast.Style.Success, title: "Description updated" });
              onSaved?.();
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea id="description" title="Description" defaultValue={currentDescription ?? ""} />
    </Form>
  );
}

export function JDListItem({
  result,
  rootFolder,
  index,
  indexPath,
  accessories,
  onDescriptionSaved,
}: {
  result: JDSearchResult;
  rootFolder: string;
  index: JDIndex;
  indexPath: string;
  accessories?: List.Item.Props["accessories"];
  onDescriptionSaved?: () => void;
}) {
  const entryPath = resolveEntryPath(rootFolder, index, result.key);

  return (
    <List.Item
      key={result.key}
      title={result.name}
      subtitle={result.key}
      accessories={[
        ...(result.description ? [{ text: result.description, icon: Icon.Paragraph }] : []),
        ...(accessories ?? []),
      ]}
      actions={
        <ActionPanel>
          <Action.ShowInFinder path={entryPath} />
          <Action.Open title="Open" target={entryPath} />
          <Action.CopyToClipboard title="Copy JD Key" content={result.key} />
          <Action.Push
            title="Edit Description"
            icon={Icon.Pencil}
            target={
              <EditDescriptionForm
                entryKey={result.key}
                currentDescription={result.description}
                indexPath={indexPath}
                onSaved={onDescriptionSaved}
              />
            }
          />
        </ActionPanel>
      }
    />
  );
}
