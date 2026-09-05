import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/ckeditor.js'),
      name: 'ClassicEditor',
      fileName: (format) => {
        if (format === 'umd') return 'ckeditor.js';
        if (format === 'cjs') return 'ckeditor.cjs.js';
        return `ckeditor.${format}.js`;
      },
      formats: ['umd', 'cjs', 'es']
    },
    rollupOptions: {
      output: {
        exports: 'auto',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'ckeditor.css';
          }
          return assetInfo.name;
        }
      }
    },
    cssCodeSplit: false,
    sourcemap: false,
    target: 'es2015',
    minify: 'esbuild'
  }
});
