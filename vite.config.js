import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/** Classic scripts referenced via <script src> (not ES modules) — Vite does not bundle these. */
const LEGACY_SCRIPT_NAMES = [
  'frame-background',
  'retro-filter',
  'page-theme',
  'immersive',
];

function copyLegacyScripts(){
  return {
    name: 'copy-legacy-scripts',
    closeBundle(){
      const outDir = resolve(__dirname, 'dist/assets');
      mkdirSync(outDir, { recursive: true });
      for(const name of LEGACY_SCRIPT_NAMES){
        cpSync(
          resolve(__dirname, `assets/${name}.js`),
          resolve(outDir, `${name}.js`),
        );
      }
    },
  };
}

export default defineConfig({
  root: '.',
  envDir: '.',
  plugins: [copyLegacyScripts()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        create: resolve(__dirname, 'postcard-create.html'),
        share: resolve(__dirname, 'postcard-share.html'),
        view: resolve(__dirname, 'postcard-view.html'),
        postcard: resolve(__dirname, 'postcard.html'),
      },
    },
  },
});
