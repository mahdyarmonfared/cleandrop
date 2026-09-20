/**
 * Default category mappings and extensions for CleanDrop
 */

export const CATEGORIES = {
  Images: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.avif', '.ico', '.bmp', '.tiff', '.raw', '.heic'
  ],
  Documents: [
    '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',
    '.xls', '.xlsx', '.csv', '.ppt', '.pptx', '.epub', '.md'
  ],
  Archives: [
    '.zip', '.rar', '.tar', '.gz', '.7z', '.bz2', '.xz', '.iso'
  ],
  Audio: [
    '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'
  ],
  Videos: [
    '.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv', '.webm', '.m4v'
  ],
  Code: [
    '.js', '.mjs', '.cjs', '.ts', '.py', '.java', '.c', '.cpp',
    '.cs', '.go', '.rs', '.php', '.rb', '.html', '.css', '.scss',
    '.json', '.xml', '.yaml', '.yml', '.sql', '.sh', '.bash'
  ],
  Installers: [
    '.deb', '.rpm', '.AppImage', '.flatpakref', '.snap',
    '.exe', '.msi', '.dmg', '.pkg', '.apk'
  ]
};

export const IGNORED_NAMES = new Set([
  '.git',
  '.cleandrop-history.json',
  'node_modules',
  '.DS_Store',
  'desktop.ini',
  'thumbs.db'
]);

export const IGNORED_EXTENSIONS = new Set([
  '.crdownload', // Chrome/Edge active downloads
  '.part',       // Firefox active downloads
  '.download',   // Safari active downloads
  '.tmp'         // Temporary files
]);

export const DEFAULT_OTHER_FOLDER = 'Others';
