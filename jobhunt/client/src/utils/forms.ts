/**
 * Compute the differences between two objects of the same type, returning the properties which have different values
 * @param original Original object
 * @param modified Modified object
 * @returns Partial containing only properties of changed which have a different value to original
 */
export const getChangedProperties = <T extends Record<string, unknown>,>(original: T, modified: T) => {
  const keys = new Set<string>();
  Object.keys(original).forEach(k => keys.add(k));
  Object.keys(modified).forEach(k => keys.add(k));

  return Array.from(keys).reduce(
    (a: Partial<T>, k) => {
      const key = k as keyof T;
      const oldValue = original[key];
      const newValue = modified[key] !== undefined ? modified[key] : null;

      if (key && oldValue !== newValue) {
        return { ...a, [key]: newValue }
      } else {
        return a;
      }
    },
    {}
  );
}

/**
 * Check if a partial has any properties that are defined (i.e. !== undefined)
 * @param partial Partial object
 * @returns True if there is at least one property of partial that is defined
 */
export const hasDefined = <T,>(partial: Partial<T>) => Object.entries(partial).some(([ , v]) => v !== undefined);
