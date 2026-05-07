<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="title-emoji">🦕</span>
          Dino Runner
          <span class="title-emoji">🦖</span>
        </h1>
        
        <p class="hero-subtitle">
          Outrun extinction! How long can you survive?
        </p>
        <router-link to="/leaderboard" class="nav-link" active-class="active">
          <span class="link-icon">🏆</span>
          Leaderboard
        </router-link>
        <router-link to="/profile" class="dropdown-item" @click="menuOpen = false">
              👤 View Profile
            </router-link>
         <router-link to="/play" class="back-btn">
        <span class="back-arrow">⬅️</span>
        <span>Back to Game</span>
      </router-link>   
        
        <!-- Loading Screen -->
        <LoadingScreen 
          ref="loadingScreen"
          :visible="loading"
          @skip="skipLoading"
        />
        
        <!-- Game Section -->
        <div v-show="!loading" class="game-section">
          <GameCanvas 
            ref="gameCanvas"
            @score-update="handleScoreUpdate"
            @game-over="handleGameOver"
            @game-start="handleGameStart"
          />
          
          <!-- Game Over Modal -->
          <div v-if="gameOver" class="game-over-overlay">
            <div class="game-over-card">
              <div class="game-over-emoji">💀</div>
              <h2>Game Over!</h2>
              
              <div class="final-stats">
                <div class="final-score">
                  <span class="stat-label">Score</span>
                  <span class="stat-value">{{ finalScore }}</span>
                </div>
                <div class="final-time">
                  <span class="stat-label">Survival Time</span>
                  <span class="stat-value">{{ finalTime }}</span>
                </div>
                <div class="final-distance">
                  <span class="stat-label">Distance</span>
                  <span class="stat-value">{{ finalDistance }}m</span>
                </div>
              </div>
              
              <div v-if="isNewHighScore" class="new-highscore">
                🎉 New High Score! 🎉
              </div>
              
              <div class="game-over-actions">
                <button class="play-again-btn" @click="restartGame">
                  🔄 Play Again
                </button>
                <button 
                  v-if="!isLoggedIn" 
                  class="save-score-btn"
                  @click="$emit('loginRequired')"
                >
                  👤 Login to Save Score
                </button>
              </div>
            </div>
          </div>
          
          <!-- Game Controls Info -->
          <div v-if="!gameStarted && !gameOver" class="controls-info">
            <div class="control-item">
              <kbd>↑</kbd> or <kbd>Space</kbd>
              <span>Jump</span>
            </div>
            <div class="control-item">
              <kbd>↓</kbd>
              <span>Duck</span>
            </div>
            <div class="control-item">
              <kbd>P</kbd>
              <span>Pause</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Features Section -->
    <section class="features">
      <div class="feature-card">
        <div class="feature-icon">🎮</div>
        <h3>Play Anywhere</h3>
        <p>Works offline! Play even without internet connection</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🏆</div>
        <h3>Global Leaderboard</h3>
        <p>Compete with friends and players worldwide</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🦖</div>
        <h3>Classic Gameplay</h3>
        <p>Simple, addictive, and endlessly challenging</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import GameCanvas from '../components/GameCanvas.vue';
import LoadingScreen from '../components/LoadingScreen.vue';

const props = defineProps({
  username: String,
  isLoggedIn: Boolean,
  isOnline: Boolean
});

const emit = defineEmits(['loginRequired', 'scoreSubmitted']);

const loading = ref(true);
const gameStarted = ref(false);
const gameOver = ref(false);
const finalScore = ref(0);
const finalTime = ref('0s');
const finalDistance = ref(0);
const isNewHighScore = ref(false);
const loadingScreen = ref(null);
const gameCanvas = ref(null);

onMounted(async () => {
  simulateLoading();
});

async function simulateLoading() {
  const steps = [
    { label: 'Loading game assets', done: false, active: true },
    { label: 'Preparing game engine', done: false, active: false },
    { label: 'Ready to play!', done: false, active: false }
  ];
  
  // Step 1: Load assets
  await new Promise(resolve => setTimeout(resolve, 500));
  loadingScreen.value?.updateStep(0, { done: true, active: false });
  loadingScreen.value?.updateStep(1, { done: false, active: true });
  
  // Step 2: Prepare engine
  await new Promise(resolve => setTimeout(resolve, 800));
  loadingScreen.value?.updateStep(1, { done: true, active: false });
  loadingScreen.value?.updateStep(2, { done: false, active: true });
  
  // Step 3: Ready
  await new Promise(resolve => setTimeout(resolve, 400));
  loadingScreen.value?.updateStep(2, { done: true, active: false });
  loadingScreen.value?.setComplete();
  
  setTimeout(() => {
    loading.value = false;
  }, 500);
}

function skipLoading() {
  loading.value = false;
}

function handleScoreUpdate(score) {
  // Real-time score updates (if needed)
}

function handleGameStart() {
  gameStarted.value = true;
  gameOver.value = false;
}

function handleGameOver(stats) {
  gameOver.value = true;
  finalScore.value = Math.floor(stats.score);
  finalTime.value = formatTime(stats.survivalTime);
  finalDistance.value = Math.floor(stats.distance);
  
  // Check if new high score
  const oldHighScore = localStorage.getItem('dinoHighScore') || 0;
  isNewHighScore.value = stats.score > oldHighScore;
  
  // Save score locally
  const scores = JSON.parse(localStorage.getItem('localScores') || '[]');
  scores.push({
    username: props.username || 'Anonymous',
    score: stats.score,
    survivalTime: stats.survivalTime,
    distance: stats.distance,
    timestamp: Date.now()
  });
  localStorage.setItem('localScores', JSON.stringify(scores.slice(-50)));
  
  // Emit score for backend sync
  emit('scoreSubmitted', {
    score: stats.score,
    survivalTime: stats.survivalTime,
    distance: stats.distance
  });
}

function restartGame() {
  gameOver.value = false;
  gameStarted.value = false;
  gameCanvas.value?.restart();
}

function formatTime(seconds) {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
</script>

<style scoped>
.home {
  max-width: 1000px;
  margin: 0 auto;
}

/* Hero Section */
.hero {
  text-align: center;
  padding: 40px 0;
}

.hero-title {
  font-size: 3em;
  color: #2c3e50;
  margin-bottom: 10px;
  animation: titleFloat 3s infinite;
}

.title-emoji {
  display: inline-block;
  animation: emojiBounce 1s infinite;
}

.title-emoji:last-child {
  animation-delay: 0.5s;
}

.hero-subtitle {
  font-size: 1.2em;
  color: #7f8c8d;
  margin-bottom: 30px;
}

/* Game Section */
.game-section {
  position: relative;
  margin: 30px 0;
}

/* Game Over Overlay */
.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}

.game-over-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: cardPop 0.5s ease;
}

.game-over-emoji {
  font-size: 4em;
  margin-bottom: 15px;
}

.game-over-card h2 {
  font-size: 2em;
  color: #e74c3c;
  margin-bottom: 20px;
}

.final-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 20px 0;
}

.stat-label {
  display: block;
  font-size: 0.9em;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 1.5em;
  font-weight: bold;
  color: #2c3e50;
}

.new-highscore {
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  color: white;
  padding: 10px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 1.2em;
  margin: 20px 0;
  animation: pulse 1s infinite;
}

.game-over-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.play-again-btn, .save-score-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 12px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-again-btn {
  background: #3498db;
  color: white;
}

.play-again-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.save-score-btn {
  background: #2ecc71;
  color: white;
}

.save-score-btn:hover {
  background: #27ae60;
  transform: translateY(-2px);
}

/* Controls Info */
.controls-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #7f8c8d;
  font-size: 0.95em;
}

kbd {
  background: #2c3e50;
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: bold;
  box-shadow: 0 2px 0 #1a252f;
}

/* Features Section */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  padding: 40px 0;
}

.feature-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.feature-card h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.feature-card p {
  color: #7f8c8d;
  line-height: 1.6;
}

@keyframes titleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes emojiBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(10deg); }
}

@keyframes cardPop {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>