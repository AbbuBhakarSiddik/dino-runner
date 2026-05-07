// client/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import GameView from '../views/GameView.vue';
import ProfileView from '../views/ProfileView.vue';
import LeaderboardView from '../views/LeaderboardView.vue';

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
        meta: {
            title: '🦕 Dino Runner - Home',
            description: 'Play the classic dinosaur runner game online!'
        }
    },
    {
        path: '/play',
        name: 'play',
        component: GameView,
        meta: {
            title: '🎮 Play Dino Runner',
            description: 'Start playing Dino Runner - How long can you survive?'
        }
    },
    {
        path: '/leaderboard',
        name: 'leaderboard',
        component: LeaderboardView,
        meta: {
            title: '🏆 Leaderboard - Dino Runner',
            description: 'Check the top scores and compete with players worldwide!'
        }
    },
    {
        path: '/profile',
        name: 'profile',
        component: ProfileView,
        meta: {
            title: '👤 Profile - Dino Runner',
            requiresAuth: true
        }
    },
    {
        // Catch all redirect to home
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { top: 0 };
        }
    }
});

// Navigation guard for protected routes
router.beforeEach((to, from, next) => {
    // Update page title
    document.title = to.meta.title || '🦕 Dino Runner';

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && to.meta.description) {
        metaDescription.setAttribute('content', to.meta.description);
    }

    // Check if route requires authentication
    if (to.meta.requiresAuth) {
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to home with query param to open auth
            next({
                path: '/',
                query: { auth: 'true' }
            });
        } else {
            next();
        }
    } else {
        next();
    }
});

export default router;