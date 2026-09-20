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

const CATEGORY_META = {
  Documents: { icon: '📄', color: chalk.blue },
  Images: { icon: '🖼️ ', color: chalk.magenta },
  Videos: { icon: '🎬', color: chalk.cyan },
  Audio: { icon: '🎵', color: chalk.yellow },
  Archives: { icon: '📦', color: chalk.red },
  Code: { icon: '💻', color: chalk.green },
  Installers: { icon: '💿', color: chalk.hex('#f97316') },
  Others: { icon: '📁', color: chalk.gray }
};

/**
 * Print a visually polished summary of the operation
 */
export function printSummary({ moves, dryRun, totalBytes }) {
  const badge = dryRun ? chalk.bgYellow.black(' DRY RUN ') : chalk.bgGreen.black(' COMPLETED ');

  console.log('\n' + chalk.dim('╭─ ') + chalk.bold.cyan('CleanDrop Summary ') + badge + chalk.dim(' ' + '─'.repeat(24) + '╮'));

  if (moves.length === 0) {
    console.log(chalk.dim('│') + chalk.green('  ✨ Folder is already organized! No loose files found.'));
    console.log(chalk.dim('╰' + '─'.repeat(52) + '╯\n'));
    return;
  }

  // Group by category
  const categoryCounts = {};
  for (const move of moves) {
    categoryCounts[move.category] = (categoryCounts[move.category] || 0) + 1;
  }

  for (const [cat, count] of Object.entries(categoryCounts)) {
    const meta = CATEGORY_META[cat] || { icon: '📁', color: chalk.white };
    const label = `${meta.icon} ${cat}`.padEnd(16);
    console.log(chalk.dim('│') + `  ${meta.color(label)} : ${chalk.bold.white(count)} file(s)`);
  }

  console.log(chalk.dim('├' + '─'.repeat(52) + '┤'));
  console.log(chalk.dim('│') + `  📊 ${chalk.bold('Total Files')}   : ${chalk.bold.cyan(moves.length)}`);
  console.log(chalk.dim('│') + `  💾 ${chalk.bold('Total Size')}    : ${chalk.bold.cyan(formatBytes(totalBytes))}`);

  if (dryRun) {
    console.log(chalk.dim('│'));
    console.log(chalk.dim('│') + `  ${chalk.yellow('ℹ')} ${chalk.dim('Preview only. Run without --dry-run to apply changes.')}`);
  }

  console.log(chalk.dim('╰' + '─'.repeat(52) + '╯\n'));
}
