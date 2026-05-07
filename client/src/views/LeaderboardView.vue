<template>
  <div class="leaderboard-view">
    <!-- Back Navigation -->
    <div class="back-navigation">
      <router-link to="/play" class="back-btn">
        <span class="back-arrow">⬅️</span>
        <span>Back to Game</span>
      </router-link>
      <router-link to="/" class="home-btn">
        <span>🏠 Home</span>
      </router-link>
    </div>
    <div class="page-header">
      <h1>🏆 Global Leaderboard</h1>
      <p>Compete with players worldwide and prove you're the ultimate dinosaur runner!</p>
    </div>
    
    <!-- Leaderboard Component -->
    <LeaderBoard :current-user="username" />
    
    <!-- Call to Action -->
    <div v-if="!isLoggedIn" class="cta-section">
      <div class="cta-card">
        <span class="cta-emoji">🦖</span>
        <h3>Want to save your scores?</h3>
        <p>Login to track your progress and compete on the leaderboard!</p>
        <button class="cta-btn" @click="$emit('loginRequired')">
          🔑 Login / Register
        </button>
      </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="recent-activity">
      <h3>🕐 Recent Games</h3>
      <div v-if="recentGames.length > 0" class="activity-feed">
        <div 
          v-for="(game, index) in recentGames" 
          :key="index"
          class="activity-item"
        >
          <div class="activity-avatar">
            {{ getInitial(game.username) }}
          </div>
          <div class="activity-content">
            <div class="activity-header">
              <strong>{{ game.username }}</strong>
              <span class="activity-time">{{ timeAgo(game.timestamp) }}</span>
            </div>
            <div class="activity-body">
              scored <strong>{{ game.score }}</strong> points
              <span class="activity-detail">• {{ game.time }}</span>
            </div>
          </div>
          <div class="activity-trophy" v-if="game.score > 1000">
            🏆
          </div>
        </div>
      </div>
      <div v-else class="empty-activity">
        <span>🦴</span>
        <p>No recent games yet. Be the first to play!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LeaderBoard from '../components/LeaderBoard.vue';

const props = defineProps({
  username: String,
  isLoggedIn: Boolean,
  isOnline: Boolean
});

const recentGames = ref([]);

onMounted(() => {
  loadRecentGames();
});

function loadRecentGames() {
  const localScores = JSON.parse(localStorage.getItem('localScores') || '[]');
  recentGames.value = localScores
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10)
    .map(s => ({
      username: s.username || 'Anonymous',
      score: Math.floor(s.score),
      time: formatTime(s.survivalTime),
      timestamp: s.timestamp
    }));
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

function formatTime(seconds) {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
</script>

<style scoped>
.leaderboard-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 10px;
}

.page-header p {
  color: #7f8c8d;
  font-size: 1.1em;
}

.cta-section {
  margin: 40px 0;
}

.cta-card {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: white;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.cta-emoji {
  font-size: 4em;
  display: block;
  margin-bottom: 15px;
  animation: bounce 2s infinite;
}

.cta-card h3 {
  font-size: 1.5em;
  margin-bottom: 10px;
}

.cta-card p {
  opacity: 0.9;
  margin-bottom: 20px;
}

.cta-btn {
  padding: 12px 30px;
  background: white;
  color: #1a1a2e;
  border: none;
  border-radius: 25px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(255, 255, 255, 0.3);
}

.recent-activity {
  margin-top: 50px;
}

.recent-activity h3 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.activity-item:hover {
  transform: translateX(5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.activity-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.1em;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}

.activity-header strong {
  color: #2c3e50;
}

.activity-time {
  font-size: 0.85em;
  color: #95a5a6;
}

.activity-body {
  color: #7f8c8d;
}

.activity-body strong {
  color: #3498db;
}

.activity-detail {
  color: #95a5a6;
  font-size: 0.9em;
}

.activity-trophy {
  font-size: 1.5em;
  animation: pulse 2s infinite;
}

.empty-activity {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-activity span {
  font-size: 3em;
  display: block;
  margin-bottom: 15px;
}

.empty-activity p {
  color: #95a5a6;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
</style>