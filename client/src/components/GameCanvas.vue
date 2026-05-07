<template>
  <div class="game-container" ref="gameContainer">
    <canvas 
      ref="gameCanvas" 
      :width="canvasWidth" 
      :height="canvasHeight"
      class="game-canvas"
    ></canvas>
    
    <!-- Game stats overlay -->
    <div v-if="gameStats" class="game-stats">
      <span class="stat">🏃 {{ gameStats.speed }}</span>
      <span class="stat">📏 {{ gameStats.distance }}m</span>
      <span class="stat">⚡ x{{ gameStats.multiplier }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { GameEngine } from '../game/GameEngine.js';

const emit = defineEmits(['scoreUpdate', 'gameOver', 'gameStart']);

const gameContainer = ref(null);
const gameCanvas = ref(null);
const canvasWidth = ref(800);
const canvasHeight = ref(400);
const gameStats = ref(null);

let gameEngine = null;
let resizeObserver = null;

onMounted(() => {
  // Set canvas size based on container
  updateCanvasSize();
  
  // Create game engine
  gameEngine = new GameEngine(gameCanvas.value, {
    onScoreUpdate: (score) => {
      emit('scoreUpdate', score);
      updateGameStats();
    },
    onGameOver: (finalStats) => {
      emit('gameOver', finalStats);
      gameStats.value = null;
    },
    onGameStart: () => {
      emit('gameStart');
      gameStats.value = {
        speed: '10 km/h',
        distance: '0m',
        multiplier: '1.0'
      };
    }
  });
  
  // Start game loop
  gameEngine.start();
  
  // Handle window resize
  resizeObserver = new ResizeObserver(() => {
    updateCanvasSize();
  });
  resizeObserver.observe(gameContainer.value);
  
  // Keyboard controls for external buttons
  window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  if (gameEngine) {
    gameEngine.stop();
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  window.removeEventListener('keydown', handleKeyPress);
});

function updateCanvasSize() {
  if (gameContainer.value) {
    const containerWidth = gameContainer.value.clientWidth;
    canvasWidth.value = Math.min(containerWidth, 800);
    canvasHeight.value = Math.floor(canvasWidth.value * 0.5);
    
    if (gameEngine && gameCanvas.value) {
      gameEngine.resize(canvasWidth.value, canvasHeight.value);
    }
  }
}

function updateGameStats() {
  if (gameEngine) {
    const stats = gameEngine.scoreManager.getStats();
    gameStats.value = {
      speed: `${Math.floor(gameEngine.gameSpeed * 10) + 10} km/h`,
      distance: `${stats.distance}m`,
      multiplier: stats.multiplier
    };
  }
}

function handleKeyPress(e) {
  // Allow external buttons to control game
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
  }
}

// Expose methods for parent components
defineExpose({
  getScore: () => gameEngine ? gameEngine.getScore() : 0,
  restart: () => gameEngine ? gameEngine.restartGame() : null,
  pause: () => gameEngine ? gameEngine.togglePause() : null
});
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.game-canvas {
  display: block;
  width: 100%;
  height: auto;
  cursor: pointer;
}

.game-stats {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 15px;
  z-index: 10;
}

.stat {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  backdrop-filter: blur(5px);
}
</style>