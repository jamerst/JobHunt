export type Expand = {
  navigationField: string,
  select?: string
}

export const ExpandToQuery = (e: Expand) => {
  let result = `${e.navigationField}`;

  const options = [`$select=${e.select}`];
  if (options.some(o => o !== undefined)) {
    result += `(${options.filter(o => o !== undefined).join(";")})`
  }

  return result;
}

export const GroupArrayBy = <TKey, T,>(arr: T[], keySelector: (e: T) => TKey) => arr
  .reduce((m, e) => m.set(keySelector(e), [...m.get(keySelector(e)) || [], e]), new Map<TKey, T[]>());

export const Flatten = (obj: any, prefix = "", sep = ".") => {
  return Object.keys(obj).reduce((x: { [key: string]: any }, k) => {
    const pre = prefix.length ? prefix + sep : "";
    if (typeof obj[k] === "object") {
      Object.assign(x, Flatten(obj[k], pre + k, sep));
    } else {
      x[pre + k] = obj[k];
    }
    return x;
  }, {});
}