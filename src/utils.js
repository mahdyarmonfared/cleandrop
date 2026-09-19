import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import { CATEGORIES, DEFAULT_OTHER_FOLDER } from './config.js';

/**
 * Format bytes into human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Determine the destination folder category based on file extension
 */
export function getCategoryForExtension(ext) {
  const normalizedExt = ext.toLowerCase();
  for (const [category, extensions] of Object.entries(CATEGORIES)) {
    if (extensions.includes(normalizedExt)) {
      return category;
    }
  }
  return DEFAULT_OTHER_FOLDER;
}

/**
 * Generate a unique file path if a file with the same name already exists in target directory
 */
export async function getUniqueDestinationPath(targetDir, originalName) {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);

  let targetPath = path.join(targetDir, originalName);
  let counter = 1;

  while (true) {
    try {
      await fs.access(targetPath);
      // If access succeeds, file exists -> generate next candidate
      targetPath = path.join(targetDir, `${baseName} (${counter})${ext}`);
      counter++;
    } catch {
      // File does not exist, safe to use targetPath
      return targetPath;
    }
  }
}

/**
 * Print a visually polished summary of the operation
 */
export function printSummary({ moves, dryRun, totalBytes }) {
  console.log('\n' + chalk.bold.cyan('━'.repeat(50)));
  console.log(chalk.bold.cyan(`  CleanDrop Summary ${dryRun ? chalk.yellow('[DRY RUN]') : chalk.green('[COMPLETED]')}`));
  console.log(chalk.bold.cyan('━'.repeat(50)));

  if (moves.length === 0) {
    console.log(chalk.yellow('  ✨ No files needed to be moved. The folder is already clean!'));
    console.log(chalk.bold.cyan('━'.repeat(50)) + '\n');
    return;
  }

  // Group by category
  const categoryCounts = {};
  for (const move of moves) {
    categoryCounts[move.category] = (categoryCounts[move.category] || 0) + 1;
  }

  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`  📂 ${chalk.bold.white(cat.padEnd(14))}: ${chalk.green(count)} file(s)`);
  }

  console.log(chalk.gray('  ' + '─'.repeat(46)));
  console.log(`  📊 ${chalk.bold('Total Files')}   : ${chalk.bold.yellow(moves.length)}`);
  console.log(`  💾 ${chalk.bold('Total Size')}    : ${chalk.bold.yellow(formatBytes(totalBytes))}`);
  if (dryRun) {
    console.log(`\n  ${chalk.magenta('ℹ')} ${chalk.italic('No files were modified. Run without --dry-run to apply changes.')}`);
  }
  console.log(chalk.bold.cyan('━'.repeat(50)) + '\n');
}
