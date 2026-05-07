<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="cover-photo"></div>
        <div class="avatar-section">
          <div class="avatar">
            {{ userInitial }}
          </div>
          <div class="online-status" :class="{ online: isOnline }"></div>
        </div>
      </div>
      
      <!-- Profile Info -->
      <div class="profile-info">
        <div class="username-section">
          <h2 class="username">{{ username }}</h2>
          <button class="edit-btn" @click="editing = !editing">
            {{ editing ? '💾 Save' : '✏️ Edit' }}
          </button>
        </div>
        
        <!-- Bio Section -->
        <div class="bio-section">
          <h3>
            <span>📝</span> Bio
          </h3>
          <textarea 
            v-if="editing"
            v-model="bio"
            class="bio-input"
            placeholder="Tell us about yourself... 🦖"
            maxlength="200"
            rows="3"
          ></textarea>
          <p v-else class="bio-text">
            {{ bio || 'No bio yet. Click edit to add one!' }}
          </p>
          <span v-if="editing" class="char-count">{{ bio.length }}/200</span>
        </div>
      </div>
    </div>
    
    <!-- Stats Card -->
    <div class="stats-card">
      <h3>🎮 Game Stats</h3>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-icon">🏆</div>
          <div class="stat-value">{{ stats.highScore }}</div>
          <div class="stat-label">High Score</div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">{{ stats.gamesPlayed }}</div>
          <div class="stat-label">Games Played</div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">{{ stats.bestTime }}</div>
          <div class="stat-label">Best Time</div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">📏</div>
          <div class="stat-value">{{ stats.totalDistance }}m</div>
          <div class="stat-label">Total Distance</div>
        </div>
      </div>
    </div>
    
    <!-- Recent Games -->
    <div class="recent-games">
      <h3>🕹️ Recent Games</h3>
      <div v-if="recentGames.length > 0" class="games-list">
        <div 
          v-for="(game, index) in recentGames" 
          :key="index"
          class="game-item"
        >
          <div class="game-score">{{ game.score }}</div>
          <div class="game-details">
            <span>⏱️ {{ game.time }}</span>
            <span>📏 {{ game.distance }}m</span>
          </div>
          <div class="game-date">{{ game.date }}</div>
        </div>
      </div>
      <div v-else class="empty-state">
        <span>🦕</span>
        <p>No games played yet. Time to run!</p>
      </div>
    </div>
    
    <!-- Logout Button -->
    <button class="logout-btn" @click="handleLogout">
      🚪 Logout
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  username: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['logout', 'updateBio']);

const editing = ref(false);
const bio = ref('');
const stats = ref({
  highScore: 0,
  gamesPlayed: 0,
  bestTime: '0s',
  totalDistance: 0
});
const recentGames = ref([]);

const userInitial = computed(() => {
  return props.username ? props.username.charAt(0).toUpperCase() : '?';
});

onMounted(() => {
  loadProfile();
});

watch(() => props.username, () => {
  loadProfile();
});

function loadProfile() {
  // Load bio
  const savedBio = localStorage.getItem(`bio_${props.username}`);
  if (savedBio) {
    bio.value = savedBio;
  }
  
  // Load stats
  const savedStats = localStorage.getItem(`stats_${props.username}`);
  if (savedStats) {
    stats.value = JSON.parse(savedStats);
  }
  
  // Load high score
  const highScore = localStorage.getItem('dinoHighScore');
  if (highScore) {
    stats.value.highScore = parseInt(highScore);
  }
  
  // Load recent games
  const localScores = JSON.parse(localStorage.getItem('localScores') || '[]');
  recentGames.value = localScores
    .filter(s => s.username === props.username)
    .slice(-10)
    .reverse()
    .map(s => ({
      score: Math.floor(s.score),
      time: s.survivalTime ? `${Math.floor(s.survivalTime)}s` : '0s',
      distance: Math.floor(s.distance || 0),
      date: new Date(s.timestamp).toLocaleDateString()
    }));
}

function saveProfile() {
  // Save bio
  localStorage.setItem(`bio_${props.username}`, bio.value);
  
  // Save stats
  localStorage.setItem(`stats_${props.username}`, JSON.stringify(stats.value));
  
  emit('updateBio', { username: props.username, bio: bio.value });
  editing.value = false;
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    emit('logout');
  }
}

// Watch for bio changes when editing is done
watch(editing, (newVal) => {
  if (!newVal) {
    saveProfile();
  }
});
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.cover-photo {
  height: 150px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  position: relative;
  overflow: hidden;
}

.cover-photo::before {
  content: '🦕🦖🌋🏜️🌴';
  position: absolute;
  bottom: 10px;
  right: 20px;
  font-size: 2em;
  opacity: 0.3;
}

.avatar-section {
  position: relative;
  margin-top: -50px;
  padding-left: 30px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2ecc71);
  border: 4px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5em;
  color: white;
  font-weight: bold;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.online-status {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #95a5a6;
  border: 2px solid white;
  position: absolute;
  bottom: 10px;
  left: 110px;
}

.online-status.online {
  background: #2ecc71;
  box-shadow: 0 0 10px rgba(46, 204, 113, 0.5);
}

.profile-info {
  padding: 30px;
}

.username-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.username {
  font-size: 1.8em;
  color: #2c3e50;
  margin: 0;
}

.edit-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background: #3498db;
  color: white;
}

.bio-section h3 {
  color: #7f8c8d;
  font-size: 1em;
  margin-bottom: 10px;
}

.bio-text {
  color: #2c3e50;
  line-height: 1.6;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
}

.bio-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1em;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
}

.bio-input:focus {
  outline: none;
  border-color: #3498db;
}

.char-count {
  font-size: 0.85em;
  color: #95a5a6;
  text-align: right;
  display: block;
  margin-top: 5px;
}

.stats-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.stats-card h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-box {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 15px;
  transition: all 0.3s ease;
}

.stat-box:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2em;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 1.5em;
  font-weight: bold;
  color: #2c3e50;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9em;
  margin-top: 5px;
}

.recent-games {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.recent-games h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.games-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.game-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.game-item:hover {
  background: #e8f4fd;
}

.game-score {
  font-size: 1.3em;
  font-weight: bold;
  color: #3498db;
  min-width: 80px;
}

.game-details {
  flex: 1;
  display: flex;
  gap: 15px;
  color: #7f8c8d;
}

.game-date {
  color: #95a5a6;
  font-size: 0.9em;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #95a5a6;
}

.empty-state span {
  font-size: 3em;
  display: block;
  margin-bottom: 15px;
}

.logout-btn {
  width: 100%;
  padding: 15px;
  background: #fdf0ef;
  color: #e74c3c;
  border: none;
  border-radius: 15px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #e74c3c;
  color: white;
  transform: translateY(-2px);
}

@media (max-width: 600px) {
  .profile-info {
    padding: 20px;
  }
  
  .username {
    font-size: 1.4em;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>