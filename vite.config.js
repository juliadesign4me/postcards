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

function copyStaticAssets(){
  return {
    name: 'copy-static-assets',
    closeBundle(){
      const outDir = resolve(__dirname, 'dist/assets');
      mkdirSync(outDir, { recursive: true });

      for(const name of LEGACY_SCRIPT_NAMES){
        cpSync(
          resolve(__dirname, `assets/${name}.js`),
          resolve(outDir, `${name}.js`),
        );
      }

      // Welcome preview images are referenced as plain paths in HTML/inline JS
      // (style switch), not as ES imports — copy them verbatim into dist.
      cpSync(
        resolve(__dirname, 'assets/welcome'),
        resolve(outDir, 'welcome'),
        { recursive: true },
      );
    },
  };
}

export default defineConfig({
  root: '.',
  envDir: '.',
  plugins: [copyStaticAssets()],
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
