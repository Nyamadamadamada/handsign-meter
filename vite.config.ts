import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vite.dev/config/
export default defineConfig({
  base: '/handsign-meter/',
  // https://stackoverflow.com/questions/76185469/load-onnx-model-in-browser-cant-find-wasm-file
  assetsInclude: ['**/*.onnx'],
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  plugins: [
    react(),
    tsconfigPaths(),
    // vue3 (vite) でonnxruntime-webをimportした時に出るエラーを解決する
    // https://blog.msdd.dev/posts/vue3-onnxruntime-web-create-session-error
    viteStaticCopy({
      targets: [
        {
          src: './node_modules/onnxruntime-web/dist/*.wasm',
          dest: './',
        },
      ],
    }),
  ],
});
