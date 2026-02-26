import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import fs from "fs";
import { Preferences, getIndexPath, readIndex, checkIndex } from "./utils";

export default async function Command() {
  const prefs = getPreferenceValues<Preferences>();
  const indexPath = getIndexPath(prefs);

  if (!fs.existsSync(indexPath)) {
    await showToast({
      style: Toast.Style.Failure,
      title: "No index found",
      message: 'Run "Rebuild Index" first.',
    });
    return;
  }

  try {
    const index = readIndex(indexPath);
    const result = checkIndex(prefs.rootFolder, index);
    const issues: string[] = [];

    if (result.orphanParents.length > 0) {
      issues.push(
        `${result.orphanParents.length} orphan parent(s): ${result.orphanParents.map((o) => o.key).join(", ")}`,
      );
    }
    if (result.missingOnDisk.length > 0) {
      issues.push(`${result.missingOnDisk.length} missing on disk: ${result.missingOnDisk.join(", ")}`);
    }
    if (result.missingInIndex.length > 0) {
      issues.push(
        `${result.missingInIndex.length} missing in index: ${result.missingInIndex.map((m) => m.key).join(", ")}`,
      );
    }

    if (issues.length === 0) {
      await showToast({
        style: Toast.Style.Success,
        title: "Index is consistent",
        message: `${Object.keys(index).length} entries verified.`,
      });
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "Index has issues",
        message: issues.join("; "),
      });
    }
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Check failed",
      message: String(error),
    });
  }
}
