<template>
  <div class="profile-view">
    <!-- Back Button -->
    <div class="back-navigation">
      <router-link to="/play" class="back-btn">
        <span class="back-arrow">⬅️</span>
        <span>Back to Game</span>
      </router-link>
      <router-link to="/" class="home-btn">
        <span>🏠 Home</span>
      </router-link>
    </div>
    <!-- Not Logged In State -->
    <div v-if="!isLoggedIn" class="not-logged-in">
      <div class="empty-state">
        <span class="empty-emoji">🦕</span>
        <h2>No Profile Yet!</h2>
        <p>Login or register to create your profile and track your scores!</p>
        <button class="login-btn" @click="$emit('loginRequired')">
          🔑 Login / Register
        </button>
        <button class="guest-btn" @click="playAsGuest">
          🎮 Play as Guest
        </button>
      </div>
    </div>
    
    <!-- Profile Content -->
    <div v-else class="profile-content">
      <!-- User Profile Card -->
      <UserProfile 
        :username="username"
        :is-online="isOnline"
        @logout="handleLogout"
        @update-bio="handleBioUpdate"
      />
      
      <!-- Additional Sections -->
      <div class="profile-sections">
        <!-- Achievements -->
        <div class="section-card">
          <h3>🏅 Achievements</h3>
          <div class="achievements-grid">
            <div 
              v-for="achievement in allAchievements" 
              :key="achievement.id"
              :class="['achievement-card', { unlocked: achievement.unlocked }]"
            >
              <div class="achievement-badge">
                <span class="badge-icon">{{ achievement.icon }}</span>
                <div v-if="achievement.unlocked" class="unlocked-glow"></div>
              </div>
              <h4>{{ achievement.name }}</h4>
              <p>{{ achievement.description }}</p>
              <div v-if="!achievement.unlocked" class="locked-overlay">
                🔒
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stats Charts (Simple) -->
        <div class="section-card">
          <h3>📈 Performance</h3>
          <div class="performance-chart">
            <div class="chart-bars">
              <div 
                v-for="(bar, index) in chartData" 
                :key="index"
                class="chart-bar-container"
              >
                <div class="chart-label">{{ bar.label }}</div>
                <div class="chart-bar-wrapper">
                  <div 
                    class="chart-bar" 
                    :style="{ height: bar.percentage + '%' }"
                    :title="bar.value"
                  ></div>
                </div>
                <div class="chart-value">{{ bar.value }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Connected Accounts -->
        <div class="section-card">
          <h3>🔗 Connected Devices</h3>
          <div class="devices-list">
            <div class="device-item">
              <span class="device-icon">💻</span>
              <div class="device-info">
                <span class="device-name">Current Browser</span>
                <span class="device-status online">Active Now</span>
              </div>
            </div>
            <div class="device-item" v-if="isOnline">
              <span class="device-icon">☁️</span>
              <div class="device-info">
                <span class="device-name">Cloud Sync</span>
                <span class="device-status online">Connected</span>
              </div>
            </div>
            <div class="device-item" v-else>
              <span class="device-icon">📱</span>
              <div class="device-info">
                <span class="device-name">Local Storage</span>
                <span class="device-status offline">Offline Mode</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import UserProfile from '../components/UserProfile.vue';

const props = defineProps({
  username: String,
  isLoggedIn: Boolean,
  isOnline: Boolean
});

const emit = defineEmits(['logout', 'loginRequired', 'updateBio']);

const allAchievements = ref([
  { id: 1, icon: '🏃', name: 'First Steps', description: 'Play your first game', unlocked: false },
  { id: 2, icon: '⭐', name: 'Century', description: 'Score 100 points', unlocked: false },
  { id: 3, icon: '🌟', name: 'Marathon', description: 'Survive 60 seconds', unlocked: false },
  { id: 4, icon: '💫', name: 'Speedster', description: 'Run 100m', unlocked: false },
  { id: 5, icon: '🔥', name: 'On Fire', description: 'Play 10 games in a day', unlocked: false },
  { id: 6, icon: '👑', name: 'Champion', description: 'Score 500 points', unlocked: false }
]);

const chartData = ref([
  { label: 'High Score', value: '0', percentage: 0 },
  { label: 'Games', value: '0', percentage: 0 },
  { label: 'Best Time', value: '0s', percentage: 0 },
  { label: 'Distance', value: '0m', percentage: 0 }
]);

onMounted(() => {
  if (props.isLoggedIn) {
    loadAchievements();
    loadChartData();
  }
});

function loadAchievements() {
  const gamesPlayed = parseInt(localStorage.getItem('gamesPlayed') || 0);
  const highScore = parseInt(localStorage.getItem('dinoHighScore') || 0);
  const bestTime = parseInt(localStorage.getItem('bestTimeSeconds') || 0);
  const maxDistance = parseInt(localStorage.getItem('maxDistance') || 0);
  
  allAchievements.value[0].unlocked = gamesPlayed >= 1;
  allAchievements.value[1].unlocked = highScore >= 100;
  allAchievements.value[2].unlocked = bestTime >= 60;
  allAchievements.value[3].unlocked = maxDistance >= 100;
  allAchievements.value[4].unlocked = gamesPlayed >= 10;
  allAchievements.value[5].unlocked = highScore >= 500;
}

function loadChartData() {
  const highScore = parseInt(localStorage.getItem('dinoHighScore') || 0);
  const gamesPlayed = parseInt(localStorage.getItem('gamesPlayed') || 0);
  const bestTime = parseInt(localStorage.getItem('bestTimeSeconds') || 0);
  const maxDistance = parseInt(localStorage.getItem('maxDistance') || 0);
  
  chartData.value = [
    { 
      label: 'High Score', 
      value: highScore.toString(), 
      percentage: Math.min((highScore / 1000) * 100, 100) 
    },
    { 
      label: 'Games', 
      value: gamesPlayed.toString(), 
      percentage: Math.min((gamesPlayed / 50) * 100, 100) 
    },
    { 
      label: 'Best Time', 
      value: bestTime + 's', 
      percentage: Math.min((bestTime / 120) * 100, 100) 
    },
    { 
      label: 'Distance', 
      value: maxDistance + 'm', 
      percentage: Math.min((maxDistance / 500) * 100, 100) 
    }
  ];
}

function handleLogout() {
  emit('logout');
}

function handleBioUpdate(data) {
  emit('updateBio', data);
}

function playAsGuest() {
  const guestName = `Dino${Math.floor(Math.random() * 9999)}`;
  localStorage.setItem('username', guestName);
  localStorage.setItem('token', 'guest-token');
  window.location.reload();
}
</script>

<style scoped>
.profile-view {
  max-width: 1000px;
  margin: 0 auto;
}

.not-logged-in {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.empty-state {
  text-align: center;
  max-width: 400px;
}

.empty-emoji {
  font-size: 6em;
  display: block;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

.empty-state h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.empty-state p {
  color: #7f8c8d;
  margin-bottom: 30px;
  line-height: 1.6;
}

.login-btn, .guest-btn {
  display: block;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 10px;
}

.login-btn {
  background: linear-gradient(135deg, #3498db, #2ecc71);
  color: white;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(52, 152, 219, 0.4);
}

.guest-btn {
  background: #f0f0f0;
  color: #2c3e50;
}

.guest-btn:hover {
  background: #e0e0e0;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.profile-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.section-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
}

.section-card h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.3em;
}

/* Achievements Grid */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
}

.achievement-card {
  text-align: center;
  padding: 20px;
  border-radius: 15px;
  background: #f8f9fa;
  position: relative;
  transition: all 0.3s ease;
  opacity: 0.5;
}

.achievement-card.unlocked {
  opacity: 1;
  background: linear-gradient(135deg, #fef9e7, #fdebd0);
}

.achievement-card:hover {
  transform: translateY(-3px);
}

.achievement-badge {
  position: relative;
  font-size: 3em;
  margin-bottom: 10px;
}

.unlocked-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  background: radial-gradient(circle, rgba(241, 196, 15, 0.4), transparent);
  border-radius: 50%;
  animation: glow 2s infinite;
}

.achievement-card h4 {
  color: #2c3e50;
  font-size: 0.95em;
  margin-bottom: 5px;
}

.achievement-card p {
  color: #7f8c8d;
  font-size: 0.8em;
}

.locked-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.2em;
}

/* Performance Chart */
.chart-bars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  align-items: end;
}

.chart-bar-container {
  text-align: center;
}

.chart-label {
  font-size: 0.8em;
  color: #7f8c8d;
  margin-bottom: 10px;
}

.chart-bar-wrapper {
  height: 150px;
  background: #f0f0f0;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.chart-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: linear-gradient(to top, #3498db, #2ecc71);
  border-radius: 10px;
  transition: height 1s ease;
  min-height: 5px;
}

.chart-value {
  margin-top: 10px;
  font-weight: bold;
  color: #2c3e50;
  font-size: 0.9em;
}

/* Devices List */
.devices-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
}

.device-icon {
  font-size: 2em;
}

.device-info {
  display: flex;
  flex-direction: column;
}

.device-name {
  font-weight: 600;
  color: #2c3e50;
}

.device-status {
  font-size: 0.85em;
}

.device-status.online {
  color: #2ecc71;
}

.device-status.offline {
  color: #f39c12;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes glow {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
}

@media (max-width: 600px) {
  .achievements-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-bars {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Back Navigation */
.back-navigation {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.back-btn, .home-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 25px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.back-btn {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
  border: 2px solid #3498db;
}

.back-btn:hover {
  background: #3498db;
  color: white;
  transform: translateX(-3px);
}

.home-btn {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
  border: 2px solid #2ecc71;
}

.home-btn:hover {
  background: #2ecc71;
  color: white;
}

.back-arrow {
  animation: arrowBounce 1.5s infinite;
  font-size: 1.2em;
}

@keyframes arrowBounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-5px); }
}
</style>