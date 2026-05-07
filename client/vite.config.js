import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'game-engine': [
            './src/game/GameEngine.js',
            './src/game/Dino.js',
            './src/game/Obstacle.js',
            './src/game/Ground.js',
            './src/game/Cloud.js',
            './src/game/ScoreManager.js'
          ],
          'vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
