import { LocalStorage, getPreferenceValues, showToast, Toast } from "@raycast/api";
import fs from "fs";
import path from "path";
import {
  Preferences,
  buildIndex,
  readIndexFile,
  writeIndex,
  getIndexPath,
  registerSystem,
  ACTIVE_SYSTEM_KEY,
} from "./utils";

export default async function Command() {
  const prefs = getPreferenceValues<Preferences>();
  // Always rebuild whatever prefs.rootFolder points to — this is the registration mechanism.
  const rootFolder = prefs.rootFolder;
  const indexPath = getIndexPath(prefs);

  try {
    const existingFile = fs.existsSync(indexPath) ? readIndexFile(indexPath) : undefined;
    const index = buildIndex(rootFolder, existingFile?.entries);
    writeIndex(index, indexPath, existingFile?.created);

    const system = { label: path.basename(rootFolder), rootFolder, indexPath };
    await registerSystem(system);
    await LocalStorage.setItem(ACTIVE_SYSTEM_KEY, rootFolder);

    const count = Object.keys(index).length;
    await showToast({
      style: Toast.Style.Success,
      title: "Index rebuilt",
      message: `${count} entries written to ${indexPath}`,
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to rebuild index",
      message: String(error),
    });
  }
}
