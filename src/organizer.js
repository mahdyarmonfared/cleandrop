import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { IGNORED_NAMES, IGNORED_EXTENSIONS, CATEGORIES, DEFAULT_OTHER_FOLDER } from './config.js';
import { getCategoryForExtension, getUniqueDestinationPath } from './utils.js';
import { saveHistory } from './history.js';

/**
 * Scan and organize files in target directory into categorized subdirectories
 */
export async function organizeDirectory(targetDir, options = {}) {
  const { dryRun = false, verbose = false, reorganizeExisting = false } = options;

  // Resolve absolute path
  const absoluteTarget = path.resolve(targetDir);

  // Validate directory existence
  const stat = await fs.stat(absoluteTarget);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${absoluteTarget}`);
  }

  const entries = await fs.readdir(absoluteTarget, { withFileTypes: true });
  const categoryNames = new Set([...Object.keys(CATEGORIES), DEFAULT_OTHER_FOLDER]);

  const preservedFolders = [];
  let subfolderFileCount = 0;
  let subfolderTotalBytes = 0;

  for (const entry of entries) {
    if (entry.isDirectory() && !categoryNames.has(entry.name) && !entry.name.startsWith('.')) {
      preservedFolders.push(entry.name);
    }
  }

  // Files to organize: list of { fileName, sourcePath, fromSubfolder }
  const filesToProcess = [];

  for (const entry of entries) {
    if (entry.isFile()) {
      const fileName = entry.name;
      const ext = path.extname(fileName).toLowerCase();

      // Skip hidden files, ignored names, and active in-progress downloads (.crdownload, .part)
      if (fileName.startsWith('.') || IGNORED_NAMES.has(fileName) || IGNORED_EXTENSIONS.has(ext)) {
        continue;
      }

      filesToProcess.push({
        fileName,
        sourcePath: path.join(absoluteTarget, fileName),
        fromSubfolder: null
      });
    }
  }

  // Inspect preserved subfolders
  for (const subfolder of preservedFolders) {
    const subfolderPath = path.join(absoluteTarget, subfolder);
    try {
      const subEntries = await fs.readdir(subfolderPath, { withFileTypes: true });
      for (const subEntry of subEntries) {
        if (subEntry.isFile()) {
          const fileName = subEntry.name;
          const ext = path.extname(fileName).toLowerCase();
          if (fileName.startsWith('.') || IGNORED_NAMES.has(fileName) || IGNORED_EXTENSIONS.has(ext)) {
            continue;
          }
          const fullPath = path.join(subfolderPath, fileName);
          const fStat = await fs.stat(fullPath);
          subfolderFileCount++;
          subfolderTotalBytes += fStat.size;

          if (reorganizeExisting) {
            filesToProcess.push({
              fileName,
              sourcePath: fullPath,
              fromSubfolder: subfolderPath
            });
          }
        }
      }
    } catch {
      // Ignore unreadable subfolders
    }
  }

  const moves = [];
  let totalBytes = 0;
  const cleanedSubfolders = new Set();

  for (const fileInfo of filesToProcess) {
    const { fileName, sourcePath, fromSubfolder } = fileInfo;
    const ext = path.extname(fileName).toLowerCase();
    const category = getCategoryForExtension(ext);
    const categoryDir = path.join(absoluteTarget, category);

    try {
      const fileStat = await fs.stat(sourcePath);
      let destPath;
      if (dryRun) {
        destPath = path.join(categoryDir, fileName);
      } else {
        await fs.mkdir(categoryDir, { recursive: true });
        destPath = await getUniqueDestinationPath(categoryDir, fileName);
        await fs.rename(sourcePath, destPath);
        if (fromSubfolder) {
          cleanedSubfolders.add(fromSubfolder);
        }
      }

      totalBytes += fileStat.size;
      moves.push({
        name: fileName,
        source: sourcePath,
        destination: destPath,
        category,
        size: fileStat.size,
        fromSubfolder: fromSubfolder ? path.basename(fromSubfolder) : null
      });

      if (verbose) {
        console.log(`  ${chalk.cyan('→')} ${chalk.white(fileName)} ${chalk.gray('➜')} ${chalk.green(category + '/' + path.basename(destPath))}`);
      }
    } catch (err) {
      console.warn(chalk.yellow(`  Warning: Could not process ${fileName} (${err.code || err.message}). Skipping.`));
    }
  }

  // Clean up subfolders if emptied during reorganizeExisting
  if (!dryRun && reorganizeExisting) {
    for (const subDir of cleanedSubfolders) {
      try {
        const remaining = await fs.readdir(subDir);
        if (remaining.length === 0) {
          await fs.rmdir(subDir);
        }
      } catch {
        // Keep directory if not empty or permission denied
      }
    }
  }

  if (!dryRun && moves.length > 0) {
    await saveHistory(absoluteTarget, moves);
  }

  return {
    targetDir: absoluteTarget,
    moves,
    totalBytes,
    dryRun,
    reorganizeExisting,
    preservedFolders: reorganizeExisting ? [] : preservedFolders,
    subfolderFileCount,
    subfolderTotalBytes
  };
}
