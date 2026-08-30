/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Скрипт сборки автономного единого файла standalone.html (полный React SPA).
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const distStandaloneDir = path.join(rootDir, 'dist-standalone');
const outputPath = path.join(rootDir, 'standalone.html');

console.log('⚡ Generating standalone single-file React HTML application with Vite...');

execSync('npx vite build', {
  stdio: 'inherit',
  cwd: rootDir,
  env: { ...process.env, BUILD_STANDALONE: 'true' }
});

const generatedHtmlPath = path.join(distStandaloneDir, 'index.html');
if (fs.existsSync(generatedHtmlPath)) {
  fs.copyFileSync(generatedHtmlPath, outputPath);
  const stats = fs.statSync(outputPath);
  const sizeKb = (stats.size / 1024).toFixed(2);
  console.log(`✅ Standalone single-file HTML created at ${outputPath} (${sizeKb} KB)`);
} else {
  console.error('❌ Error: Failed to locate dist-standalone/index.html after build');
  process.exit(1);
}
