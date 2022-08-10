/**
 * Compute the differences between two objects of the same type, returning the properties which have different values
 * @param original Original object
 * @param modified Modified object
 * @returns Partial containing only properties of changed which have a different value to original
 */
export const getChangedProperties = <T,>(original: T, modified: T) =>
  Object.entries(modified).reduce(
    (a: Partial<T>, b) => {
      const key = b[0] as keyof T;
      const value = b[1];

      if (key && original[key] !== value) {
        return { ...a, [key]: value }
      } else {
        return a;
      }
    },
    {}
  );

/**
 * Check if a partial has any properties that are defined (i.e. !== undefined)
 * @param partial Partial object
 * @returns True if there is at least one property of partial that is defined
 */
export const hasDefined = <T,>(partial: Partial<T>) => Object.entries(partial).some(([_, v]) => v !== undefined);
