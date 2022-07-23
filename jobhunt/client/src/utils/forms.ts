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
