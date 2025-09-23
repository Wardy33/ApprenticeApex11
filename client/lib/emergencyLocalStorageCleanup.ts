/**
 * Emergency localStorage cleanup that runs immediately on import
 * This is designed to handle corrupted localStorage data in production
 * before the React app tries to render and crashes
 */

/**
 * Immediately clean corrupted localStorage data
 * This runs synchronously on import to prevent React app crashes
 */
function emergencyCleanup() {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  console.log('🚨 Running emergency localStorage cleanup...');

  try {
    const keysToCheck = [
      'userProfile',
      'authToken',
      'studentProfile_contact',
      'studentProfile_skills',
      'studentPrivacy_settings',
      'studentNotification_settings',
      'demoSubscriptionData',
      'companyProfile',
      'studentProfile_bio',
      'studentProfile_availability',
      'studentProfile_image'
    ];

    let cleanedCount = 0;

    keysToCheck.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        
        // Remove obviously corrupted values
        if (value === 'undefined' || value === 'null' || value === '' || value === 'NaN') {
          console.warn(`🧹 Removing corrupted localStorage item: ${key} = "${value}"`);
          localStorage.removeItem(key);
          cleanedCount++;
          return;
        }

        // For keys that should contain JSON, test parsing
        const jsonKeys = [
          'userProfile',
          'studentProfile_contact', 
          'studentProfile_skills',
          'studentPrivacy_settings',
          'studentNotification_settings',
          'demoSubscriptionData',
          'companyProfile'
        ];

        if (jsonKeys.includes(key) && value) {
          try {
            JSON.parse(value);
          } catch (parseError) {
            console.warn(`🧹 Removing invalid JSON from localStorage: ${key} = "${value}"`);
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        console.warn(`Error checking localStorage key "${key}":`, error);
        // If there's any error with this key, remove it to be safe
        try {
          localStorage.removeItem(key);
          cleanedCount++;
        } catch (removeError) {
          console.error(`Failed to remove problematic key "${key}":`, removeError);
        }
      }
    });

    if (cleanedCount > 0) {
      console.log(`✅ Emergency cleanup completed: ${cleanedCount} corrupted items removed`);
    } else {
      console.log('✅ Emergency cleanup completed: no corrupted items found');
    }

  } catch (error) {
    console.error('🚨 Emergency localStorage cleanup failed:', error);
    
    // If cleanup fails completely, try to clear everything as last resort
    try {
      console.log('🚨 Attempting complete localStorage clear...');
      const authToken = localStorage.getItem('authToken');
      localStorage.clear();
      
      // Restore auth token if it was valid
      if (authToken && authToken !== 'undefined' && authToken !== 'null') {
        localStorage.setItem('authToken', authToken);
      }
      
      console.log('✅ Complete localStorage clear completed');
    } catch (clearError) {
      console.error('🚨 Complete localStorage clear failed:', clearError);
    }
  }
}

/**
 * Safe JSON parse function for immediate use
 */
function safeParseJSON(str: string | null, fallback: any = null) {
  if (!str || str === 'undefined' || str === 'null') {
    return fallback;
  }
  
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Validate that localStorage is working
 */
function validateLocalStorage(): boolean {
  try {
    const testKey = '__test_' + Date.now();
    const testValue = '{"test":true}';
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== testValue) {
      throw new Error('localStorage test failed');
    }
    
    JSON.parse(testValue);
    return true;
  } catch {
    return false;
  }
}

// Run emergency cleanup immediately on import
if (typeof window !== 'undefined') {
  try {
    emergencyCleanup();
    
    // Validate localStorage is now working
    if (!validateLocalStorage()) {
      console.error('🚨 localStorage still not working after cleanup');
    } else {
      console.log('✅ localStorage validated as working');
    }
  } catch (error) {
    console.error('🚨 Emergency cleanup initialization failed:', error);
  }
}

export { emergencyCleanup, safeParseJSON, validateLocalStorage };
