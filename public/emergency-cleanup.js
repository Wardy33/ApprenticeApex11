/**
 * EMERGENCY localStorage cleanup script
 * This runs immediately when the HTML loads, before any React code
 * Designed to fix production crashes from corrupted localStorage
 */

(function() {
  'use strict';
  
  // Only run in browser with localStorage support
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  console.log('🚨 EMERGENCY: Running localStorage cleanup...');

  try {
    // Keys that are known to cause JSON parsing issues
    var problematicKeys = [
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
      'studentProfile_image',
      'studentProfile_passwordChanged'
    ];

    var cleanedCount = 0;

    // Check each key for corruption
    for (var i = 0; i < problematicKeys.length; i++) {
      var key = problematicKeys[i];
      
      try {
        var value = localStorage.getItem(key);
        
        // Remove obviously corrupted values
        if (value === 'undefined' || value === 'null' || value === '' || value === 'NaN') {
          console.warn('🧹 Removing corrupted item: ' + key + ' = "' + value + '"');
          localStorage.removeItem(key);
          cleanedCount++;
          continue;
        }

        // For JSON keys, test parsing
        var jsonKeys = [
          'userProfile',
          'studentProfile_contact', 
          'studentProfile_skills',
          'studentPrivacy_settings',
          'studentNotification_settings',
          'demoSubscriptionData',
          'companyProfile'
        ];

        if (value && jsonKeys.indexOf(key) !== -1) {
          try {
            JSON.parse(value);
          } catch (parseError) {
            console.warn('🧹 Removing invalid JSON: ' + key + ' = "' + (value.length > 50 ? value.substring(0, 50) + '...' : value) + '"');
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        console.warn('Error checking key "' + key + '":', error);
        try {
          localStorage.removeItem(key);
          cleanedCount++;
        } catch (removeError) {
          console.error('Failed to remove key "' + key + '":', removeError);
        }
      }
    }

    // Test localStorage functionality
    try {
      var testKey = '__emergency_test_' + Date.now();
      var testValue = '{"test":true}';
      localStorage.setItem(testKey, testValue);
      var retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved !== testValue) {
        throw new Error('localStorage test failed');
      }
      
      JSON.parse(testValue);
      
      if (cleanedCount > 0) {
        console.log('✅ EMERGENCY cleanup completed: ' + cleanedCount + ' corrupted items removed');
      } else {
        console.log('✅ EMERGENCY cleanup completed: no corrupted items found');
      }
      
    } catch (testError) {
      console.error('🚨 localStorage still not working after cleanup:', testError);
      
      // Last resort: clear everything except auth token
      try {
        console.log('🚨 Attempting complete localStorage clear...');
        var authToken = localStorage.getItem('authToken');
        localStorage.clear();
        
        // Restore auth token if it was valid
        if (authToken && authToken !== 'undefined' && authToken !== 'null' && authToken !== '') {
          localStorage.setItem('authToken', authToken);
        }
        
        console.log('✅ Complete localStorage clear completed');
      } catch (clearError) {
        console.error('🚨 Complete localStorage clear failed:', clearError);
      }
    }

  } catch (error) {
    console.error('🚨 EMERGENCY cleanup completely failed:', error);
  }
})();
