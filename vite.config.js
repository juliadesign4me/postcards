import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: '.',
  envDir: '.',
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
