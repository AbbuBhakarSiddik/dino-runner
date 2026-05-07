<template>
  <nav class="navbar">
    <div class="nav-content">
      <!-- Logo -->
      <div class="nav-logo" @click="$router.push('/')">
        <span class="logo-emoji">🦕</span>
        <span class="logo-text">Dino Runner</span>
      </div>
      
      <!-- Navigation Links -->
      <div class="nav-links">
        <router-link to="/" class="nav-link" exact-active-class="active">
          <span class="link-icon">🎮</span>
          Play
        </router-link>
        
        <router-link to="/leaderboard" class="nav-link" active-class="active">
          <span class="link-icon">🏆</span>
          Leaderboard
        </router-link>
      </div>
      
      <!-- User Section -->
      <div class="nav-user">
        <!-- Offline Indicator -->
        <div v-if="!isOnline" class="offline-badge" title="Offline Mode">
          🏜️
        </div>
        
        <!-- Back to Game Button (visible on non-game pages) -->
        <router-link 
          v-if="$route.path !== '/' && $route.path !== '/play'" 
          to="/play" 
          class="back-to-game-btn"
          title="Back to Game"
        >
          <span class="back-arrow">⬅️</span>
          <span class="back-text">Game</span>
        </router-link>
        
        <!-- User Menu -->
        <div v-if="isLoggedIn" class="user-menu">
          <!-- Profile Icon Button -->
          <router-link to="/profile" class="profile-icon-btn" title="View Profile">
            <div class="user-avatar-small">
              {{ userInitial }}
            </div>
          </router-link>
          
          <div class="user-info" @click="toggleMenu">
            <span class="user-name">{{ username }}</span>
            <span class="menu-arrow">▼</span>
          </div>
          
          <div v-if="menuOpen" class="dropdown-menu">
            <router-link to="/profile" class="dropdown-item" @click="menuOpen = false">
              👤 View Profile
            </router-link>
            <router-link to="/play" class="dropdown-item" @click="menuOpen = false">
              🎮 Play Game
            </router-link>
            <router-link to="/leaderboard" class="dropdown-item" @click="menuOpen = false">
              🏆 Leaderboard
            </router-link>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item logout-item" @click="logout">
              🚪 Logout
            </div>
          </div>
        </div>
        
        <!-- Login Button -->
        <button v-else class="login-btn" @click="$emit('openAuth')">
          Login
        </button>
      </div>
      
      <!-- Mobile Menu Toggle -->
      <div class="mobile-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    
    <!-- Mobile Menu -->
    <div v-if="mobileMenuOpen" class="mobile-menu">
      <router-link to="/" class="mobile-link" @click="mobileMenuOpen = false">
        🎮 Play Game
      </router-link>
      <router-link to="/leaderboard" class="mobile-link" @click="mobileMenuOpen = false">
        🏆 Leaderboard
      </router-link>
      <router-link v-if="isLoggedIn" to="/profile" class="mobile-link" @click="mobileMenuOpen = false">
        👤 Profile
      </router-link>
      <div v-if="!isLoggedIn" class="mobile-link" @click="openAuth">
        🔑 Login / Register
      </div>
      <div v-else class="mobile-link" @click="logout">
        🚪 Logout
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  username: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['logout', 'openAuth']);

const router = useRouter();
const menuOpen = ref(false);
const mobileMenuOpen = ref(false);

const userInitial = computed(() => {
  return props.username ? props.username.charAt(0).toUpperCase() : '?';
});

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function logout() {
  menuOpen.value = false;
  mobileMenuOpen.value = false;
  emit('logout');
  router.push('/');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    menuOpen.value = false;
  }
});
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: white;
  padding: 0 20px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.logo-emoji {
  font-size: 2em;
  animation: bounce 2s infinite;
}

.logo-text {
  font-size: 1.3em;
  font-weight: bold;
  background: linear-gradient(45deg, #3498db, #2ecc71);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  gap: 10px;
}

.nav-link {
  color: #bdc3c7;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateY(-1px);
}

.nav-link.active {
  background: rgba(52, 152, 219, 0.3);
  color: #3498db;
}

.link-icon {
  font-size: 1.1em;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.offline-badge {
  font-size: 1.5em;
  animation: pulse 2s infinite;
  cursor: help;
}

.user-menu {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.15);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2ecc71);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1em;
}

.user-name {
  font-weight: 500;
  color: #ecf0f1;
}

.menu-arrow {
  font-size: 0.7em;
  color: #95a5a6;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  background: #2c3e50;
  border-radius: 12px;
  padding: 8px;
  min-width: 180px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.2s ease;
}

.dropdown-item {
  padding: 10px 15px;
  color: #ecf0f1;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: block;
  text-decoration: none;
}

.dropdown-item:hover {
  background: rgba(52, 152, 219, 0.3);
}

.login-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #3498db, #2ecc71);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(52, 152, 219, 0.4);
}

.mobile-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
}

.mobile-toggle span {
  width: 25px;
  height: 3px;
  background: white;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.mobile-menu {
  display: none;
  background: #1a1a2e;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-link {
  padding: 15px;
  color: #ecf0f1;
  cursor: pointer;
  display: block;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.mobile-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .nav-links, .nav-user {
    display: none;
  }
  
  .mobile-toggle {
    display: flex;
  }
  
  .mobile-menu {
    display: block;
  }
}

/* Back to Game Button */
.back-to-game-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(52, 152, 219, 0.3);
  margin-right: 8px;
}

.back-to-game-btn:hover {
  transform: translateX(-3px);
  box-shadow: 0 5px 20px rgba(52, 152, 219, 0.4);
  background: linear-gradient(135deg, #2980b9, #2471a3);
}

.back-arrow {
  font-size: 1.1em;
  animation: arrowPulse 1.5s infinite;
}

.back-text {
  font-size: 0.9em;
}

/* Profile Icon Button */
.profile-icon-btn {
  display: flex;
  align-items: center;
  text-decoration: none;
  margin-right: 8px;
  transition: all 0.3s ease;
}

.profile-icon-btn:hover {
  transform: scale(1.1);
}

.user-avatar-small {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f39c12, #e67e22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2em;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 10px rgba(243, 156, 18, 0.4);
  transition: all 0.3s ease;
  position: relative;
}

.user-avatar-small::after {
  content: '';
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 10px;
  height: 10px;
  background: #2ecc71;
  border-radius: 50%;
  border: 2px solid #1a1a2e;
}

/* Dropdown Divider */
.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 5px 0;
}

/* Logout Item */
.logout-item {
  color: #e74c3c !important;
}

.logout-item:hover {
  background: rgba(231, 76, 60, 0.2) !important;
}

/* Arrow Animation */
@keyframes arrowPulse {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-3px); }
}

/* Update user info to be smaller */
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.15);
}

.user-name {
  font-weight: 500;
  color: #ecf0f1;
  font-size: 0.95em;
}

.menu-arrow {
  font-size: 0.7em;
  color: #95a5a6;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .back-to-game-btn {
    display: none;
  }
  
  .back-text {
    display: none;
  }
}
</style>