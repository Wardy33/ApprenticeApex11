/**
 * Safe JSON parsing utility that handles edge cases and prevents errors
 * when parsing localStorage values or API responses that might be undefined, null, or invalid JSON
 */

/**
 * Safely parse JSON string with fallback value
 * @param jsonString - The string to parse
 * @param fallback - Default value if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  // Handle null, undefined, or empty string cases
  if (!jsonString || jsonString === 'undefined' || jsonString === 'null') {
    return fallback;
  }

  // Handle string that is just whitespace
  if (typeof jsonString === 'string' && jsonString.trim() === '') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonString);
    
    // Additional safety check - if parsed result is null or undefined, return fallback
    if (parsed === null || parsed === undefined) {
      return fallback;
    }
    
    return parsed;
  } catch (error) {
    console.warn('Failed to parse JSON string:', jsonString, 'Error:', error);
    return fallback;
  }
}

/**
 * Safe localStorage getter with JSON parsing
 * @param key - localStorage key
 * @param fallback - Default value if key doesn't exist or parsing fails
 * @returns Parsed object or fallback value
 */
export function safeGetFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const item = localStorage.getItem(key);
    return safeJsonParse(item, fallback);
  } catch (error) {
    console.warn(`Failed to get item from localStorage with key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safe localStorage setter with JSON stringification
 * @param key - localStorage key
 * @param value - Value to store
 * @returns Success boolean
 */
export function safeSetToLocalStorage(key: string, value: any): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.warn(`Failed to set item to localStorage with key "${key}":`, error);
    return false;
  }
}

/**
 * Safe localStorage remover
 * @param key - localStorage key to remove
 */
export function safeRemoveFromLocalStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove item from localStorage with key "${key}":`, error);
  }
}

/**
 * Check if a string is valid JSON
 * @param str - String to validate
 * @returns True if valid JSON, false otherwise
 */
export function isValidJson(str: string | null | undefined): boolean {
  if (!str || str === 'undefined' || str === 'null') {
    return false;
  }

  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean localStorage of invalid JSON values
 * @param keysToCheck - Array of localStorage keys to validate and clean
 */
export function cleanInvalidLocalStorageItems(keysToCheck: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  keysToCheck.forEach(key => {
    try {
      const item = localStorage.getItem(key);
      if (item && !isValidJson(item)) {
        console.warn(`Removing invalid JSON from localStorage key "${key}":`, item);
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error checking localStorage key "${key}":`, error);
    }
  });
}
