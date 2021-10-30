export type Expand = {
  navigationField: string,
  select?: string
}

export const ExpandToQuery = (e: Expand) => {
  let result = `${e.navigationField}`;

  const options = [e.select];
  if (options.some(o => o !== undefined)) {
    result += `(${options.filter(o => o !== undefined).join(";")})`
  }

  return result;
}

export const GroupArrayBy = <TKey, T,>(arr: T[], keySelector: (e: T) => TKey) => arr
  .reduce((m, e) => m.set(keySelector(e), [...m.get(keySelector(e))||[], e]), new Map<TKey, T[]>())