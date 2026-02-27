import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import fs from "fs";
import { Preferences, buildIndex, readIndex, writeIndex, getIndexPath } from "./utils";

export default async function Command() {
  const prefs = getPreferenceValues<Preferences>();
  const indexPath = getIndexPath(prefs);

  try {
    const existingIndex = fs.existsSync(indexPath) ? readIndex(indexPath) : undefined;
    const index = buildIndex(prefs.rootFolder, existingIndex);
    writeIndex(index, indexPath);

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
