import { LocalStorage, getPreferenceValues, open, showToast, Toast } from "@raycast/api";
import fs from "fs";
import { Preferences, getIndexPath, ACTIVE_SYSTEM_KEY, LAST_PREF_ROOT_KEY, getConfiguredSystems } from "./utils";

export default async function Command() {
  const prefs = getPreferenceValues<Preferences>();

  let indexPath = getIndexPath(prefs);
  const [lastPrefRoot, storedRoot] = await Promise.all([
    LocalStorage.getItem<string>(LAST_PREF_ROOT_KEY),
    LocalStorage.getItem<string>(ACTIVE_SYSTEM_KEY),
  ]);
  if (lastPrefRoot !== prefs.rootFolder) {
    await LocalStorage.setItem(LAST_PREF_ROOT_KEY, prefs.rootFolder);
    await LocalStorage.setItem(ACTIVE_SYSTEM_KEY, prefs.rootFolder);
    // indexPath already = getIndexPath(prefs) — no further action
  } else if (storedRoot && storedRoot !== prefs.rootFolder) {
    const systems = await getConfiguredSystems();
    const match = systems.find((s) => s.rootFolder === storedRoot);
    if (match) indexPath = match.indexPath;
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
