import { PageSettings } from "./types";

import { defaultPageSize } from "./constants";

export type Expand = {
  navigationField: string,
  select?: string,
  expand?: Expand
}

export const ExpandToQuery = (e?: Expand) => {
  if (e === undefined) {
    return "";
  }

  let result = `${e.navigationField}`;

  const options = [
    { type: "select", value: `${e.select}` },
    { type: "expand", value: ExpandToQuery(e.expand)}
  ];

  if (options.some(o => o.value)) {
    result += `(${options.filter(o => o.value).map(o => `$${o.type}=${o.value}`).join(";")})`
  }

  return result;
}

export const GroupArrayBy = <TKey, T,>(arr: T[], keySelector: (e: T) => TKey) => arr
  .reduce((m, e) => m.set(keySelector(e), [...m.get(keySelector(e)) || [], e]), new Map<TKey, T[]>());

export const Flatten = (obj: any, sep = ".", prefix = "") => {
  return Object.keys(obj).reduce((x: { [key: string]: any }, k) => {
    const pre = prefix.length ? prefix + sep : "";
    if (Array.isArray(obj[k])) {
      x[pre + k] = (obj[k] as Array<any>).map(i => Flatten(i, sep));
    } else if (typeof obj[k] === "object") {
      Object.assign(x, Flatten(obj[k], sep, pre + k));
    } else {
      x[pre + k] = obj[k];
    }
    return x;
  }, {});
}

export const GetPageSettingsOrDefault = (): PageSettings => {
  let settings = { page: 0, size: defaultPageSize };

  const params = new URLSearchParams(window.location.search);
  if (params.has("page") || params.has("page-size")) {
    const pageVal = params.get("page");
    if (pageVal) {
      settings.page = parseInt(pageVal, 10);
    }

    const sizeVal = params.get("page-size");
    if (sizeVal) {
      settings.size = parseInt(sizeVal, 10);
    }
  }

  return settings;
}