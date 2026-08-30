/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Скрипт полной сборки и упаковки релизных артефактов для GitHub Releases:
 * - Windows Portable (.zip)
 * - macOS Portable (.zip)
 * - Linux Portable (.tar.gz и .zip)
 * - Web SPA Distribution (.zip)
 * - Raw Standalone Single-File (.html)
 * - Криптографические контрольные суммы SHA256 (SHA256SUMS.txt)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const { ZipArchive, TarArchive } = require('archiver');

const rootDir = process.cwd();
const releaseDir = path.join(rootDir, 'release-artifacts');
const templatesDir = path.join(rootDir, 'scripts', 'templates');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version || '1.0.0';

console.log(`\n======================================================`);
console.log(`📦 PACKAGING VTT-ZERO RELEASE v${version}`);
console.log(`======================================================\n`);

// 1. Очистка и создание директории релизов
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true, force: true });
}
fs.mkdirSync(releaseDir, { recursive: true });

// 2. Сборка standalone single-file HTML (Полный React SPA, 1:1 соответствующий превью)
console.log('🔹 1/5 Building standalone single-file HTML (Full React App)...');
execSync('npx vite build', {
  stdio: 'inherit',
  cwd: rootDir,
  env: { ...process.env, BUILD_STANDALONE: 'true' }
});

const distStandaloneHtml = path.join(rootDir, 'dist-standalone', 'index.html');
if (!fs.existsSync(distStandaloneHtml)) {
  console.error('❌ Error: dist-standalone/index.html not found after build!');
  process.exit(1);
}

const standaloneContent = fs.readFileSync(distStandaloneHtml, 'utf-8');
const standalonePath = path.join(rootDir, 'standalone.html');
fs.writeFileSync(standalonePath, standaloneContent, 'utf-8');

const standaloneReleaseFile = `vtt-zero-v${version}-standalone.html`;
fs.writeFileSync(path.join(releaseDir, standaloneReleaseFile), standaloneContent, 'utf-8');
fs.writeFileSync(path.join(releaseDir, 'vtt-zero-standalone.html'), standaloneContent, 'utf-8');
console.log(`   ✓ Standalone HTML generated (${(standaloneContent.length / 1024).toFixed(1)} KB)`);

// 3. Сборка Vite Web SPA (Многофайловый веб-билд в dist)
console.log('\n🔹 2/5 Building Vite Web SPA (npm run build)...');
execSync('npx vite build', {
  stdio: 'inherit',
  cwd: rootDir,
  env: { ...process.env, BUILD_STANDALONE: 'false' }
});
console.log('   ✓ Vite production build finished.');

// Вспомогательная функция создания Zip архива
function createZipArchive(outputPath: string, files: { source: string; name: string }[], folder?: { dir: string; destFolder: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err: any) => reject(err));

    archive.pipe(output);

    files.forEach(f => {
      if (fs.existsSync(f.source)) {
        archive.file(f.source, { name: f.name });
      }
    });

    if (folder && fs.existsSync(folder.dir)) {
      archive.directory(folder.dir, folder.destFolder || false);
    }

    archive.finalize();
  });
}

// Вспомогательная функция создания Tar.Gz архива
function createTarGzArchive(outputPath: string, files: { source: string; name: string }[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = new TarArchive({ gzip: true, gzipOptions: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err: any) => reject(err));

    archive.pipe(output);

    files.forEach(f => {
      if (fs.existsSync(f.source)) {
        // Устанавливаем права исполняемого файла для скриптов в tar.gz
        const isExec = f.name.endsWith('.sh') || f.name.endsWith('.command');
        archive.file(f.source, { 
          name: f.name,
          mode: isExec ? 0o755 : 0o644
        });
      }
    });

    archive.finalize();
  });
}

async function packageAll() {
  // 4. Упаковка платформ
  console.log('\n🔹 3/5 Creating Platform-Specific Portable Packages...');

  // --- WINDOWS ---
  const winZipName = `vtt-zero-v${version}-windows-portable.zip`;
  console.log(`   - Packaging ${winZipName}...`);
  await createZipArchive(
    path.join(releaseDir, winZipName),
    [
      { source: standalonePath, name: 'vtt-zero.html' },
      { source: path.join(templatesDir, 'windows', 'launch-dm.bat'), name: 'launch-dm.bat' },
      { source: path.join(templatesDir, 'windows', 'launch-projector.bat'), name: 'launch-projector.bat' },
      { source: path.join(templatesDir, 'windows', 'start-dual-screen.bat'), name: 'start-dual-screen.bat' },
      { source: path.join(templatesDir, 'windows', 'README.txt'), name: 'README.txt' },
      { source: path.join(rootDir, 'LICENSE'), name: 'LICENSE.txt' }
    ]
  );

  // --- MACOS ---
  const macZipName = `vtt-zero-v${version}-macos-portable.zip`;
  console.log(`   - Packaging ${macZipName}...`);
  await createZipArchive(
    path.join(releaseDir, macZipName),
    [
      { source: standalonePath, name: 'vtt-zero.html' },
      { source: path.join(templatesDir, 'macos', 'launch-dm.command'), name: 'launch-dm.command' },
      { source: path.join(templatesDir, 'macos', 'launch-projector.command'), name: 'launch-projector.command' },
      { source: path.join(templatesDir, 'macos', 'start-dual-screen.command'), name: 'start-dual-screen.command' },
      { source: path.join(templatesDir, 'macos', 'README.txt'), name: 'README.txt' },
      { source: path.join(rootDir, 'LICENSE'), name: 'LICENSE.txt' }
    ]
  );

  // --- LINUX (TAR.GZ + ZIP) ---
  const linuxTarName = `vtt-zero-v${version}-linux-portable.tar.gz`;
  const linuxZipName = `vtt-zero-v${version}-linux-portable.zip`;
  console.log(`   - Packaging ${linuxTarName} & ${linuxZipName}...`);
  const linuxFiles = [
    { source: standalonePath, name: 'vtt-zero.html' },
    { source: path.join(templatesDir, 'linux', 'launch-dm.sh'), name: 'launch-dm.sh' },
    { source: path.join(templatesDir, 'linux', 'launch-projector.sh'), name: 'launch-projector.sh' },
    { source: path.join(templatesDir, 'linux', 'start-dual-screen.sh'), name: 'start-dual-screen.sh' },
    { source: path.join(templatesDir, 'linux', 'vtt-zero.desktop'), name: 'vtt-zero.desktop' },
    { source: path.join(templatesDir, 'linux', 'README.txt'), name: 'README.txt' },
    { source: path.join(rootDir, 'LICENSE'), name: 'LICENSE.txt' }
  ];
  await createTarGzArchive(path.join(releaseDir, linuxTarName), linuxFiles);
  await createZipArchive(path.join(releaseDir, linuxZipName), linuxFiles);

  // --- WEB SPA DIST ---
  const webDistZipName = `vtt-zero-v${version}-web-dist.zip`;
  console.log(`   - Packaging ${webDistZipName}...`);
  await createZipArchive(
    path.join(releaseDir, webDistZipName),
    [
      { source: path.join(rootDir, 'LICENSE'), name: 'LICENSE' },
      { source: path.join(rootDir, 'README.md'), name: 'README.md' }
    ],
    { dir: path.join(rootDir, 'dist'), destFolder: '' }
  );

  // 5. Генерация SHA256 контрольных сумм
  console.log('\n🔹 4/5 Generating SHA256 Checksums...');
  const releaseFiles = fs.readdirSync(releaseDir).filter(f => f !== 'SHA256SUMS.txt');
  const checksumLines: string[] = [];

  for (const fileName of releaseFiles) {
    const filePath = path.join(releaseDir, fileName);
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    checksumLines.push(`${hash}  ${fileName}`);
  }

  const checksumsContent = checksumLines.join('\n') + '\n';
  fs.writeFileSync(path.join(releaseDir, 'SHA256SUMS.txt'), checksumsContent, 'utf-8');
  console.log('   ✓ SHA256SUMS.txt created.');

  // 6. Итоговый отчет
  console.log('\n======================================================');
  console.log('🎉 RELEASE ARTIFACTS CREATED SUCCESSFULLY:');
  console.log('======================================================');
  
  const allFinalFiles = fs.readdirSync(releaseDir);
  for (const file of allFinalFiles) {
    const stat = fs.statSync(path.join(releaseDir, file));
    const size = (stat.size / 1024).toFixed(1);
    console.log(`  📦 ${file.padEnd(46)} ${size.padStart(8)} KB`);
  }
  console.log('======================================================\n');
}

packageAll().catch(err => {
  console.error('❌ Error packaging releases:', err);
  process.exit(1);
});
