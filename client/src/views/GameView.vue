<template>
  <div class="game-view">
    <!-- Game Header with Back Button -->
    <div class="game-header">
      <div class="header-top">
        <router-link to="/" class="back-home-btn" title="Back to Home">
          <span>⬅️</span>
          <span>Home</span>
        </router-link>
        <h1>🎮 Dino Runner</h1>
        <div class="header-spacer"></div>
      </div>
      <h1>🎮 Dino Runner</h1>
      <div class="game-stats-bar">
        <div class="stat-item">
          <span class="stat-icon">🏆</span>
          <span class="stat-label">High Score:</span>
          <span class="stat-value">{{ highScore }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🎯</span>
          <span class="stat-label">Games:</span>
          <span class="stat-value">{{ gamesPlayed }}</span>
        </div>
        <div class="stat-item" v-if="currentScore > 0">
          <span class="stat-icon">⭐</span>
          <span class="stat-label">Current:</span>
          <span class="stat-value">{{ currentScore }}</span>
        </div>
      </div>
    </div>
    
    <div class="game-wrapper">
      <!-- Game Canvas -->
      <GameCanvas 
        ref="gameCanvas"
        @score-update="handleScoreUpdate"
        @game-over="handleGameOver"
        @game-start="handleGameStart"
      />
      
      <!-- Side Panel -->
      <div class="side-panel">
        <!-- Quick Stats -->
        <div class="panel-card">
          <h3>📊 Your Stats</h3>
          <div class="mini-stats">
            <div class="mini-stat">
              <span class="mini-label">Best Score</span>
              <span class="mini-value">{{ highScore }}</span>
            </div>
            <div class="mini-stat">
              <span class="mini-label">Games Today</span>
              <span class="mini-value">{{ gamesToday }}</span>
            </div>
            <div class="mini-stat">
              <span class="mini-label">Best Time</span>
              <span class="mini-value">{{ bestTime }}</span>
            </div>
          </div>
        </div>
        
        <!-- Tips Card -->
        <div class="panel-card tips-card">
          <h3>💡 Pro Tips</h3>
          <ul class="tips-list">
            <li v-for="tip in tips" :key="tip.id" class="tip-item">
              <span class="tip-emoji">{{ tip.emoji }}</span>
              {{ tip.text }}
            </li>
          </ul>
        </div>
        
        <!-- Achievement Card -->
        <div class="panel-card" v-if="achievements.length > 0">
          <h3>🏅 Achievements</h3>
          <div class="achievements-list">
            <div 
              v-for="achievement in achievements" 
              :key="achievement.id"
              :class="['achievement-item', { unlocked: achievement.unlocked }]"
            >
              <span class="achievement-icon">{{ achievement.icon }}</span>
              <div class="achievement-info">
                <span class="achievement-name">{{ achievement.name }}</span>
                <span class="achievement-desc">{{ achievement.description }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Game Over Modal -->
    <transition name="modal">
      <div v-if="showGameOver" class="modal-overlay" @click.self="restartGame">
        <div class="gameover-modal">
          <div class="modal-header">
            <span class="modal-emoji">🦴</span>
            <h2>Game Over!</h2>
          </div>
          
          <div class="modal-stats">
            <div class="modal-stat">
              <span class="modal-stat-label">Score</span>
              <span class="modal-stat-value score-value">{{ finalStats.score }}</span>
            </div>
            <div class="modal-stat">
              <span class="modal-stat-label">Time</span>
              <span class="modal-stat-value">{{ finalStats.time }}</span>
            </div>
            <div class="modal-stat">
              <span class="modal-stat-label">Distance</span>
              <span class="modal-stat-value">{{ finalStats.distance }}m</span>
            </div>
          </div>
          
          <div v-if="finalStats.isNewHighScore" class="new-record">
            🎉 NEW PERSONAL BEST! 🎉
          </div>
          
          <div class="modal-actions">
            <button class="btn-primary" @click="restartGame">
              🔄 Play Again
            </button>
            <button class="btn-secondary" @click="shareScore">
              📤 Share Score
            </button>
            <router-link to="/leaderboard" class="btn-outline">
              🏆 View Leaderboard
            </router-link>
          </div>
          
          <!-- Fun Rating -->
          <div class="fun-rating">
            <p>Rate your run:</p>
            <div class="rating-emojis">
              <span 
                v-for="emoji in ratingEmojis" 
                :key="emoji"
                :class="{ selected: selectedRating === emoji }"
                @click="selectedRating = emoji"
              >
                {{ emoji }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import GameCanvas from '../components/GameCanvas.vue';

const props = defineProps({
  username: String,
  isLoggedIn: Boolean,
  isOnline: Boolean
});

const emit = defineEmits(['scoreSubmitted']);

const gameCanvas = ref(null);
const showGameOver = ref(false);
const currentScore = ref(0);
const highScore = ref(0);
const gamesPlayed = ref(0);
const gamesToday = ref(0);
const bestTime = ref('0s');
const selectedRating = ref('');
const finalStats = ref({
  score: 0,
  time: '0s',
  distance: 0,
  isNewHighScore: false
});

const ratingEmojis = ['😤', '😐', '🙂', '😊', '🤩'];

const tips = ref([
  { id: 1, emoji: '👀', text: 'Watch for bird patterns - they fly at different heights!' },
  { id: 2, emoji: '⏱️', text: 'Duck under high-flying birds to save time' },
  { id: 3, emoji: '🎯', text: 'Stay in the middle to react to both high and low obstacles' },
  { id: 4, emoji: '💪', text: 'The game speeds up every 5 seconds - stay focused!' }
]);

const achievements = ref([
  { 
    id: 1, 
    icon: '🏃', 
    name: 'First Steps', 
    description: 'Play your first game',
    unlocked: false 
  },
  { 
    id: 2, 
    icon: '⭐', 
    name: 'Century', 
    description: 'Score 100 points',
    unlocked: false 
  },
  { 
    id: 3, 
    icon: '🌟', 
    name: 'Marathon', 
    description: 'Survive for 60 seconds',
    unlocked: false 
  },
  { 
    id: 4, 
    icon: '💫', 
    name: 'Speedster', 
    description: 'Reach 100m distance',
    unlocked: false 
  }
]);

onMounted(() => {
  loadStats();
});

function loadStats() {
  highScore.value = parseInt(localStorage.getItem('dinoHighScore') || 0);
  gamesPlayed.value = parseInt(localStorage.getItem('gamesPlayed') || 0);
  
  // Count today's games
  const localScores = JSON.parse(localStorage.getItem('localScores') || '[]');
  const today = new Date().toDateString();
  gamesToday.value = localScores.filter(s => 
    new Date(s.timestamp).toDateString() === today
  ).length;
  
  // Load best time
  bestTime.value = localStorage.getItem('bestTime') || '0s';
  
  // Check achievements
  checkAchievements();
}

function checkAchievements() {
  if (gamesPlayed.value >= 1) achievements.value[0].unlocked = true;
  if (highScore.value >= 100) achievements.value[1].unlocked = true;
  
  const bestTimeSeconds = parseInt(localStorage.getItem('bestTimeSeconds') || 0);
  if (bestTimeSeconds >= 60) achievements.value[2].unlocked = true;
  
  const maxDistance = parseInt(localStorage.getItem('maxDistance') || 0);
  if (maxDistance >= 100) achievements.value[3].unlocked = true;
}

function handleScoreUpdate(score) {
  currentScore.value = Math.floor(score);
}

function handleGameStart() {
  showGameOver.value = false;
  currentScore.value = 0;
}

function handleGameOver(stats) {
  // Update stats
  gamesPlayed.value++;
  localStorage.setItem('gamesPlayed', gamesPlayed.value.toString());
  
  // Update high score if needed
  if (stats.score > highScore.value) {
    highScore.value = Math.floor(stats.score);
    localStorage.setItem('dinoHighScore', Math.floor(stats.score));
  }
  
  // Update best time
  if (stats.survivalTime > parseInt(localStorage.getItem('bestTimeSeconds') || 0)) {
    const timeSeconds = Math.floor(stats.survivalTime);
    localStorage.setItem('bestTimeSeconds', timeSeconds);
    const mins = Math.floor(timeSeconds / 60);
    const secs = timeSeconds % 60;
    bestTime.value = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    localStorage.setItem('bestTime', bestTime.value);
  }
  
  // Update max distance
  if (stats.distance > parseInt(localStorage.getItem('maxDistance') || 0)) {
    localStorage.setItem('maxDistance', Math.floor(stats.distance));
  }
  
  // Set final stats
  finalStats.value = {
    score: Math.floor(stats.score),
    time: formatTime(stats.survivalTime),
    distance: Math.floor(stats.distance),
    isNewHighScore: stats.score > (parseInt(localStorage.getItem('dinoHighScoreBefore') || 0))
  };
  
  // Store current high score for comparison next time
  localStorage.setItem('dinoHighScoreBefore', Math.floor(stats.score));
  
  showGameOver.value = true;
  
  // Emit score for sync
  emit('scoreSubmitted', {
    score: stats.score,
    survivalTime: stats.survivalTime,
    distance: stats.distance
  });
  
  // Recheck achievements
  checkAchievements();
}

function restartGame() {
  showGameOver.value = false;
  gameCanvas.value?.restart();
}

function shareScore() {
  const text = `🦕 I scored ${finalStats.value.score} points in Dino Runner! Can you beat me? 🏆`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Dino Runner Score',
      text: text
    }).catch(() => {
      copyToClipboard(text);
    });
  } else {
    copyToClipboard(text);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Score copied to clipboard! 📋');
  });
}

function formatTime(seconds) {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
</script>

<style scoped>
.game-view {
  max-width: 1200px;
  margin: 0 auto;
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
}

.game-header h1 {
  font-size: 2em;
  color: #2c3e50;
  margin-bottom: 15px;
}

.game-stats-bar {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 8px 20px;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 1.2em;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9em;
}

.stat-value {
  font-weight: bold;
  color: #2c3e50;
}

.game-wrapper {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
  align-items: start;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
}

.panel-card h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.1em;
}

.mini-stats {
  display: grid;
  gap: 15px;
}

.mini-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 10px;
}

.mini-label {
  color: #7f8c8d;
  font-size: 0.9em;
}

.mini-value {
  font-weight: bold;
  color: #2c3e50;
}

.tips-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #555;
  font-size: 0.9em;
  line-height: 1.4;
}

.tip-emoji {
  font-size: 1.2em;
  flex-shrink: 0;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  background: #f8f9fa;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.achievement-item.unlocked {
  opacity: 1;
  background: linear-gradient(135deg, #fef9e7, #fdebd0);
}

.achievement-icon {
  font-size: 1.5em;
}

.achievement-info {
  display: flex;
  flex-direction: column;
}

.achievement-name {
  font-weight: 600;
  font-size: 0.9em;
  color: #2c3e50;
}

.achievement-desc {
  font-size: 0.8em;
  color: #7f8c8d;
}

/* Game Over Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.gameover-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 450px;
  width: 90%;
  text-align: center;
  animation: modalPop 0.5s ease;
}

.modal-header {
  margin-bottom: 20px;
}

.modal-emoji {
  font-size: 4em;
  display: block;
  margin-bottom: 10px;
}

.modal-header h2 {
  font-size: 2em;
  color: #e74c3c;
}

.modal-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 20px 0;
}

.modal-stat {
  text-align: center;
}

.modal-stat-label {
  display: block;
  font-size: 0.9em;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.modal-stat-value {
  display: block;
  font-size: 1.5em;
  font-weight: bold;
  color: #2c3e50;
}

.score-value {
  color: #3498db;
  font-size: 2em;
}

.new-record {
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1.1em;
  margin: 20px 0;
  animation: pulse 1s infinite;
  display: inline-block;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
}

.btn-primary, .btn-secondary, .btn-outline {
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: block;
  text-align: center;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #2ecc71;
  color: white;
}

.btn-secondary:hover {
  background: #27ae60;
}

.btn-outline {
  background: transparent;
  border: 2px solid #3498db;
  color: #3498db;
}

.btn-outline:hover {
  background: #3498db;
  color: white;
}

.fun-rating {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.fun-rating p {
  color: #7f8c8d;
  margin-bottom: 10px;
}

.rating-emojis {
  display: flex;
  justify-content: center;
  gap: 10px;
  font-size: 2em;
}

.rating-emojis span {
  cursor: pointer;
  transition: all 0.3s ease;
  filter: grayscale(100%);
  opacity: 0.5;
}

.rating-emojis span:hover,
.rating-emojis span.selected {
  filter: grayscale(0%);
  opacity: 1;
  transform: scale(1.2);
}

@keyframes modalPop {
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

@media (max-width: 900px) {
  .game-wrapper {
    grid-template-columns: 1fr;
  }
  
  .side-panel {
    order: 2;
  }
}

/* Header Top with Back Button */
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.header-top h1 {
  margin: 0;
  font-size: 2em;
}

.header-spacer {
  width: 80px; /* Balance the back button */
}

.back-home-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(52, 73, 94, 0.1);
  color: #2c3e50;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.back-home-btn:hover {
  background: #2c3e50;
  color: white;
  transform: translateX(-3px);
}

@media (max-width: 600px) {
  .header-spacer {
    width: 0;
  }
  
  .back-home-btn span:last-child {
    display: none;
  }
}
</style>