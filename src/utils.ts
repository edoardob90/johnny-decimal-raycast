import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface Preferences {
  rootFolder: string;
  indexFilePath?: string;
}

export type JDType = "area" | "category" | "id";

export interface JDEntry {
  type: JDType;
  name: string;
  parent: string | null;
}

export type JDIndex = Record<string, JDEntry>;

export interface JDSearchResult {
  key: string;
  type: JDType;
  name: string;
  parent: string | null;
}

/**
 * Parse a JD folder name like "10-19 Finance" into { key: "10-19", name: "Finance" }.
 * If there's no space (just a key with no name), the name defaults to the key itself.
 */
function parseFolderName(folderName: string): { key: string; name: string } {
  const spaceIndex = folderName.indexOf(" ");
  if (spaceIndex === -1) {
    return { key: folderName, name: folderName };
  }
  return {
    key: folderName.substring(0, spaceIndex),
    name: folderName.substring(spaceIndex + 1),
  };
}

/**
 * Build a JDIndex by walking the filesystem 3 levels deep from rootFolder.
 * Level 0 → areas (e.g. "10-19 Finance")
 * Level 1 → categories (e.g. "11 Tax")
 * Level 2 → IDs (e.g. "11.01 Returns")
 */
export function buildIndex(rootFolder: string): JDIndex {
  const index: JDIndex = {};
  const typeByLevel: JDType[] = ["area", "category", "id"];

  function walk(dir: string, level: number, parentKey: string | null) {
    if (level > 2) return;

    const entries = fs.readdirSync(dir).filter((name) => {
      const fullPath = path.join(dir, name);
      return !name.startsWith(".") && fs.statSync(fullPath).isDirectory();
    });

    entries.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    for (const entry of entries) {
      const { key, name } = parseFolderName(entry);
      index[key] = {
        type: typeByLevel[level],
        name,
        parent: parentKey,
      };
      walk(path.join(dir, entry), level + 1, key);
    }
  }

  walk(rootFolder, 0, null);
  return index;
}

export function writeIndex(index: JDIndex, filePath: string): void {
  const content = yaml.dump(index, { sortKeys: true, quotingType: '"', forceQuotes: true, flowLevel: 1 });
  fs.writeFileSync(filePath, content, "utf-8");
}

export function readIndex(filePath: string): JDIndex {
  const content = fs.readFileSync(filePath, "utf-8");
  return yaml.load(content) as JDIndex;
}

export function getIndexPath(prefs: Preferences): string {
  if (prefs.indexFilePath) {
    return prefs.indexFilePath;
  }
  return path.join(prefs.rootFolder, ".jdex.yaml");
}

export function searchIndex(index: JDIndex, type: JDType, term: string): JDSearchResult[] {
  const lowerTerm = term.toLowerCase();

  return Object.entries(index)
    .filter(([key, entry]) => {
      if (entry.type !== type) return false;
      if (!term) return true;
      return key.toLowerCase().includes(lowerTerm) || entry.name.toLowerCase().includes(lowerTerm);
    })
    .map(([key, entry]) => ({ key, ...entry }))
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true, sensitivity: "base" }));
}

export interface CheckResult {
  orphanParents: Array<{ key: string; parent: string }>;
  missingOnDisk: string[];
  missingInIndex: Array<{ key: string; name: string; type: JDType }>;
}

/**
 * Validate index consistency: check for orphan parent references,
 * entries missing on disk, and folders on disk missing from the index.
 */
export function checkIndex(rootFolder: string, index: JDIndex): CheckResult {
  const result: CheckResult = { orphanParents: [], missingOnDisk: [], missingInIndex: [] };

  // Check orphan parents and missing on disk
  for (const [key, entry] of Object.entries(index)) {
    if (entry.parent !== null && !(entry.parent in index)) {
      result.orphanParents.push({ key, parent: entry.parent });
    }
    const entryPath = resolveEntryPath(rootFolder, index, key);
    if (!fs.existsSync(entryPath)) {
      result.missingOnDisk.push(key);
    }
  }

  // Check folders on disk missing from index
  const typeByLevel: JDType[] = ["area", "category", "id"];
  function walkDisk(dir: string, level: number) {
    if (level > 2) return;
    const entries = fs.readdirSync(dir).filter((name) => {
      const fullPath = path.join(dir, name);
      return !name.startsWith(".") && fs.statSync(fullPath).isDirectory();
    });
    for (const entry of entries) {
      const { key, name } = parseFolderName(entry);
      if (!(key in index)) {
        result.missingInIndex.push({ key, name, type: typeByLevel[level] });
      }
      walkDisk(path.join(dir, entry), level + 1);
    }
  }
  walkDisk(rootFolder, 0);

  return result;
}

/**
 * Reconstruct the full filesystem path for a JD entry by walking up the parent chain.
 * Each segment is "KEY NAME" matching the original folder naming convention.
 */
export function resolveEntryPath(rootFolder: string, index: JDIndex, key: string): string {
  const segments: string[] = [];
  let current: string | null = key;

  while (current !== null) {
    const entry: JDEntry | undefined = index[current];
    if (!entry) break;
    segments.unshift(`${current} ${entry.name}`);
    current = entry.parent;
  }

  return path.join(rootFolder, ...segments);
}
