<template>
  <div class="app" :class="{ 'offline-mode': !isOnline }">
    <!-- Connection Status Bar -->
    <ConnectionStatus 
      ref="connectionStatus"
      :pending-count="pendingScoresCount"
      @retry="retryConnection"
    />
    
    <!-- Navigation -->
    <NavBar 
      :is-logged-in="isLoggedIn"
      :username="username"
      :is-online="isOnline"
      @logout="handleLogout"
      @open-auth="showAuthModal = true"
    />
    
    <!-- Main Content -->
    <main class="main-content">
      <router-view 
        :key="$route.fullPath"
        :username="username"
        :is-online="isOnline"
        :is-logged-in="isLoggedIn"
        @score-submitted="handleScoreSubmitted"
        @login-required="showAuthModal = true"
      />
    </main>
    
    <!-- Auth Modal -->
    <AuthModal 
      :visible="showAuthModal"
      @close="showAuthModal = false"
      @login="handleLogin"
      @register="handleRegister"
      @guest="handleGuest"
    />
    
    <!-- Toast Notifications -->
    <transition-group name="toast" tag="div" class="toast-container">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
      >
        <span class="toast-icon">{{ toast.icon }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </transition-group>
    
    <!-- Footer -->
    <footer class="footer">
      <p>🦕 Dino Runner - Made with ❤️</p>
      <div class="footer-links">
        <span v-if="!isOnline" class="offline-indicator">
          🏜️ Offline Mode
        </span>
        <span v-else class="online-indicator">
          🟢 Connected
        </span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from './components/NavBar.vue';
import ConnectionStatus from './components/ConnectionStatus.vue';
import AuthModal from './components/AuthModal.vue';

const router = useRouter();

// State
const isLoggedIn = ref(false);
const username = ref('');
const isOnline = ref(navigator.onLine);
const showAuthModal = ref(false);
const pendingScoresCount = ref(0);
const toasts = ref([]);
const connectionStatus = ref(null);

// Check login status on mount
onMounted(() => {
  const token = localStorage.getItem('token');
  const storedUsername = localStorage.getItem('username');
  
  if (token && storedUsername) {
    isLoggedIn.value = true;
    username.value = storedUsername;
    checkBackendConnection();
  }
  
  // Load pending scores
  const pending = JSON.parse(localStorage.getItem('pendingScores') || '[]');
  pendingScoresCount.value = pending.length;
  
  // Listen for online/offline
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});

async function checkBackendConnection() {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      isOnline.value = true;
      connectionStatus.value?.setStatus('connected');
      syncPendingScores();
    }
  } catch (error) {
    isOnline.value = false;
    connectionStatus.value?.setStatus('offline');
  }
}

function handleOnline() {
  isOnline.value = true;
  showToast('🌐', 'Back online! Syncing scores...', 'success');
  checkBackendConnection();
}

function handleOffline() {
  isOnline.value = false;
  connectionStatus.value?.setStatus('offline');
  showToast('🏜️', 'Offline mode - keep playing!', 'warning');
}

function handleLogin(data) {
  isLoggedIn.value = true;
  username.value = data.username;
  showToast('👋', `Welcome back, ${data.username}!`, 'success');
  router.push('/');
}

function handleRegister(data) {
  isLoggedIn.value = true;
  username.value = data.username;
  showToast('🎉', `Welcome to the herd, ${data.username}!`, 'success');
  router.push('/profile');
}

function handleGuest(data) {
  isLoggedIn.value = false;
  username.value = data.username;
  showToast('🎮', `Playing as ${data.username}`, 'info');
}

function handleLogout() {
  isLoggedIn.value = false;
  username.value = '';
  showToast('👋', 'See you soon!', 'info');
  router.push('/');
}

function handleScoreSubmitted(scoreData) {
  if (!isOnline.value) {
    // Queue for later sync
    const pending = JSON.parse(localStorage.getItem('pendingScores') || '[]');
    pending.push({
      ...scoreData,
      username: username.value || 'Anonymous',
      timestamp: Date.now()
    });
    localStorage.setItem('pendingScores', JSON.stringify(pending));
    pendingScoresCount.value = pending.length;
    showToast('💾', 'Score saved locally. Will sync when online!', 'info');
  }
}

async function syncPendingScores() {
  const pending = JSON.parse(localStorage.getItem('pendingScores') || '[]');
  if (pending.length === 0) return;
  
  connectionStatus.value?.setStatus('syncing');
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  let synced = 0;
  
  for (const score of pending) {
    try {
      await fetch(`${apiUrl}/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(score)
      });
      synced++;
    } catch (error) {
      break; // Stop if backend fails
    }
  }
  
  if (synced > 0) {
    const remaining = pending.slice(synced);
    localStorage.setItem('pendingScores', JSON.stringify(remaining));
    pendingScoresCount.value = remaining.length;
    showToast('🔄', `Synced ${synced} score(s)!`, 'success');
  }
  
  connectionStatus.value?.setStatus('connected');
}

async function retryConnection() {
  showToast('🔄', 'Retrying connection...', 'info');
  await checkBackendConnection();
}

function showToast(icon, message, type = 'info') {
  const id = Date.now();
  toasts.value.push({ id, icon, message, type });
  
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3000);
}
</script>

<style>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f7fa;
  color: #2c3e50;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app.offline-mode {
  background: linear-gradient(135deg, #fef9e7, #fdebd0);
}

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  background: white;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 250px;
  max-width: 350px;
  animation: slideIn 0.3s ease;
}

.toast-success {
  border-left: 4px solid #2ecc71;
}

.toast-warning {
  border-left: 4px solid #f39c12;
}

.toast-info {
  border-left: 4px solid #3498db;
}

.toast-error {
  border-left: 4px solid #e74c3c;
}

.toast-icon {
  font-size: 1.3em;
}

.toast-message {
  font-weight: 500;
  color: #2c3e50;
}

/* Footer */
.footer {
  background: #1a1a2e;
  color: white;
  padding: 20px;
  text-align: center;
  margin-top: auto;
}

.footer p {
  margin-bottom: 10px;
}

.footer-links {
  font-size: 0.9em;
  opacity: 0.8;
}

.offline-indicator {
  color: #f39c12;
}

.online-indicator {
  color: #2ecc71;
}

/* Toast Animations */
.toast-enter-active {
  animation: slideIn 0.3s ease;
}

.toast-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>