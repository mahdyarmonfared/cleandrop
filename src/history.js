import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { getUniqueDestinationPath } from './utils.js';

const HISTORY_FILE = '.cleandrop-history.json';

/**
 * Save file movement history for undo operations
 */
export async function saveHistory(targetDir, moves) {
  if (moves.length === 0) return;

  const historyPath = path.join(targetDir, HISTORY_FILE);
  const record = {
    timestamp: new Date().toISOString(),
    moves: moves.map(m => ({
      source: m.source,
      destination: m.destination,
      category: m.category
    }))
  };

  try {
    let historyList = [];
    try {
      const data = await fs.readFile(historyPath, 'utf8');
      historyList = JSON.parse(data);
      if (!Array.isArray(historyList)) historyList = [];
    } catch {
      // History file does not exist yet
    }

    historyList.push(record);
    await fs.writeFile(historyPath, JSON.stringify(historyList, null, 2), 'utf8');
  } catch (error) {
    console.error(chalk.red(`Failed to save undo history: ${error.message}`));
  }
}

/**
 * Perform undo operation by moving files back to their original locations
 */
export async function undoLastRun(targetDir) {
  const historyPath = path.join(targetDir, HISTORY_FILE);

  let historyList = [];
  try {
    const data = await fs.readFile(historyPath, 'utf8');
    historyList = JSON.parse(data);
  } catch {
    return {
      success: false,
      message: 'No undo history found in this directory.'
    };
  }

  if (!Array.isArray(historyList) || historyList.length === 0) {
    return {
      success: false,
      message: 'No actions to undo.'
    };
  }

  const lastAction = historyList.pop();
  let revertedCount = 0;
  const categoriesToCheck = new Set();

  for (const move of lastAction.moves) {
    try {
      // Check if file still exists at the destination
      await fs.access(move.destination);

      // Safe collision handling: if a new file has appeared at move.source, rename to prevent overwrite
      let safeSource = move.source;
      try {
        await fs.access(move.source);
        safeSource = await getUniqueDestinationPath(path.dirname(move.source), path.basename(move.source));
        console.warn(chalk.yellow(`  Notice: Collision detected at ${path.basename(move.source)}. Restored as ${path.basename(safeSource)}`));
      } catch {
        // Source path is clear, safe to restore
      }

      await fs.mkdir(path.dirname(safeSource), { recursive: true });
      await fs.rename(move.destination, safeSource);
      revertedCount++;
      categoriesToCheck.add(path.dirname(move.destination));
    } catch {
      console.warn(chalk.yellow(`Warning: Could not restore ${path.basename(move.destination)} (file moved or deleted)`));
    }
  }

  // Remove empty category folders if left clean
  for (const dir of categoriesToCheck) {
    try {
      const remaining = await fs.readdir(dir);
      if (remaining.length === 0) {
        await fs.rmdir(dir);
      }
    } catch {
      // Ignore directory cleanup errors
    }
  }

  // Save remaining history or delete file if empty
  if (historyList.length > 0) {
    await fs.writeFile(historyPath, JSON.stringify(historyList, null, 2), 'utf8');
  } else {
    try {
      await fs.unlink(historyPath);
    } catch {
      // Ignore
    }
  }

  return {
    success: true,
    revertedCount,
    totalCount: lastAction.moves.length
  };
}
