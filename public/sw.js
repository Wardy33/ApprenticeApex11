// ApprenticeApex Service Worker for Performance Optimization
// Implements caching strategies for static assets and API responses

const CACHE_NAME = "apprenticeapex-v1.0.0";
const STATIC_CACHE = "apprenticeapex-static-v1.0.0";
const DYNAMIC_CACHE = "apprenticeapex-dynamic-v1.0.0";

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/global.css",
  "/accessibility.css",
  // Add critical CSS and JS files as they are built
];

// API endpoints to cache with specific strategies
// NOTE: /api/apprenticeships/public is NOT cached to ensure fresh job data
const API_CACHE_PATTERNS = [
  /^\/api\/health/,
  /^\/api\/test/,
  /^\/api\/company\/search/,
];

// API endpoints that should NEVER be cached (always fetch fresh)
const NO_CACHE_API_PATTERNS = [
  /^\/api\/apprenticeships\/public/,
  /^\/api\/email\/subscribe/,
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      }),
      // Force immediate activation
      self.skipWaiting(),
    ]),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== CACHE_NAME
            ) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ]),
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Check if request is for static asset
function isStaticAsset(url) {
  return url.pathname.match(
    /\.(css|js|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif)$/,
  );
}

// Check if request is API call
function isAPIRequest(url) {
  return url.pathname.startsWith("/api/");
}

// Check if request is for image
function isImageRequest(url) {
  return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/);
}

// Handle static assets - Cache First strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);

    if (cached) {
      // Return cached version immediately
      console.log("[SW] Serving from cache:", request.url);
      return cached;
    }

    // Fetch and cache if not found
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log("[SW] Static asset fetch failed:", error);
    // Return offline fallback if available
    return new Response("Asset not available offline", { status: 503 });
  }
}

// Handle API requests - Network First with cache fallback
async function handleAPIRequest(request) {
  try {
    // Check if this API should never be cached
    if (shouldNeverCacheAPI(request.url)) {
      console.log("[SW] Force no cache for:", request.url);
      // Always fetch fresh, no caching at all
      const response = await fetch(request, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      return response;
    }

    const cache = await caches.open(DYNAMIC_CACHE);

    // Try network first
    try {
      const response = await fetch(request);

      // Cache successful GET responses for specific endpoints
      if (response.status === 200 && shouldCacheAPI(request.url)) {
        cache.put(request, response.clone());
      }

      return response;
    } catch (networkError) {
      // Network failed, try cache
      console.log("[SW] Network failed, checking cache for:", request.url);
      const cached = await cache.match(request);

      if (cached) {
        console.log("[SW] Serving API from cache:", request.url);
        return cached;
      }

      // Return error response
      return new Response(
        JSON.stringify({
          error: "Network unavailable",
          offline: true,
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.log("[SW] API request failed:", error);
    return new Response("Service unavailable", { status: 503 });
  }
}

// Handle image requests - Cache First with network fallback
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Fetch from network
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log("[SW] Image fetch failed:", error);
    // Return placeholder or empty response
    return new Response("Image not available", { status: 503 });
  }
}

// Handle page requests - Network First for HTML
async function handlePageRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);

    // Try network first
    try {
      const response = await fetch(request);

      // Cache successful HTML responses
      if (
        response.status === 200 &&
        response.headers.get("content-type")?.includes("text/html")
      ) {
        cache.put(request, response.clone());
      }

      return response;
    } catch (networkError) {
      // Network failed, try cache
      const cached = await cache.match(request);

      if (cached) {
        return cached;
      }

      // Return offline page or index.html as fallback
      const indexCache = await cache.match("/");
      if (indexCache) {
        return indexCache;
      }

      return new Response("Page not available offline", {
        status: 503,
        headers: { "Content-Type": "text/html" },
      });
    }
  } catch (error) {
    console.log("[SW] Page request failed:", error);
    return new Response("Page not available", { status: 503 });
  }
}

// Check if API endpoint should be cached
function shouldCacheAPI(url) {
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(url));
}

// Check if API endpoint should never be cached
function shouldNeverCacheAPI(url) {
  return NO_CACHE_API_PATTERNS.some((pattern) => pattern.test(url));
}

// Listen for messages from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName)),
        );
      })
      .then(() => {
        event.ports[0].postMessage({ success: true });
      });
  }

  // EMERGENCY CACHE CLEAR - Clear all caches completely
  if (event.data && event.data.type === "CLEAR_ALL_CACHES") {
    console.log("[SW] EMERGENCY CACHE CLEAR - Deleting all caches");
    caches
      .keys()
      .then((cacheNames) => {
        console.log("[SW] Found caches to delete:", cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("[SW] Deleting cache:", cacheName);
            return caches.delete(cacheName);
          }),
        );
      })
      .then(() => {
        console.log("[SW] All caches cleared successfully");
        // Respond if there's a message channel
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true, cleared: true });
        }
      })
      .catch((error) => {
        console.error("[SW] Error clearing caches:", error);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      });
  }

  if (event.data && event.data.type === "CLEAR_APPRENTICESHIPS_CACHE") {
    console.log("[SW] Clearing apprenticeships specific cache");
    caches
      .open(DYNAMIC_CACHE)
      .then((cache) => {
        return cache.keys().then((requests) => {
          const deletePromises = requests.map((request) => {
            if (request.url.includes("/api/apprenticeships")) {
              console.log(
                "[SW] Clearing apprenticeships cache for:",
                request.url,
              );
              return cache.delete(request);
            }
            return Promise.resolve();
          });
          return Promise.all(deletePromises);
        });
      })
      .then(() => {
        console.log("[SW] Apprenticeships cache cleared");
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
      .catch((error) => {
        console.error("[SW] Error clearing apprenticeships cache:", error);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      });
  }
});

// Handle errors
self.addEventListener("error", (event) => {
  console.error("[SW] Service worker error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("[SW] Unhandled promise rejection:", event.reason);
});

console.log("[SW] Service worker loaded successfully");
