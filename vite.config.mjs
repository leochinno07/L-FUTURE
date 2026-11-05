import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const frontendRoot = fileURLToPath(new URL('./frontend', import.meta.url));
const outputRoot = resolve(frontendRoot, 'dist');
const backendTarget = process.env.LF_BACKEND_URL || 'http://127.0.0.1:5000';
const apiProxy = {
  '/api': {
    target: backendTarget,
    changeOrigin: true
  }
};
const htmlInputs = readdirSync(frontendRoot, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.html'))
  .map(entry => resolve(frontendRoot, entry.name));

function copyStaticFiles(sourceRoot, destinationRoot) {
  mkdirSync(destinationRoot, { recursive: true });
  for (const entry of readdirSync(sourceRoot, { withFileTypes: true })) {
    if (entry.name === 'dist' || entry.name.endsWith('.html')) continue;
    const sourcePath = resolve(sourceRoot, entry.name);
    const destinationPath = resolve(destinationRoot, entry.name);
    if (entry.isDirectory()) {
      copyStaticFiles(sourcePath, destinationPath);
    } else {
      cpSync(sourcePath, destinationPath);
    }
  }
}

export default defineConfig({
  root: frontendRoot,
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  plugins: [{
    name: 'copy-static-frontend-files',
    apply: 'build',
    closeBundle() {
      copyStaticFiles(frontendRoot, outputRoot);
    }
  }],
  build: {
    rollupOptions: {
      input: htmlInputs
    }
  }
});