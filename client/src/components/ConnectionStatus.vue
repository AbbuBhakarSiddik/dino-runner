<template>
  <div :class="['connection-status', statusClass]">
    <div class="status-content">
      <!-- Warming Up State -->
      <div v-if="status === 'warming'" class="status-warming">
        <span class="status-icon">🦕</span>
        <span class="status-text">Waking up dino server...</span>
        <div class="mini-progress">
          <div class="mini-progress-fill"></div>
        </div>
      </div>
      
      <!-- Connected State -->
      <div v-else-if="status === 'connected'" class="status-connected">
        <span class="status-icon">🟢</span>
        <span class="status-text">Online</span>
      </div>
      
      <!-- Offline State -->
      <div v-else-if="status === 'offline'" class="status-offline">
        <span class="status-icon">🏜️</span>
        <span class="status-text">Offline Mode</span>
        <span class="status-hint">(Scores will sync later)</span>
      </div>
      
      <!-- Error State -->
      <div v-else-if="status === 'error'" class="status-error">
        <span class="status-icon">⚠️</span>
        <span class="status-text">Connection Error</span>
        <button @click="retry" class="retry-btn">Retry 🔄</button>
      </div>
      
      <!-- Syncing State -->
      <div v-else-if="status === 'syncing'" class="status-syncing">
        <span class="status-icon">🔄</span>
        <span class="status-text">Syncing scores...</span>
        <span class="sync-count" v-if="pendingCount > 0">
          ({{ pendingCount }} pending)
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  initialStatus: {
    type: String,
    default: 'warming'
  },
  pendingCount: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['retry']);

const status = ref(props.initialStatus);

const statusClass = computed(() => {
  return `status-${status.value}`;
});

function setStatus(newStatus) {
  status.value = newStatus;
}

function retry() {
  emit('retry');
  setStatus('warming');
}

// Monitor online/offline status
function handleOnline() {
  if (status.value === 'offline') {
    setStatus('warming');
  }
}

function handleOffline() {
  setStatus('offline');
}

onMounted(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});

defineExpose({
  setStatus
});
</script>

<style scoped>
.connection-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  padding: 8px;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

.status-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-warming {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.status-connected {
  background: rgba(46, 204, 113, 0.9);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);
}

.status-offline {
  background: rgba(243, 156, 18, 0.9);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
}

.status-error {
  background: rgba(231, 76, 60, 0.9);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
}

.status-syncing {
  background: rgba(52, 152, 219, 0.9);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.status-icon {
  font-size: 1.2em;
  animation: bounce 1s infinite;
}

.status-text {
  font-weight: 600;
}

.status-hint {
  font-size: 0.85em;
  opacity: 0.8;
}

.sync-count {
  font-size: 0.85em;
  opacity: 0.9;
}

.mini-progress {
  width: 50px;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.mini-progress-fill {
  width: 30%;
  height: 100%;
  background: white;
  border-radius: 2px;
  animation: progressMove 1s infinite;
}

.retry-btn {
  background: white;
  color: #e74c3c;
  border: none;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.9em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 10px rgba(255, 255, 255, 0.3);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes progressMove {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
</style>