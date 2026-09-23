import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { organizeDirectory } from './organizer.js';
import { undoLastRun } from './history.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_DIR = path.resolve(__dirname, '../web');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Start the built-in CleanDrop Web UI server.
 * @param {object} [options={}]
 * @param {number} [options.port=3000]
 * @param {string} [options.targetDir]
 * @returns {Promise<http.Server>}
 */
export function startWebServer(options = {}) {
  const port = options.port || 3000;
  const initialTargetDir = options.targetDir ? path.resolve(options.targetDir) : path.join(os.homedir(), 'Downloads');

  const server = http.createServer(async (req, res) => {
    try {
      const pathname = req.url.split('?')[0];

      // API: Get System Paths & Status
      if (req.method === 'GET' && pathname === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          targetDir: initialTargetDir,
          homeDir: os.homedir(),
          defaultDownloads: path.join(os.homedir(), 'Downloads'),
          defaultDesktop: path.join(os.homedir(), 'Desktop')
        }));
        return;
      }

      // API: Scan Directory (Dry Run)
      if (req.method === 'POST' && pathname === '/api/scan') {
        const data = await readJsonBody(req);
        const target = path.resolve(data.targetDir || initialTargetDir);
        const result = await organizeDirectory(target, { dryRun: true });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          targetDir: target,
          moves: result.moves,
          totalBytes: result.totalBytes,
          preservedFolders: result.preservedFolders || []
        }));
        return;
      }

      // API: Apply Organization to Disk
      if (req.method === 'POST' && pathname === '/api/apply') {
        const data = await readJsonBody(req);
        const target = path.resolve(data.targetDir || initialTargetDir);
        const result = await organizeDirectory(target, { dryRun: false });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          targetDir: target,
          movesCount: result.moves.length,
          totalBytes: result.totalBytes,
          moves: result.moves,
          preservedFolders: result.preservedFolders || []
        }));
        return;
      }

      // API: Undo Last Run
      if (req.method === 'POST' && pathname === '/api/undo') {
        const data = await readJsonBody(req);
        const target = path.resolve(data.targetDir || initialTargetDir);
        const result = await undoLastRun(target);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        return;
      }

      const urlPath = (pathname === '/' || pathname === '') ? '/index.html' : pathname;
      const filePath = path.join(WEB_DIR, urlPath);

      if (!filePath.startsWith(WEB_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
      }

      const fileContent = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fileContent);
    } catch (err) {
      if (req.url.startsWith('/api/')) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      console.log('');
      console.log(chalk.green.bold('🧹 CleanDrop Visual Organizer is live!'));
      console.log(`  🌐 Local:   ${chalk.cyan.bold(`http://localhost:${port}`)}`);
      console.log(`  🔒 Privacy: ${chalk.white('100% Client-Side / Zero Uploads')}`);
      console.log(`  🛑 Stop:    ${chalk.gray('Press Ctrl+C to shutdown')}`);
      console.log('');
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(chalk.yellow(`Port ${port} in use, trying ${port + 1}...`));
        resolve(startWebServer({ ...options, port: port + 1 }));
      } else {
        reject(err);
      }
    });
  });
}
