import { List, Icon, Color, ActionPanel, Action, LocalStorage, showToast, Toast, popToRoot } from "@raycast/api";
import { useState, useEffect } from "react";
import { ConfiguredSystem, ACTIVE_SYSTEM_KEY, getConfiguredSystems } from "./utils";

export default function Command() {
  const [systems, setSystems] = useState<ConfiguredSystem[]>([]);
  const [activeRoot, setActiveRoot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [loaded, stored] = await Promise.all([
        getConfiguredSystems(),
        LocalStorage.getItem<string>(ACTIVE_SYSTEM_KEY),
      ]);
      setSystems(loaded);
      setActiveRoot(stored ?? null);
      setIsLoading(false);
    }
    load();
  }, []);

  async function switchTo(system: ConfiguredSystem) {
    await LocalStorage.setItem(ACTIVE_SYSTEM_KEY, system.rootFolder);
    await showToast({ style: Toast.Style.Success, title: `Switched to ${system.label}` });
    popToRoot();
  }

  return (
    <List isLoading={isLoading} navigationTitle="Switch System">
      {!isLoading && systems.length === 0 && (
        <List.EmptyView
          title="No systems registered"
          description="Point Root Folder to a JD root and run Rebuild Index to register it."
          icon={Icon.ArrowsExpand}
        />
      )}
      {systems.map((system) => {
        const isActive = system.rootFolder === activeRoot;
        return (
          <List.Item
            key={system.rootFolder}
            title={system.label}
            subtitle={system.rootFolder}
            accessories={
              isActive ? [{ icon: { source: Icon.CheckCircle, tintColor: Color.Green }, tooltip: "Active" }] : []
            }
            actions={
              <ActionPanel>
                <Action title="Switch to This System" icon={Icon.ArrowRight} onAction={() => switchTo(system)} />
                <Action.CopyToClipboard title="Copy Root Path" content={system.rootFolder} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
