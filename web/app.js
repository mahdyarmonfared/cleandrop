/**
 * CleanDrop Web UI
 * Visual Folder Organizer & Clutter Cleaner
 * Supports both Client-Side Drag-and-Drop and Direct System Disk Organization
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const browseFolderBtn = document.getElementById('browseFolderBtn');
const browseFilesBtn = document.getElementById('browseFilesBtn');
const loadDemoBtn = document.getElementById('loadDemoBtn');
const clearBtn = document.getElementById('clearBtn');
const metricsBar = document.getElementById('metricsBar');
const statTotalFiles = document.getElementById('statTotalFiles');
const statTotalSize = document.getElementById('statTotalSize');
const statCategories = document.getElementById('statCategories');
const categoriesGrid = document.getElementById('categoriesGrid');
const downloadZipBtn = document.getElementById('downloadZipBtn');

// Disk Organizer elements
const targetDirInput = document.getElementById('targetDirInput');
const presetDownloads = document.getElementById('presetDownloads');
const presetDesktop = document.getElementById('presetDesktop');
const scanDiskBtn = document.getElementById('scanDiskBtn');
const applyDiskBtn = document.getElementById('applyDiskBtn');
const applyFromBarBtn = document.getElementById('applyFromBarBtn');
const undoDiskBtn = document.getElementById('undoDiskBtn');
const diskStatusMsg = document.getElementById('diskStatusMsg');

let accumulatedFiles = [];
let organizedFiles = [];
let defaultPaths = {};

const CATEGORIES = {
  Images: {
    icon: '🖼️',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'avif'],
  },
  Documents: {
    icon: '📄',
    extensions: ['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'xls', 'csv', 'pptx', 'ppt'],
  },
  Archives: {
    icon: '📦',
    extensions: ['zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'tgz'],
  },
  Code: {
    icon: '💻',
    extensions: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'json', 'sh', 'rs', 'go', 'yaml', 'yml'],
  },
  Media: {
    icon: '🎵',
    extensions: ['mp3', 'mp4', 'wav', 'mov', 'mkv', 'flac', 'm4a', 'webm'],
  },
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getCategory(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  for (const [catName, catData] of Object.entries(CATEGORIES)) {
    if (catData.extensions.includes(ext)) {
      return { name: catName, icon: catData.icon };
    }
  }
  return { name: 'Other', icon: '📁' };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Recursive entry reader for folder drag-and-drop
async function getAllFileEntries(dataTransferItemList) {
  const fileList = [];
  const queue = [];

  for (let i = 0; i < dataTransferItemList.length; i++) {
    const item = dataTransferItemList[i];
    if (item.webkitGetAsEntry) {
      const entry = item.webkitGetAsEntry();
      if (entry) queue.push(entry);
    } else if (item.getAsFile) {
      const file = item.getAsFile();
      if (file) fileList.push(file);
    }
  }

  while (queue.length > 0) {
    const entry = queue.shift();
    if (entry.isFile) {
      await new Promise((resolve) => {
        entry.file((file) => {
          fileList.push(file);
          resolve();
        }, () => resolve());
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const readBatch = () => new Promise((resolve) => {
        reader.readEntries((entries) => resolve(entries), () => resolve([]));
      });
      let entries;
      do {
        entries = await readBatch();
        for (const child of entries) {
          queue.push(child);
        }
      } while (entries && entries.length > 0);
    }
  }

  return fileList;
}

// Drag & drop handlers
['dragenter', 'dragover'].forEach(name => {
  dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-active');
  });
});

['dragleave', 'drop'].forEach(name => {
  dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-active');
  });
});

dropZone.addEventListener('drop', async (e) => {
  let files = [];
  if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    files = await getAllFileEntries(e.dataTransfer.items);
  } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    files = Array.from(e.dataTransfer.files);
  }
  if (files.length > 0) organizeFiles(files);
});

// Click handlers for buttons & inputs
browseFolderBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  folderInput.click();
});

browseFilesBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

dropZone.addEventListener('click', (e) => {
  if (!e.target.closest('button')) {
    folderInput.click();
  }
});

folderInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) organizeFiles(files);
  folderInput.value = '';
});

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) organizeFiles(files);
  fileInput.value = '';
});

/**
 * Organizes files into categories, accumulating new selections
 */
function organizeFiles(files) {
  // Merge new files into accumulatedFiles (deduplicating identical entries)
  const existingKeys = new Set(accumulatedFiles.map(f => `${f.name}-${f.size}-${f.lastModified || 0}`));
  for (const f of files) {
    const key = `${f.name}-${f.size}-${f.lastModified || 0}`;
    if (!existingKeys.has(key)) {
      accumulatedFiles.push(f);
      existingKeys.add(key);
    }
  }

  const groups = new Map();
  let totalBytes = 0;

  accumulatedFiles.forEach(f => {
    const cat = getCategory(f.name);
    if (!groups.has(cat.name)) {
      groups.set(cat.name, {
        name: cat.name,
        icon: cat.icon,
        totalBytes: 0,
        files: [],
      });
    }
    groups.get(cat.name).files.push(f);
    groups.get(cat.name).totalBytes += f.size;
    totalBytes += f.size;
  });

  organizedFiles = accumulatedFiles;
  renderGrid(Array.from(groups.values()), accumulatedFiles.length, totalBytes);
}

function renderGrid(groups, totalCount, totalBytes) {
  metricsBar.classList.remove('hidden');
  categoriesGrid.classList.remove('hidden');

  statTotalFiles.textContent = totalCount;
  statTotalSize.textContent = formatBytes(totalBytes);
  statCategories.textContent = groups.length;

  categoriesGrid.innerHTML = '';

  groups.forEach(group => {
    const card = document.createElement('div');
    card.className = 'category-card';

    let filesHtml = '';
    group.files.forEach(file => {
      filesHtml += `
        <div class="file-item">
          <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
          <span class="file-size">${formatBytes(file.size)}</span>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="category-header">
        <div class="category-title-group">
          <span class="category-icon">${group.icon}</span>
          <span class="category-name">${group.name}</span>
        </div>
        <span class="category-count">${group.files.length} file(s) • ${formatBytes(group.totalBytes)}</span>
      </div>
      <div class="file-list">
        ${filesHtml}
      </div>
    `;

    categoriesGrid.appendChild(card);
  });
}

// Quick Demo Generator
loadDemoBtn.addEventListener('click', () => {
  const demoFiles = [
    new File(['dummy image content'], 'holiday_photo_2026.jpg', { type: 'image/jpeg' }),
    new File(['dummy logo vector'], 'company_logo.svg', { type: 'image/svg+xml' }),
    new File(['invoice details'], 'Q3_Invoice_Financials.pdf', { type: 'application/pdf' }),
    new File(['meeting notes'], 'Project_Sprint_Notes.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    new File(['compressed archive'], 'database_backup_august.zip', { type: 'application/zip' }),
    new File(['python script'], 'data_pipeline.py', { type: 'text/x-python' }),
    new File(['react component'], 'NavbarComponent.jsx', { type: 'text/javascript' }),
    new File(['podcast audio'], 'tech_talk_episode_42.mp3', { type: 'audio/mpeg' }),
    new File(['spreadsheet'], 'annual_revenue_2026.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  ];

  organizeFiles(demoFiles);
});

// Download Organized ZIP
downloadZipBtn.addEventListener('click', async () => {
  if (organizedFiles.length === 0) return;

  const originalText = downloadZipBtn.textContent;
  downloadZipBtn.textContent = '⏳ Creating Organized ZIP...';
  downloadZipBtn.disabled = true;

  try {
    const zip = new JSZip();

    for (const file of organizedFiles) {
      const cat = getCategory(file.name);
      zip.folder(cat.name).file(file.name, file);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'CleanDrop_Organized_Files.zip';
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error('ZIP generation error:', err);
    alert('Failed to generate ZIP.');
  } finally {
    downloadZipBtn.textContent = originalText;
    downloadZipBtn.disabled = false;
  }
});

clearBtn.addEventListener('click', () => {
  accumulatedFiles = [];
  organizedFiles = [];
  metricsBar.classList.add('hidden');
  categoriesGrid.classList.add('hidden');
  categoriesGrid.innerHTML = '';
  fileInput.value = '';
  folderInput.value = '';
  if (diskStatusMsg) diskStatusMsg.classList.add('hidden');
});

// System Disk Organizer Integration
async function initSystemStatus() {
  try {
    const res = await fetch('/api/status');
    if (res.ok) {
      defaultPaths = await res.json();
      if (targetDirInput && !targetDirInput.value) {
        targetDirInput.value = defaultPaths.targetDir || defaultPaths.defaultDownloads || '';
      }
    }
  } catch {
    // Statically hosted
  }
}
initSystemStatus();

if (presetDownloads) {
  presetDownloads.addEventListener('click', () => {
    if (defaultPaths.defaultDownloads) {
      targetDirInput.value = defaultPaths.defaultDownloads;
      scanDiskFolder();
    }
  });
}

if (presetDesktop) {
  presetDesktop.addEventListener('click', () => {
    if (defaultPaths.defaultDesktop) {
      targetDirInput.value = defaultPaths.defaultDesktop;
      scanDiskFolder();
    }
  });
}

function showDiskStatus(message, type = 'success') {
  if (!diskStatusMsg) return;
  diskStatusMsg.className = `disk-status-msg ${type}`;
  diskStatusMsg.innerHTML = message;
  diskStatusMsg.classList.remove('hidden');
}

async function scanDiskFolder() {
  const targetDir = targetDirInput.value.trim();
  if (!targetDir) return;
  scanDiskBtn.disabled = true;
  scanDiskBtn.textContent = 'Scanning...';

  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDir })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to scan folder');

    if (data.moves.length === 0) {
      showDiskStatus(`✨ Folder <strong>${escapeHtml(data.targetDir)}</strong> is already clean! No loose files found.`, 'success');
      accumulatedFiles = [];
      metricsBar.classList.add('hidden');
      categoriesGrid.classList.add('hidden');
    } else {
      showDiskStatus(`Found <strong>${data.moves.length}</strong> loose file(s) in <strong>${escapeHtml(data.targetDir)}</strong> (${formatBytes(data.totalBytes)}) ready to organize.`, 'success');
      const mockFiles = data.moves.map(m => ({
        name: m.name,
        size: m.size || 1024,
        lastModified: Date.now()
      }));
      accumulatedFiles = [];
      organizeFiles(mockFiles);
    }
  } catch (err) {
    showDiskStatus(`❌ Scan error: ${escapeHtml(err.message)}`, 'error');
  } finally {
    scanDiskBtn.disabled = false;
    scanDiskBtn.textContent = '🔍 Scan Folder';
  }
}

async function applyDiskChanges() {
  const targetDir = targetDirInput.value.trim();
  if (!targetDir) {
    alert('Please enter or select a folder path.');
    return;
  }
  applyDiskBtn.disabled = true;
  applyDiskBtn.textContent = 'Applying...';
  if (applyFromBarBtn) applyFromBarBtn.disabled = true;

  try {
    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDir })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to apply organization');

    if (data.movesCount === 0) {
      showDiskStatus(`✨ Folder is already organized! No loose files moved.`, 'success');
    } else {
      showDiskStatus(`🎉 <strong>Success!</strong> Organized <strong>${data.movesCount} file(s)</strong> (${formatBytes(data.totalBytes)}) directly on your computer into Images, Documents, etc. <button type="button" class="preset-btn" style="margin-left:8px" id="inlineUndoBtn">↩️ Undo Changes</button>`, 'success');
      const inlineUndoBtn = document.getElementById('inlineUndoBtn');
      if (inlineUndoBtn) inlineUndoBtn.addEventListener('click', undoDiskChanges);
      scanDiskFolder();
    }
  } catch (err) {
    showDiskStatus(`❌ Error applying changes: ${escapeHtml(err.message)}`, 'error');
  } finally {
    applyDiskBtn.disabled = false;
    applyDiskBtn.textContent = '⚡ Apply Changes to Disk';
    if (applyFromBarBtn) applyFromBarBtn.disabled = false;
  }
}

async function undoDiskChanges() {
  const targetDir = targetDirInput.value.trim();
  if (!targetDir) return;
  undoDiskBtn.disabled = true;
  undoDiskBtn.textContent = 'Undoing...';

  try {
    const res = await fetch('/api/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDir })
    });
    const data = await res.json();
    if (!data.success) {
      showDiskStatus(`ℹ️ ${escapeHtml(data.message || 'No actions to undo.')}`, 'error');
    } else {
      showDiskStatus(`↩️ <strong>Restored!</strong> Successfully moved <strong>${data.revertedCount} file(s)</strong> back to their original locations.`, 'success');
      scanDiskFolder();
    }
  } catch (err) {
    showDiskStatus(`❌ Undo error: ${escapeHtml(err.message)}`, 'error');
  } finally {
    undoDiskBtn.disabled = false;
    undoDiskBtn.textContent = '↩️ Undo';
  }
}

if (scanDiskBtn) scanDiskBtn.addEventListener('click', scanDiskFolder);
if (applyDiskBtn) applyDiskBtn.addEventListener('click', applyDiskChanges);
if (applyFromBarBtn) applyFromBarBtn.addEventListener('click', applyDiskChanges);
if (undoDiskBtn) undoDiskBtn.addEventListener('click', undoDiskChanges);

// Auto-trigger for URL query parameters (e.g. for screenshots)
const params = new URLSearchParams(window.location.search);
if (params.has('demo')) {
  setTimeout(() => loadDemoBtn?.click(), 100);
}
