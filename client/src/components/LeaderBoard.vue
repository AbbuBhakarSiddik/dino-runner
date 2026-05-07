<template>
  <div class="leaderboard">
    <div class="leaderboard-header">
      <h2>🏆 Leaderboard</h2>
      <div class="filter-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          :class="['tab', { active: activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton" v-for="i in 5" :key="i">
        <div class="skeleton-rank"></div>
        <div class="skeleton-name"></div>
        <div class="skeleton-score"></div>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="error-emoji">🦴</span>
      <p>{{ error }}</p>
      <button @click="fetchLeaderboard" class="retry-btn">
        Try Again 🔄
      </button>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="scores.length === 0" class="empty-state">
      <span class="empty-emoji">🦕</span>
      <p>No scores yet! Be the first to play!</p>
    </div>
    
    <!-- Leaderboard List -->
    <div v-else class="leaderboard-list">
      <!-- Top 3 Podium -->
      <div v-if="activeTab === 'all' && scores.length >= 3" class="podium">
        <!-- 2nd Place -->
        <div class="podium-item second" v-if="scores[1]">
          <div class="podium-rank">🥈</div>
          <div class="podium-avatar">{{ getInitial(scores[1].username) }}</div>
          <div class="podium-name">{{ scores[1].username }}</div>
          <div class="podium-score">{{ formatScore(scores[1].score) }}</div>
          <div class="podium-bar" style="height: 60px;"></div>
        </div>
        
        <!-- 1st Place -->
        <div class="podium-item first" v-if="scores[0]">
          <div class="crown">👑</div>
          <div class="podium-rank">🥇</div>
          <div class="podium-avatar gold">{{ getInitial(scores[0].username) }}</div>
          <div class="podium-name">{{ scores[0].username }}</div>
          <div class="podium-score">{{ formatScore(scores[0].score) }}</div>
          <div class="podium-bar" style="height: 90px;"></div>
        </div>
        
        <!-- 3rd Place -->
        <div class="podium-item third" v-if="scores[2]">
          <div class="podium-rank">🥉</div>
          <div class="podium-avatar">{{ getInitial(scores[2].username) }}</div>
          <div class="podium-name">{{ scores[2].username }}</div>
          <div class="podium-score">{{ formatScore(scores[2].score) }}</div>
          <div class="podium-bar" style="height: 40px;"></div>
        </div>
      </div>
      
      <!-- Score List -->
      <div class="score-list">
        <div 
          v-for="(score, index) in displayScores" 
          :key="score._id || index"
          :class="['score-item', { 'top-three': index < 3 && activeTab === 'all' }]"
        >
          <div class="score-rank">
            <span v-if="index === 0 && activeTab === 'all'">🥇</span>
            <span v-else-if="index === 1 && activeTab === 'all'">🥈</span>
            <span v-else-if="index === 2 && activeTab === 'all'">🥉</span>
            <span v-else class="rank-number">#{{ index + 1 }}</span>
          </div>
          
          <div class="score-player">
            <div :class="['player-avatar', { 'current-user': isCurrentUser(score.username) }]">
              {{ getInitial(score.username) }}
            </div>
            <div class="player-info">
              <div class="player-name">
                {{ score.username }}
                <span v-if="isCurrentUser(score.username)" class="you-badge">YOU</span>
              </div>
              <div class="player-date">{{ formatDate(score.date) }}</div>
            </div>
          </div>
          
          <div class="score-stats">
            <div class="score-value">{{ formatScore(score.score) }}</div>
            <div class="score-details">
              <span>⏱️ {{ formatTime(score.survivalTime) }}</span>
              <span>📏 {{ score.distance || 0 }}m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  currentUser: {
    type: String,
    default: ''
  }
});

const activeTab = ref('all');
const scores = ref([]);
const loading = ref(true);
const error = ref(null);

const tabs = [
  { key: 'all', label: '🏆 All Time' },
  { key: 'daily', label: '📅 Daily' },
  { key: 'weekly', label: '📊 Weekly' }
];

const displayScores = computed(() => {
  return scores.value;
});

async function fetchLeaderboard() {
  loading.value = true;
  error.value = null;
  
  try {
    // Try to fetch from API
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/leaderboard?type=${activeTab.value}`);
    
    if (response.ok) {
      const data = await response.json();
      scores.value = data;
    } else {
      throw new Error('Failed to fetch leaderboard');
    }
  } catch (err) {
    // Fallback to localStorage
    console.log('Using local scores...');
    const localScores = JSON.parse(localStorage.getItem('localScores') || '[]');
    scores.value = localScores.sort((a, b) => b.score - a.score).slice(0, 20);
    
    if (scores.value.length === 0) {
      error.value = 'Could not load leaderboard. Play a game first!';
    }
  } finally {
    loading.value = false;
  }
}

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

function isCurrentUser(username) {
  return props.currentUser && username === props.currentUser;
}

function formatScore(score) {
  return Math.floor(score).toLocaleString();
}

function formatTime(seconds) {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

onMounted(() => {
  fetchLeaderboard();
});
</script>

<style scoped>
.leaderboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.leaderboard-header {
  text-align: center;
  margin-bottom: 30px;
}

.leaderboard-header h2 {
  font-size: 2em;
  margin-bottom: 15px;
  color: #2c3e50;
}

.filter-tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.tab {
  padding: 8px 20px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.tab:hover {
  border-color: #3498db;
  color: #3498db;
}

.tab.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

/* Podium Styles */
.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 30px;
  padding: 30px 20px;
  background: linear-gradient(to top, rgba(52, 152, 219, 0.05), transparent);
  border-radius: 15px;
}

.podium-item {
  text-align: center;
  flex: 1;
  max-width: 150px;
}

.podium-item.first {
  order: 2;
  transform: translateY(-20px);
}

.podium-item.second {
  order: 1;
}

.podium-item.third {
  order: 3;
}

.crown {
  font-size: 2em;
  animation: float 2s infinite;
}

.podium-rank {
  font-size: 2em;
  margin: 10px 0;
}

.podium-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5em;
  font-weight: bold;
  margin: 10px auto;
}

.podium-avatar.gold {
  background: linear-gradient(135deg, #f1c40f, #f39c12);
  width: 70px;
  height: 70px;
  font-size: 1.8em;
  box-shadow: 0 0 30px rgba(241, 196, 15, 0.5);
}

.podium-name {
  font-weight: 600;
  margin: 5px 0;
  color: #2c3e50;
}

.podium-score {
  font-size: 1.2em;
  color: #3498db;
  font-weight: bold;
}

.podium-bar {
  width: 100%;
  background: linear-gradient(to top, #3498db, #2ecc71);
  border-radius: 5px 5px 0 0;
  margin-top: 10px;
  opacity: 0.3;
}

/* Score List */
.score-list {
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.score-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.score-item:hover {
  background: #f8f9fa;
}

.score-item.top-three {
  background: linear-gradient(90deg, rgba(241, 196, 15, 0.05), transparent);
}

.score-rank {
  width: 50px;
  font-size: 1.5em;
  text-align: center;
}

.rank-number {
  font-weight: bold;
  color: #95a5a6;
  font-size: 0.7em;
}

.score-player {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.player-avatar.current-user {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  box-shadow: 0 0 20px rgba(46, 204, 113, 0.4);
}

.player-name {
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.you-badge {
  background: #2ecc71;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7em;
  font-weight: bold;
}

.player-date {
  font-size: 0.85em;
  color: #95a5a6;
}

.score-stats {
  text-align: right;
}

.score-value {
  font-size: 1.2em;
  font-weight: bold;
  color: #2c3e50;
}

.score-details {
  display: flex;
  gap: 10px;
  font-size: 0.85em;
  color: #95a5a6;
}

/* States */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 40px;
}

.skeleton {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  margin: 10px 0;
  background: #f8f9fa;
  border-radius: 10px;
}

.skeleton-rank,
.skeleton-name,
.skeleton-score {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 5px;
}

.skeleton-rank {
  width: 40px;
  height: 20px;
}

.skeleton-name {
  width: 150px;
  height: 20px;
  flex: 1;
}

.skeleton-score {
  width: 80px;
  height: 20px;
}

.error-state, .empty-state {
  color: #7f8c8d;
}

.error-emoji, .empty-emoji {
  font-size: 4em;
  display: block;
  margin-bottom: 20px;
}

.retry-btn {
  margin-top: 20px;
  padding: 10px 25px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@media (max-width: 600px) {
  .podium {
    gap: 10px;
  }
  
  .score-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .score-stats {
    text-align: left;
    width: 100%;
  }
}
</style>