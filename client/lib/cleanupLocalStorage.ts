/**
 * Utility to clean up corrupted localStorage data that might cause JSON parsing errors
 */

import { cleanInvalidLocalStorageItems, safeRemoveFromLocalStorage } from './safeJsonParse';

/**
 * List of localStorage keys that should contain valid JSON
 */
const JSON_STORAGE_KEYS = [
  'userProfile',
  'studentProfile_contact',
  'studentProfile_skills',
  'studentPrivacy_settings',
  'studentNotification_settings',
  'demoSubscriptionData',
  'companyProfile',
  'companySettings',
  'applicationData',
  'matchingPreferences'
];

/**
 * List of localStorage keys that might contain string values that became "undefined"
 */
const PROBLEMATIC_KEYS = [
  ...JSON_STORAGE_KEYS,
  'authToken',
  'studentProfile_bio',
  'studentProfile_availability',
  'studentProfile_image',
  'studentProfile_passwordChanged',
  'lastApiCall',
  'sessionData'
];

/**
 * Clean up corrupted localStorage data
 * This should be run on app initialization to prevent JSON parsing errors
 */
export function cleanupCorruptedLocalStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  let cleanedCount = 0;
  
  try {
    // Clean up keys that should contain valid JSON
    cleanInvalidLocalStorageItems(JSON_STORAGE_KEYS);
    
    // Clean up keys that might contain "undefined" string
    PROBLEMATIC_KEYS.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        
        // Remove items that are literally the string "undefined", "null", or empty
        if (
          value === 'undefined' || 
          value === 'null' || 
          value === '' ||
          value === 'NaN' ||
          (value && value.trim() === '')
        ) {
          console.warn(`Removing corrupted localStorage item: ${key} = "${value}"`);
          localStorage.removeItem(key);
          cleanedCount++;
        }
        
        // For JSON keys, try to parse and remove if invalid
        if (JSON_STORAGE_KEYS.includes(key) && value) {
          try {
            JSON.parse(value);
          } catch (error) {
            console.warn(`Removing invalid JSON from localStorage: ${key} = "${value}"`);
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        console.warn(`Error cleaning localStorage key "${key}":`, error);
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`✅ Cleaned up ${cleanedCount} corrupted localStorage items`);
    }
    
  } catch (error) {
    console.error('Error during localStorage cleanup:', error);
  }
}

/**
 * Emergency cleanup - removes ALL localStorage data
 * Use this as a last resort if localStorage is completely corrupted
 */
export function emergencyLocalStorageCleanup(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const keysToPreserve = ['authToken']; // Keep only essential data
    const preservedData: Record<string, string> = {};
    
    // Preserve essential data
    keysToPreserve.forEach(key => {
      const value = localStorage.getItem(key);
      if (value && value !== 'undefined' && value !== 'null') {
        preservedData[key] = value;
      }
    });
    
    // Clear everything
    localStorage.clear();
    
    // Restore preserved data
    Object.entries(preservedData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    console.log('🚨 Emergency localStorage cleanup completed');
  } catch (error) {
    console.error('Error during emergency localStorage cleanup:', error);
  }
}

/**
 * Validate localStorage health
 * Returns true if localStorage appears to be working correctly
 */
export function validateLocalStorageHealth(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Test basic localStorage functionality
    const testKey = '__localStorage_test__';
    const testValue = '{"test": true}';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== testValue) {
      console.error('localStorage test failed: value mismatch');
      return false;
    }
    
    // Test JSON parsing
    JSON.parse(testValue);
    
    return true;
  } catch (error) {
    console.error('localStorage health check failed:', error);
    return false;
  }
}

/**
 * Run comprehensive localStorage diagnostics
 */
export function runLocalStorageDiagnostics(): void {
  if (typeof window === 'undefined') {
    return;
  }

  console.log('🔍 Running localStorage diagnostics...');
  
  const isHealthy = validateLocalStorageHealth();
  console.log(`localStorage health: ${isHealthy ? '✅ Healthy' : '❌ Corrupted'}`);
  
  if (!isHealthy) {
    console.log('🔧 Running cleanup...');
    cleanupCorruptedLocalStorage();
    
    const isHealthyAfterCleanup = validateLocalStorageHealth();
    console.log(`localStorage health after cleanup: ${isHealthyAfterCleanup ? '✅ Fixed' : '❌ Still corrupted'}`);
    
    if (!isHealthyAfterCleanup) {
      console.log('🚨 Running emergency cleanup...');
      emergencyLocalStorageCleanup();
    }
  }
  
  // Report localStorage usage
  try {
    const items = Object.keys(localStorage);
    console.log(`📊 localStorage contains ${items.length} items:`, items);
    
    // Check for suspicious values
    items.forEach(key => {
      const value = localStorage.getItem(key);
      if (value === 'undefined' || value === 'null' || value === '') {
        console.warn(`⚠️ Suspicious localStorage value: ${key} = "${value}"`);
      }
    });
  } catch (error) {
    console.error('Error during localStorage diagnostics:', error);
  }
}
