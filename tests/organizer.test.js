import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { organizeDirectory } from '../src/organizer.js';
import { undoLastRun } from '../src/history.js';
import { getCategoryForExtension, formatBytes } from '../src/utils.js';

test('getCategoryForExtension maps common extensions correctly', () => {
  assert.equal(getCategoryForExtension('.png'), 'Images');
  assert.equal(getCategoryForExtension('.JPG'), 'Images');
  assert.equal(getCategoryForExtension('.pdf'), 'Documents');
  assert.equal(getCategoryForExtension('.zip'), 'Archives');
  assert.equal(getCategoryForExtension('.mp3'), 'Audio');
  assert.equal(getCategoryForExtension('.mp4'), 'Videos');
  assert.equal(getCategoryForExtension('.js'), 'Code');
  assert.equal(getCategoryForExtension('.xyz123'), 'Others');
});

test('formatBytes formats numbers correctly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1048576), '1 MB');
});

test('CleanDrop full lifecycle: Dry-Run, Organize, and Undo', async (t) => {
  // Create temporary test environment
  const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleandrop-test-'));

  try {
    // 1. Setup sample test files
    await fs.writeFile(path.join(testDir, 'sample.jpg'), 'sample image content');
    await fs.writeFile(path.join(testDir, 'invoice.pdf'), 'sample pdf content');
    await fs.writeFile(path.join(testDir, 'bundle.zip'), 'sample zip content');
    await fs.writeFile(path.join(testDir, 'script.py'), 'print("hello")');

    // 2. Test Dry Run mode
    const dryRunResult = await organizeDirectory(testDir, { dryRun: true });
    assert.equal(dryRunResult.moves.length, 4);

    // Verify files were NOT moved
    const filesAfterDryRun = await fs.readdir(testDir);
    assert.ok(filesAfterDryRun.includes('sample.jpg'));
    assert.ok(filesAfterDryRun.includes('invoice.pdf'));

    // 3. Test Actual Organization
    const actualResult = await organizeDirectory(testDir, { dryRun: false });
    assert.equal(actualResult.moves.length, 4);

    // Verify organized directory structure
    const imageExists = await fs.stat(path.join(testDir, 'Images', 'sample.jpg')).then(() => true).catch(() => false);
    const pdfExists = await fs.stat(path.join(testDir, 'Documents', 'invoice.pdf')).then(() => true).catch(() => false);
    const zipExists = await fs.stat(path.join(testDir, 'Archives', 'bundle.zip')).then(() => true).catch(() => false);
    const codeExists = await fs.stat(path.join(testDir, 'Code', 'script.py')).then(() => true).catch(() => false);

    assert.ok(imageExists, 'Images/sample.jpg should exist');
    assert.ok(pdfExists, 'Documents/invoice.pdf should exist');
    assert.ok(zipExists, 'Archives/bundle.zip should exist');
    assert.ok(codeExists, 'Code/script.py should exist');

    // 4. Test Undo functionality
    const undoResult = await undoLastRun(testDir);
    assert.ok(undoResult.success);
    assert.equal(undoResult.revertedCount, 4);

    // Verify files are restored back to root
    const filesAfterUndo = await fs.readdir(testDir);
    assert.ok(filesAfterUndo.includes('sample.jpg'));
    assert.ok(filesAfterUndo.includes('invoice.pdf'));
    assert.ok(filesAfterUndo.includes('bundle.zip'));
    assert.ok(filesAfterUndo.includes('script.py'));

    // Verify empty category folders were cleaned up
    assert.ok(!filesAfterUndo.includes('Images'));
    assert.ok(!filesAfterUndo.includes('Documents'));
  } finally {
    // Cleanup temporary test directory
    await fs.rm(testDir, { recursive: true, force: true });
  }
});
