import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

app.config.errorHandler = (err, instance, info) => {
    console.error('Global error:', err);
};

app.mount('#app');

// Register service worker for PWA (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('🦕 Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.log('🦕 Service Worker registration skipped in dev mode');
            });
    });
}