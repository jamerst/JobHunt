import React, { useCallback, useEffect, useRef, useState  } from "react";
import { Autocomplete, AutocompleteProps } from "@mui/material";
import dayjs from "dayjs";

type ApiAutocompleteProps<
  T,
  M extends boolean | undefined,
  D extends boolean | undefined,
  F extends boolean | undefined
> = Omit<AutocompleteProps<T, M, D, F>, "options"> & {
    fetchUrl: string,
    getResponseOptions: (response: any) => T[],
    cacheExpiry?: number
  }

type CachedOptions<T> = {
  options: T[],
  fetched: string
}

const ApiAutocomplete = <
  T,
  M extends boolean | undefined,
  D extends boolean | undefined,
  F extends boolean | undefined
>
({ fetchUrl, getResponseOptions, cacheExpiry = 5, ...rest }: ApiAutocompleteProps<T, M, D, F>) => {
  const [options, setOptions] = useState<T[]>([]);
  const optionsFetched = useRef(false);

  const fetchOptions = useCallback(async () => {
    if (optionsFetched.current) {
      return;
    }

    optionsFetched.current = true;

    const cacheKey = `ApiAutocomplete_${fetchUrl}`;
    const cachedString = window.localStorage.getItem(cacheKey);
    const cached = cachedString ? JSON.parse(cachedString) as CachedOptions<T> : null;

    if (cached?.fetched && !dayjs(cached.fetched).isBefore(dayjs().subtract(cacheExpiry, "minute"))) {
      setOptions(cached.options);
    } else {
      const response = await fetch(fetchUrl);

      if (response.ok) {
        const data = getResponseOptions(await response.json());
        window.localStorage.setItem(cacheKey, JSON.stringify({ fetched: dayjs(), options: data }));
        setOptions(data);
      } else {
        console.error(`API request failed: GET ${fetchUrl}, HTTP ${response.status}`);
      }
    }

  }, [fetchUrl, getResponseOptions, cacheExpiry]);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  return <Autocomplete {...rest} options={options} />;
}

export default ApiAutocomplete;