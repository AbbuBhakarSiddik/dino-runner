<template>
  <transition name="modal">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <!-- Close Button -->
        <button class="close-btn" @click="$emit('close')">✕</button>
        
        <!-- Dino Mascot -->
        <div class="mascot">
          <span class="mascot-emoji">🦕</span>
          <div class="mascot-speech">
            {{ isLogin ? 'Welcome back!' : 'Join the herd!' }}
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="auth-tabs">
          <button 
            :class="['tab', { active: isLogin }]"
            @click="isLogin = true"
          >
            Login
          </button>
          <button 
            :class="['tab', { active: !isLogin }]"
            @click="isLogin = false"
          >
            Register
          </button>
        </div>
        
        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="auth-form">
          <!-- Username -->
          <div class="form-group">
            <label for="username">
              <span class="label-icon">👤</span> Username
            </label>
            <input 
              id="username"
              v-model="form.username"
              type="text"
              placeholder="Choose a username"
              required
              minlength="3"
              maxlength="20"
              :class="{ error: errors.username }"
              @input="clearError('username')"
            />
            <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
          </div>
          
          <!-- Email (Register only) -->
          <div v-if="!isLogin" class="form-group">
            <label for="email">
              <span class="label-icon">📧</span> Email
            </label>
            <input 
              id="email"
              v-model="form.email"
              type="email"
              placeholder="dino@example.com"
              required
              :class="{ error: errors.email }"
              @input="clearError('email')"
            />
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>
          
          <!-- Bio (Register only) -->
          <div v-if="!isLogin" class="form-group">
            <label for="bio">
              <span class="label-icon">📝</span> Bio (optional)
            </label>
            <textarea 
              id="bio"
              v-model="form.bio"
              placeholder="Tell us about yourself... 🦖"
              maxlength="200"
              rows="2"
            ></textarea>
            <span class="char-count">{{ form.bio.length }}/200</span>
          </div>
          
          <!-- Password -->
          <div class="form-group">
            <label for="password">
              <span class="label-icon">🔒</span> Password
            </label>
            <div class="password-input">
              <input 
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter password"
                required
                minlength="6"
                :class="{ error: errors.password }"
                @input="clearError('password')"
              />
              <button 
                type="button" 
                class="toggle-password"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
          </div>
          
          <!-- Error Message -->
          <div v-if="formError" class="form-error">
            <span>⚠️</span> {{ formError }}
          </div>
          
          <!-- Submit Button -->
          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="loading" class="loading-spinner"></span>
            <span v-else>{{ isLogin ? '🦕 Login' : '🦖 Create Account' }}</span>
          </button>
        </form>
        
        <!-- Quick Play Option -->
        <div class="quick-play">
          <p>or</p>
          <button class="quick-play-btn" @click="playAsGuest">
            🎮 Play as Guest
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, reactive } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'login', 'register', 'guest']);

const isLogin = ref(true);
const showPassword = ref(false);
const loading = ref(false);
const formError = ref('');

const form = reactive({
  username: '',
  email: '',
  bio: '',
  password: ''
});

const errors = reactive({
  username: '',
  email: '',
  password: ''
});

function clearError(field) {
  errors[field] = '';
  formError.value = '';
}

function validateForm() {
  let isValid = true;
  
  if (form.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
    isValid = false;
  }
  
  if (!isLogin.value && !form.email) {
    errors.email = 'Email is required';
    isValid = false;
  }
  
  if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
    isValid = false;
  }
  
  return isValid;
}

async function handleSubmit() {
  if (!validateForm()) return;
  
  loading.value = true;
  formError.value = '';
  
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const endpoint = isLogin.value ? '/api/auth/login' : '/api/auth/register';
    
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: form.username,
        email: form.email,
        bio: form.bio,
        password: form.password
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Save token
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', form.username);
      
      if (isLogin.value) {
        emit('login', data);
      } else {
        emit('register', data);
      }
      
      resetForm();
      emit('close');
    } else {
      formError.value = data.message || 'Something went wrong';
    }
  } catch (error) {
    // Offline fallback
    console.log('Server unavailable, using local storage');
    localStorage.setItem('username', form.username);
    localStorage.setItem('token', 'guest-token');
    
    if (isLogin.value) {
      emit('login', { username: form.username, offline: true });
    } else {
      emit('register', { username: form.username, offline: true });
    }
    
    resetForm();
    emit('close');
  } finally {
    loading.value = false;
  }
}

function playAsGuest() {
  const guestName = `Dino${Math.floor(Math.random() * 9999)}`;
  localStorage.setItem('username', guestName);
  localStorage.setItem('token', 'guest-token');
  emit('guest', { username: guestName });
  emit('close');
}

function resetForm() {
  form.username = '';
  form.email = '';
  form.bio = '';
  form.password = '';
  errors.username = '';
  errors.email = '';
  errors.password = '';
  formError.value = '';
  isLogin.value = true;
}
</script>

<style scoped>
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
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 450px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #95a5a6;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #2c3e50;
}

.mascot {
  text-align: center;
  margin-bottom: 20px;
}

.mascot-emoji {
  font-size: 4em;
  display: block;
  animation: bounce 1s infinite;
}

.mascot-speech {
  background: #f0f0f0;
  padding: 10px 20px;
  border-radius: 20px;
  display: inline-block;
  margin-top: 10px;
  font-weight: 500;
  color: #2c3e50;
  position: relative;
}

.mascot-speech::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid #f0f0f0;
}

.auth-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background: #f8f9fa;
  padding: 5px;
  border-radius: 15px;
}

.tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  color: #7f8c8d;
}

.tab.active {
  background: white;
  color: #2c3e50;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.label-icon {
  margin-right: 5px;
}

input, textarea {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
  font-family: inherit;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

input.error, textarea.error {
  border-color: #e74c3c;
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.3em;
  cursor: pointer;
  padding: 5px;
}

.error-text {
  color: #e74c3c;
  font-size: 0.85em;
  margin-top: 5px;
  display: block;
}

.char-count {
  font-size: 0.85em;
  color: #95a5a6;
  text-align: right;
  display: block;
  margin-top: 5px;
}

.form-error {
  background: #fdf0ef;
  color: #e74c3c;
  padding: 10px 15px;
  border-radius: 10px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3498db, #2ecc71);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(52, 152, 219, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.quick-play {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.quick-play p {
  color: #95a5a6;
  margin-bottom: 10px;
}

.quick-play-btn {
  padding: 10px 25px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.quick-play-btn:hover {
  background: #e8f4fd;
  border-color: #3498db;
  color: #3498db;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(20px);
}
</style>