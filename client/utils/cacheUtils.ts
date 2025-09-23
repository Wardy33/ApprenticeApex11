// Cache clearing utilities for Search Jobs page

export const clearAllCaches = async (): Promise<void> => {
  console.log("🧹 Starting comprehensive cache clearing...");

  try {
    // 1. Clear service worker caches
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      // Clear specific apprenticeships cache
      navigator.serviceWorker.controller.postMessage({
        type: "CLEAR_APPRENTICESHIPS_CACHE",
      });

      // Clear all caches
      navigator.serviceWorker.controller.postMessage({
        type: "CLEAR_CACHE",
      });

      console.log("✅ Service worker caches cleared");
    }

    // 2. Clear browser caches
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          await caches.delete(cacheName);
          console.log("✅ Deleted cache:", cacheName);
        }),
      );
    }

    // 3. Clear session storage
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
      console.log("✅ Session storage cleared");
    }

    // 4. Clear relevant local storage items
    if (typeof localStorage !== "undefined") {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes("job") ||
            key.includes("apprentice") ||
            key.includes("search"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
        console.log("✅ Removed localStorage item:", key);
      });
    }

    console.log("🎉 All caches cleared successfully");
  } catch (error) {
    console.error("❌ Error clearing caches:", error);
  }
};

export const forceRefreshServiceWorker = async (): Promise<void> => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Force update
      await registration.update();

      // Skip waiting if there's a waiting worker
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      console.log("🔄 Service worker updated");
    } catch (error) {
      console.error("❌ Error updating service worker:", error);
    }
  }
};

export const forcePageRefresh = (): void => {
  console.log("🔄 Force refreshing page with cache bypass...");

  // Force reload bypassing cache
  if ("location" in window) {
    window.location.reload();
  }
};

// Clear caches and force refresh
export const nuclearCacheClear = async (): Promise<void> => {
  console.log("💥 NUCLEAR CACHE CLEAR - Clearing everything...");

  await clearAllCaches();
  await forceRefreshServiceWorker();

  // Wait a bit for service worker to update
  setTimeout(() => {
    forcePageRefresh();
  }, 1000);
};
