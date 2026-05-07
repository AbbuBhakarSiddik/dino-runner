// service-worker.js
const CACHE_NAME = 'dino-runner-v1';
const DYNAMIC_CACHE = 'dino-runner-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/favicon.ico',
    '/manifest.json',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🦕 Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('🦕 Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('🦕 Service Worker: Install complete');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('🦕 Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                            console.log('🦕 Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('🦕 Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and API calls
    if (
        event.request.method !== 'GET' ||
        event.request.url.includes('/api/') ||
        event.request.url.includes('socket.io')
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone response for caching
                const responseClone = response.clone();

                // Cache dynamic content
                caches.open(DYNAMIC_CACHE)
                    .then((cache) => {
                        cache.put(event.request, responseClone);
                    });

                return response;
            })
            .catch(() => {
                // Offline fallback
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        // Return index.html for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }

                        // Return offline fallback
                        return new Response(
                            JSON.stringify({
                                error: 'You are offline',
                                message: '🏜️ Don\'t worry! You can still play the game!'
                            }),
                            {
                                status: 503,
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    });
            })
    );
});

// Background sync for offline scores
self.addEventListener('sync', (event) => {
    console.log('🦕 Service Worker: Background sync:', event.tag);

    if (event.tag === 'sync-scores') {
        event.waitUntil(syncPendingScores());
    }
});

// Push notification
self.addEventListener('push', (event) => {
    console.log('🦕 Service Worker: Push received');

    const options = {
        body: event.data ? event.data.text() : '🦕 New challenge available!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            { action: 'play', title: '🎮 Play Now' },
            { action: 'close', title: '❌ Close' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Dino Runner', options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('🦕 Service Worker: Notification clicked');

    event.notification.close();

    if (event.action === 'play') {
        event.waitUntil(
            clients.openWindow('/play')
        );
    }
});

// Message from main thread
self.addEventListener('message', (event) => {
    console.log('🦕 Service Worker: Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Helper function to sync pending scores
async function syncPendingScores() {
    console.log('🦕 Service Worker: Syncing pending scores...');

    try {
        // Get pending scores from IndexedDB or localStorage
        const db = await openDatabase();
        const pendingScores = await getPendingScores(db);

        if (pendingScores.length === 0) {
            console.log('🦕 Service Worker: No pending scores to sync');
            return;
        }

        console.log(`🦕 Service Worker: Syncing ${pendingScores.length} scores`);

        // Try to sync each score
        let synced = 0;
        for (const score of pendingScores) {
            try {
                const response = await fetch('/api/scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(score)
                });

                if (response.ok) {
                    await removePendingScore(db, score.id);
                    synced++;
                }
            } catch (error) {
                console.error('Failed to sync score:', error);
                break; // Stop if offline
            }
        }

        console.log(`🦕 Service Worker: Synced ${synced}/${pendingScores.length} scores`);

        // Notify all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SCORES_SYNCED',
                synced: synced,
                total: pendingScores.length
            });
        });

    } catch (error) {
        console.error('🦕 Service Worker: Sync failed:', error);
    }
}

// Simple IndexedDB wrapper for service worker
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DinoRunnerDB', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pendingScores')) {
                db.createObjectStore('pendingScores', { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function getPendingScores(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pendingScores'], 'readonly');
        const store = transaction.objectStore('pendingScores');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function removePendingScore(db, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pendingScores'], 'readwrite');
        const store = transaction.objectStore('pendingScores');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}