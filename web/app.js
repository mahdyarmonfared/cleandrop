/**
 * CleanDrop Web UI
 * 100% Client-Side Visual Folder Organizer & Clutter Cleaner
 */

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const loadDemoBtn = document.getElementById('loadDemoBtn');
const clearBtn = document.getElementById('clearBtn');
const metricsBar = document.getElementById('metricsBar');
const statTotalFiles = document.getElementById('statTotalFiles');
const statTotalSize = document.getElementById('statTotalSize');
const statCategories = document.getElementById('statCategories');
const categoriesGrid = document.getElementById('categoriesGrid');
const downloadZipBtn = document.getElementById('downloadZipBtn');

let organizedFiles = [];

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

dropZone.addEventListener('drop', (e) => {
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) organizeFiles(files);
});

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) organizeFiles(files);
});

function organizeFiles(files) {
  const groups = new Map();
  let totalBytes = 0;

  files.forEach(f => {
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

  organizedFiles = files;
  renderGrid(Array.from(groups.values()), files.length, totalBytes);
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
          <span class="file-name" title="${file.name}">${file.name}</span>
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
  organizedFiles = [];
  metricsBar.classList.add('hidden');
  categoriesGrid.classList.add('hidden');
  fileInput.value = '';
});

// Auto-trigger for URL query parameters (e.g. for screenshots)
const params = new URLSearchParams(window.location.search);
if (params.has('demo')) {
  setTimeout(() => loadDemoBtn?.click(), 100);
}

