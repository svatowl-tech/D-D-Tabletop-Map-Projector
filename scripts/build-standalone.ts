/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Скрипт сборки автономного единого файла standalone.html
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateStandaloneHTML } from '../src/utils/standaloneGenerator';

const rootDir = process.cwd();
const outputPath = path.join(rootDir, 'standalone.html');

console.log('⚡ Generating standalone single-file HTML application...');
const htmlContent = generateStandaloneHTML();
fs.writeFileSync(outputPath, htmlContent, 'utf-8');

const stats = fs.statSync(outputPath);
const sizeKb = (stats.size / 1024).toFixed(2);
console.log(`✅ Standalone single-file HTML created at ${outputPath} (${sizeKb} KB)`);
