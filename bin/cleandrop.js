#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { organizeDirectory } from '../src/organizer.js';
import { undoLastRun } from '../src/history.js';
import { printSummary } from '../src/utils.js';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
const program = new Command();

program
  .name('cleandrop')
  .description('⚡ Smart, safe, and lightning-fast downloads and desktop auto-organizer.')
  .version(pkg.version)
  .argument('[directory]', 'Target directory to organize', '.')
  .option('-d, --dry-run', 'Preview changes without actually moving any files')
  .option('-u, --undo', 'Undo the last organization run in the specified directory')
  .option('-v, --verbose', 'Print each file operation to stdout')
  .action(async (directory, options) => {
    const targetDir = path.resolve(directory);

    console.log(chalk.bold.blue(`\n📦 CleanDrop v${pkg.version}`));
    console.log(chalk.gray(`Target: ${targetDir}\n`));

    // Handle Undo
    if (options.undo) {
      const spinner = ora('Undoing previous organization...').start();
      try {
        const result = await undoLastRun(targetDir);
        if (result.success) {
          spinner.succeed(chalk.green(`Successfully restored ${result.revertedCount} of ${result.totalCount} file(s)!`));
        } else {
          spinner.warn(chalk.yellow(result.message));
        }
      } catch (err) {
        spinner.fail(chalk.red(`Undo failed: ${err.message}`));
        process.exit(1);
      }
      return;
    }

    // Handle Organization
    const spinner = ora(options.dryRun ? 'Analyzing directory (Dry Run)...' : 'Organizing files...').start();

    try {
      if (options.verbose) {
        spinner.stop();
      }

      const result = await organizeDirectory(targetDir, {
        dryRun: options.dryRun,
        verbose: options.verbose
      });

      if (!options.verbose) {
        spinner.succeed(options.dryRun ? 'Analysis complete!' : 'Directory organized successfully!');
      }

      printSummary(result);
    } catch (err) {
      if (spinner.isSpinning) {
        spinner.fail(chalk.red(`Error: ${err.message}`));
      } else {
        console.error(chalk.red(`\n❌ Error: ${err.message}`));
      }
      process.exit(1);
    }
  });

program.parse(process.argv);
