// Service Worker Registration and Management for ApprenticeApex
// Implements progressive web app features and caching strategies

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
}

// Check if service workers are supported
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      if (isLocalhost) {
        // Check if service worker exists in localhost
        checkValidServiceWorker(swUrl, config);
        
        // Log additional info for localhost
        navigator.serviceWorker.ready.then(() => {
          console.log('[SW] App is running from cache in development mode');
        });
      } else {
        // Register service worker in production
        registerValidServiceWorker(swUrl, config);
      }
    });
  }
}

function registerValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW] Service worker registered successfully');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available, notify user
              console.log('[SW] New content available, will update on next visit');
              
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              } else {
                // Show default update notification
                showUpdateNotification(registration);
              }
            } else {
              // Content cached for offline use
              console.log('[SW] Content cached for offline use');
              
              if (config && config.onOfflineReady) {
                config.onOfflineReady();
              } else {
                showOfflineReadyNotification();
              }
            }
          }
        };
      };

      if (config && config.onSuccess) {
        config.onSuccess(registration);
      }
    })
    .catch((error) => {
      console.error('[SW] Service worker registration failed:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' }
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidServiceWorker(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection found. App is running in offline mode.');
    });
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[SW] Service worker unregistration failed:', error);
      });
  }
}

// Update service worker when new version is available
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }
}

// Check if app is running offline
export function isAppOffline(): boolean {
  return !navigator.onLine;
}

// Listen for online/offline events
export function setupOfflineDetection() {
  window.addEventListener('online', () => {
    console.log('[SW] App back online');
    updateLiveRegion('Connection restored');
    hideOfflineIndicator();
  });

  window.addEventListener('offline', () => {
    console.log('[SW] App went offline');
    updateLiveRegion('App is now offline. Some features may be limited.');
    showOfflineIndicator();
  });
}

// Show update notification to user
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.className = 'fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'assertive');
  
  notification.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <h4 class="font-semibold mb-1">Update Available</h4>
        <p class="text-sm opacity-90">A new version of ApprenticeApex is ready.</p>
      </div>
      <button 
        id="sw-update-btn" 
        class="ml-4 bg-white text-blue-600 px-3 py-1 rounded font-medium hover:bg-gray-100 transition-colors focus-indicator"
        aria-label="Update to new version"
      >
        Update
      </button>
    </div>
    <button 
      id="sw-dismiss-btn" 
      class="absolute top-2 right-2 text-white opacity-70 hover:opacity-100"
      aria-label="Dismiss notification"
    >
      ×
    </button>
  `;
  
  document.body.appendChild(notification);
  
  // Handle update button click
  document.getElementById('sw-update-btn')?.addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });
  
  // Handle dismiss button
  document.getElementById('sw-dismiss-btn')?.addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// Show offline ready notification
function showOfflineReadyNotification() {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');
  
  notification.innerHTML = `
    <div class="flex items-center">
      <div>
        <h4 class="font-semibold mb-1">App Ready for Offline Use</h4>
        <p class="text-sm opacity-90">ApprenticeApex is now available offline.</p>
      </div>
      <button 
        class="ml-4 text-white opacity-70 hover:opacity-100"
        onclick="this.parentElement.parentElement.remove()"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Show offline indicator
function showOfflineIndicator() {
  let indicator = document.getElementById('offline-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'fixed top-0 left-0 right-0 bg-yellow-600 text-white text-center py-2 z-50';
    indicator.setAttribute('role', 'alert');
    indicator.setAttribute('aria-live', 'polite');
    indicator.innerHTML = `
      <span class="text-sm font-medium">
        📡 You're offline. Some features may be limited.
      </span>
    `;
    document.body.appendChild(indicator);
  }
}

// Hide offline indicator
function hideOfflineIndicator() {
  const indicator = document.getElementById('offline-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// Update live region for screen readers
function updateLiveRegion(message: string) {
  const liveRegion = document.getElementById('live-region');
  if (liveRegion) {
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}

// Performance monitoring
export function trackPerformanceMetrics() {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      // Get Core Web Vitals
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics = {
        // First Contentful Paint
        fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        // Largest Contentful Paint
        lcp: 0, // Will be measured by observer
        // Cumulative Layout Shift
        cls: 0, // Will be measured by observer
        // First Input Delay
        fid: 0, // Will be measured by observer
        // Time to Interactive
        tti: navigation.loadEventEnd - navigation.fetchStart,
        // Total Page Load Time
        loadTime: navigation.loadEventEnd - navigation.fetchStart
      };
      
      console.log('[Performance]', metrics);
      
      // Send to analytics if configured
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_load_performance', {
          custom_map: { metric_1: 'load_time' },
          metric_1: metrics.loadTime
        });
      }
    });
  }
}

// Initialize all service worker features
export function initializeServiceWorker() {
  // Register service worker
  registerServiceWorker({
    onSuccess: () => {
      console.log('[SW] Service worker registered successfully');
    },
    onUpdate: (registration) => {
      console.log('[SW] New service worker available');
      showUpdateNotification(registration);
    },
    onOfflineReady: () => {
      console.log('[SW] App ready for offline use');
      showOfflineReadyNotification();
    }
  });
  
  // Setup offline detection
  setupOfflineDetection();
  
  // Track performance metrics
  trackPerformanceMetrics();
  
  // Show offline indicator if already offline
  if (isAppOffline()) {
    showOfflineIndicator();
  }
}
