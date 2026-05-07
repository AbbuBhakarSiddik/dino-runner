<template>
  <transition name="fade">
    <div v-if="visible" class="loading-screen">
      <div class="loading-content">
        <!-- Animated Dino -->
        <div class="dino-loader">
          <span class="dino-emoji">{{ currentEmoji }}</span>
          <div class="dino-shadow"></div>
        </div>
        
        <!-- Loading Message -->
        <h2 class="loading-message">{{ currentMessage }}</h2>
        
        <!-- Loading Steps -->
        <div class="loading-steps">
          <div 
            v-for="(step, index) in loadingSteps" 
            :key="index"
            :class="['step', { 
              completed: step.done, 
              active: step.active,
              error: step.error 
            }]"
          >
            <span class="step-icon">
              {{ step.error ? '❌' : step.done ? '✅' : step.active ? '⏳' : '⏸️' }}
            </span>
            <span class="step-label">{{ step.label }}</span>
            <span v-if="step.active && !step.done" class="step-progress">
              <span class="dot-pulse"></span>
            </span>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: overallProgress + '%' }"
            ></div>
          </div>
          <span class="progress-text">{{ Math.round(overallProgress) }}%</span>
        </div>
        
        <!-- Fun Fact -->
        <div class="dino-fact">
          <p>🦖 <span class="fact-text">{{ currentFact }}</span></p>
        </div>
        
        <!-- Skip button (appears after 3 seconds) -->
        <button 
          v-if="showSkipButton" 
          class="skip-button"
          @click="$emit('skip')"
        >
          Skip & Play Offline 🏃‍♂️
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  steps: {
    type: Array,
    default: () => [
      { label: 'Loading game assets', done: false, active: false },
      { label: 'Connecting to server', done: false, active: false },
      { label: 'Fetching leaderboard', done: false, active: false },
      { label: 'Preparing adventure', done: false, active: false }
    ]
  }
});

const emit = defineEmits(['skip']);

const emojis = ['🦕', '🦖', '🐊', '🦎', '🐢', '🐉', '🦴', '🌋'];
const currentEmoji = ref('🦕');

const messages = [
  '🦕 Hunting for dinosaur eggs...',
  '🌋 Avoiding meteor showers...',
  '🏃‍♂️ Outrunning extinction...',
  '🦴 Digging up fossils...',
  '🌴 Exploring Jurassic jungles...',
  '💨 Running from T-Rex...',
  '🗺️ Mapping prehistoric world...',
  '⚡ Charging time machine...'
];
const currentMessage = ref(messages[0]);

const facts = [
  'The T-Rex had a bite force of 8,000 pounds!',
  'Velociraptors were actually the size of turkeys',
  'Some dinosaurs had feathers, not scales!',
  'The longest dinosaur was over 130 feet long',
  'Dinosaurs lived on Earth for over 165 million years',
  'The fastest dinosaur could run up to 60 km/h',
  'Dinosaur fossils have been found on every continent',
  'The word "dinosaur" means "terrible lizard"'
];
const currentFact = ref(facts[0]);

const loadingSteps = ref([...props.steps]);
const showSkipButton = ref(false);

let emojiInterval, messageInterval, factInterval, skipTimer;

const overallProgress = computed(() => {
  const completedSteps = loadingSteps.value.filter(s => s.done).length;
  const activeStep = loadingSteps.value.find(s => s.active && !s.done);
  const totalSteps = loadingSteps.value.length;
  
  let progress = (completedSteps / totalSteps) * 100;
  
  // Add partial progress for active step
  if (activeStep) {
    progress += (1 / totalSteps) * 50; // Half credit for active step
  }
  
  return Math.min(progress, 100);
});

function updateStep(index, status) {
  if (index < loadingSteps.value.length) {
    loadingSteps.value[index] = {
      ...loadingSteps.value[index],
      ...status
    };
  }
}

onMounted(() => {
  // Rotate emojis
  emojiInterval = setInterval(() => {
    currentEmoji.value = emojis[Math.floor(Math.random() * emojis.length)];
  }, 800);
  
  // Rotate messages
  messageInterval = setInterval(() => {
    currentMessage.value = messages[Math.floor(Math.random() * messages.length)];
  }, 2500);
  
  // Rotate facts
  factInterval = setInterval(() => {
    currentFact.value = facts[Math.floor(Math.random() * facts.length)];
  }, 4000);
  
  // Show skip button after 3 seconds
  skipTimer = setTimeout(() => {
    showSkipButton.value = true;
  }, 3000);
});

onUnmounted(() => {
  clearInterval(emojiInterval);
  clearInterval(messageInterval);
  clearInterval(factInterval);
  clearTimeout(skipTimer);
});

// Expose method for parent to update steps
defineExpose({
  updateStep,
  setComplete: () => {
    loadingSteps.value.forEach(step => {
      step.done = true;
      step.active = false;
    });
  }
});
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dino-loader {
  position: relative;
  margin-bottom: 30px;
}

.dino-emoji {
  font-size: 80px;
  display: inline-block;
  animation: dinoBounce 0.6s infinite alternate;
}

.dino-shadow {
  width: 60px;
  height: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  margin: 10px auto 0;
  animation: shadowPulse 0.6s infinite alternate;
}

.loading-message {
  color: #ecf0f1;
  font-size: 1.4em;
  margin: 20px 0;
  min-height: 40px;
}

.loading-steps {
  text-align: left;
  margin: 30px 0;
}

.step {
  display: flex;
  align-items: center;
  padding: 10px;
  margin: 5px 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.step.completed {
  background: rgba(46, 204, 113, 0.1);
}

.step.active {
  background: rgba(52, 152, 219, 0.2);
  animation: pulse 2s infinite;
}

.step.error {
  background: rgba(231, 76, 60, 0.1);
}

.step-icon {
  font-size: 1.2em;
  margin-right: 15px;
}

.step-label {
  color: #bdc3c7;
  flex: 1;
}

.step.completed .step-label {
  color: #2ecc71;
}

.step.active .step-label {
  color: #3498db;
}

.step-progress {
  margin-left: 10px;
}

.dot-pulse {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #3498db;
  border-radius: 50%;
  animation: dotPulse 1s infinite;
}

.progress-container {
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 15px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.5s ease;
  border-radius: 3px;
}

.progress-text {
  color: #bdc3c7;
  font-size: 0.9em;
  min-width: 40px;
}

.dino-fact {
  margin: 25px 0;
  padding: 15px;
  background: rgba(241, 196, 15, 0.1);
  border-radius: 10px;
  border-left: 3px solid #f1c40f;
}

.fact-text {
  color: #f39c12;
  font-style: italic;
}

.skip-button {
  margin-top: 20px;
  padding: 12px 30px;
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 2px solid #e74c3c;
  border-radius: 25px;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.skip-button:hover {
  background: rgba(231, 76, 60, 0.3);
  transform: translateY(-2px);
}

@keyframes dinoBounce {
  from { 
    transform: translateY(0) rotate(-3deg); 
  }
  to { 
    transform: translateY(-15px) rotate(3deg); 
  }
}

@keyframes shadowPulse {
  from { 
    transform: scaleX(1);
    opacity: 0.3;
  }
  to { 
    transform: scaleX(0.7);
    opacity: 0.1;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes dotPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>