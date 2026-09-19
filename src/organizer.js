import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { IGNORED_NAMES, CATEGORIES, DEFAULT_OTHER_FOLDER } from './config.js';
import { getCategoryForExtension, getUniqueDestinationPath } from './utils.js';
import { saveHistory } from './history.js';

/**
 * Scan and organize files in target directory into categorized subdirectories
 */
export async function organizeDirectory(targetDir, options = {}) {
  const { dryRun = false, verbose = false } = options;

  // Resolve absolute path
  const absoluteTarget = path.resolve(targetDir);

  // Validate directory existence
  const stat = await fs.stat(absoluteTarget);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${absoluteTarget}`);
  }

  const entries = await fs.readdir(absoluteTarget, { withFileTypes: true });
  const categoryNames = new Set([...Object.keys(CATEGORIES), DEFAULT_OTHER_FOLDER]);

  const moves = [];
  let totalBytes = 0;

  for (const entry of entries) {
    // Only process files in the top-level of targetDir
    if (!entry.isFile()) continue;

    const fileName = entry.name;

    // Skip hidden files and ignored names
    if (fileName.startsWith('.') || IGNORED_NAMES.has(fileName)) {
      continue;
    }

    const sourcePath = path.join(absoluteTarget, fileName);
    const ext = path.extname(fileName);
    const category = getCategoryForExtension(ext);
    const categoryDir = path.join(absoluteTarget, category);

    // Get file size
    const fileStat = await fs.stat(sourcePath);
    totalBytes += fileStat.size;

    // Calculate destination path (safely handling duplicate names)
    let destPath;
    if (dryRun) {
      destPath = path.join(categoryDir, fileName);
    } else {
      await fs.mkdir(categoryDir, { recursive: true });
      destPath = await getUniqueDestinationPath(categoryDir, fileName);
      await fs.rename(sourcePath, destPath);
    }

    moves.push({
      name: fileName,
      source: sourcePath,
      destination: destPath,
      category,
      size: fileStat.size
    });

    if (verbose) {
      console.log(`  ${chalk.cyan('→')} ${chalk.white(fileName)} ${chalk.gray('➜')} ${chalk.green(category + '/' + path.basename(destPath))}`);
    }
  }

  if (!dryRun && moves.length > 0) {
    await saveHistory(absoluteTarget, moves);
  }

  return {
    targetDir: absoluteTarget,
    moves,
    totalBytes,
    dryRun
  };
}
