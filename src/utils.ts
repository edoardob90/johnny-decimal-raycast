import { LocalStorage } from "@raycast/api";
import fs from "fs";
import path from "path";
import { JDIndexFileSchema } from "./schema";

import type { JDEntry, JDIndex, JDIndexFile, JDType } from "./schema";

export interface Preferences {
  rootFolder: string;
  searchSensitivity?: "strict" | "balanced" | "loose";
}

export interface JDSearchResult {
  key: string;
  type: JDType;
  name: string;
  parent: string | null;
  description?: string;
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

const JD_KEY_PATTERNS: RegExp[] = [
  // area: 10-19
  /^\d{2}-\d{2}$/,
  // category: 11
  /^\d{2}$/,
  // id: 11.01 | 11.01+A3 | 22.00+0001
  /^\d{2}\.\d{2}(\+[A-Za-z0-9]+)?$/,
];

const isValidJDKey = (key: string, level: number): boolean => {
  return JD_KEY_PATTERNS[level]?.test(key) ?? false;
};

/**
 * Build a JDIndex by walking the filesystem 3 levels deep from rootFolder.
 * Level 0 → areas (e.g. "10-19 Finance")
 * Level 1 → categories (e.g. "11 Tax")
 * Level 2 → IDs (e.g. "11.01 Returns")
 */
export function buildIndex(rootFolder: string, existingIndex?: JDIndex): JDIndex {
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
      if (!isValidJDKey(key, level)) continue;
      index[key] = {
        type: typeByLevel[level],
        name,
        parent: parentKey,
      };
      walk(path.join(dir, entry), level + 1, key);
    }
  }

  walk(rootFolder, 0, null);

  if (existingIndex) {
    for (const key of Object.keys(index)) {
      if (existingIndex[key]?.description) {
        index[key].description = existingIndex[key].description;
      }
    }
  }

  return index;
}

export function writeIndex(entries: JDIndex, filePath: string, created?: string): void {
  const now = new Date().toISOString();
  const sorted = Object.keys(entries)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
    .reduce<JDIndex>((acc, key) => {
      acc[key] = entries[key];
      return acc;
    }, {});
  const file: JDIndexFile = { created: created ?? now, updated: now, entries: sorted };
  fs.writeFileSync(filePath, JSON.stringify(file, null, 2) + "\n", "utf-8");
}

export function readIndex(filePath: string): JDIndex {
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(content);
  // Migration: handle old flat format (no wrapper)
  return "entries" in parsed ? (parsed.entries as JDIndex) : (parsed as JDIndex);
}

export function readIndexFile(filePath: string): JDIndexFile {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as JDIndexFile;
}

export function getIndexPath(prefs: Preferences): string {
  return path.join(prefs.rootFolder, ".jdex.json");
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
  invalidEntries: Array<{ key: string; error: string }>;
  orphanParents: Array<{ key: string; parent: string }>;
  missingOnDisk: Array<{ key: string; name: string }>;
  missingInIndex: Array<{ key: string; name: string; type: JDType }>;
}

/**
 * Validate index consistency: check for structural validity, orphan parent references,
 * entries missing on disk, and folders on disk missing from the index.
 */
export function checkIndex(rootFolder: string, index: JDIndex, rawFile?: unknown): CheckResult {
  const result: CheckResult = { invalidEntries: [], orphanParents: [], missingOnDisk: [], missingInIndex: [] };

  // Single parse of the full file — partitioned by path into file-level and per-entry issues.
  const invalidKeys = new Set<string>();
  if (rawFile !== undefined) {
    const parsed = JDIndexFileSchema.safeParse(rawFile);
    if (!parsed.success) {
      const entryErrors = new Map<string, string[]>();
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "entries" && typeof issue.path[1] === "string") {
          const key = issue.path[1];
          const msgs = entryErrors.get(key) ?? [];
          msgs.push(issue.message);
          entryErrors.set(key, msgs);
        } else {
          result.invalidEntries.push({ key: "<file>", error: issue.message });
        }
      }
      for (const [key, msgs] of entryErrors) {
        invalidKeys.add(key);
        for (const msg of msgs) {
          result.invalidEntries.push({ key, error: msg });
        }
      }
    }
  }

  // Check orphan parents and missing on disk (skip structurally invalid entries)
  for (const [key, entry] of Object.entries(index)) {
    if (invalidKeys.has(key)) continue;
    if (entry.parent !== null && !(entry.parent in index)) {
      result.orphanParents.push({ key, parent: entry.parent });
    }
    const entryPath = resolveEntryPath(rootFolder, index, key);
    if (!fs.existsSync(entryPath)) {
      result.missingOnDisk.push({ key, name: entry.name });
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
      if (!isValidJDKey(key, level)) continue;
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

export const ACTIVE_SYSTEM_KEY = "activeSystemRoot";
export const LAST_PREF_ROOT_KEY = "lastPrefRoot";
export const CONFIGURED_SYSTEMS_KEY = "configuredSystems";

export interface ConfiguredSystem {
  label: string;
  rootFolder: string;
  indexPath: string;
}

export async function getConfiguredSystems(): Promise<ConfiguredSystem[]> {
  const raw = await LocalStorage.getItem<string>(CONFIGURED_SYSTEMS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ConfiguredSystem[];
  } catch {
    return [];
  }
}

export async function registerSystem(system: ConfiguredSystem): Promise<void> {
  const systems = await getConfiguredSystems();
  const idx = systems.findIndex((s) => s.rootFolder === system.rootFolder);
  if (idx >= 0) {
    systems[idx] = system;
  } else {
    systems.push(system);
  }
  await LocalStorage.setItem(CONFIGURED_SYSTEMS_KEY, JSON.stringify(systems));
}

export function updateEntryDescription(indexPath: string, key: string, description: string): void {
  const file = readIndexFile(indexPath);
  if (!(key in file.entries)) return;
  file.entries[key].description = description || undefined;
  writeIndex(file.entries, indexPath, file.created);
}
