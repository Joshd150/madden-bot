/**
 * Polyfills for modern JavaScript features that might not be available in all environments
 * This ensures our code works across different Node.js versions
 */

// Polyfill for Object.groupBy if it doesn't exist
if (!Object.groupBy) {
  Object.groupBy = function<T, K extends PropertyKey>(
    items: Iterable<T>,
    keySelector: (item: T, index: number) => K
  ): Partial<Record<K, T[]>> {
    const result: Partial<Record<K, T[]>> = {};
    let index = 0;
    
    for (const item of items) {
      const key = keySelector(item, index++);
      if (!result[key]) {
        result[key] = [];
      }
      result[key]!.push(item);
    }
    
    return result;
  };
}

// Extend the global Object interface to include groupBy
declare global {
  interface ObjectConstructor {
    groupBy<T, K extends PropertyKey>(
      items: Iterable<T>,
      keySelector: (item: T, index: number) => K
    ): Partial<Record<K, T[]>>;
  }
}

export {};