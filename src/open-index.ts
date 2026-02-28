import { LocalStorage, getPreferenceValues, open, showToast, Toast } from "@raycast/api";
import fs from "fs";
import { Preferences, getIndexPath, ACTIVE_SYSTEM_KEY, getConfiguredSystems } from "./utils";

export default async function Command() {
  const prefs = getPreferenceValues<Preferences>();

  let indexPath = getIndexPath(prefs);
  const storedRoot = await LocalStorage.getItem<string>(ACTIVE_SYSTEM_KEY);
  if (storedRoot) {
    const systems = await getConfiguredSystems();
    const match = systems.find((s) => s.rootFolder === storedRoot);
    if (match) {
      indexPath = match.indexPath;
    }
  }

  if (!fs.existsSync(indexPath)) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Index not found",
      message: 'Run "Rebuild Index" first.',
    });
    return;
  }

  await open(indexPath);
}
