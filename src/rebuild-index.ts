import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import fs from "fs";
import { Preferences, buildIndex, readIndexFile, writeIndex, getIndexPath } from "./utils";

export default async function Command() {
  const prefs = getPreferenceValues<Preferences>();
  const indexPath = getIndexPath(prefs);

  try {
    const existingFile = fs.existsSync(indexPath) ? readIndexFile(indexPath) : undefined;
    const index = buildIndex(prefs.rootFolder, existingFile?.entries);
    writeIndex(index, indexPath, existingFile?.created);

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
