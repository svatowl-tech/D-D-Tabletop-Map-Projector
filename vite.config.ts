import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import browserslist from 'browserslist';
import { browserslistToTargets } from 'lightningcss';

export default defineConfig(() => {
  const isStandalone = process.env.BUILD_STANDALONE === 'true';
  const targets = browserslistToTargets(
    browserslist('safari >= 11, chrome >= 60, firefox >= 60, ios >= 11')
  );

  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      ...(isStandalone ? [viteSingleFile()] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    css: {
      transformer: 'lightningcss',
      lightningcss: {
        targets,
      },
    },
    build: {
      outDir: isStandalone ? 'dist-standalone' : 'dist',
      emptyOutDir: true,
      target: ['es2018', 'safari11', 'chrome60', 'firefox60'],
      cssTarget: ['safari11', 'chrome60'],
      cssMinify: 'lightningcss',
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
