import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

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

/**
 * Start the built-in CleanDrop Web UI server.
 * @param {object} [options={}]
 * @param {number} [options.port=3000]
 * @returns {Promise<http.Server>}
 */
export function startWebServer(options = {}) {
  const port = options.port || 3000;

  const server = http.createServer(async (req, res) => {
    try {
      const pathname = req.url.split('?')[0];
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
    } catch {
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
