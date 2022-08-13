import React, { useCallback, useMemo } from "react"
import data from "utils/countries.json"
import { Autocomplete } from "mui-rff"

type CountrySelectorProps = {
  name: string,
  label: string,
  required?: boolean,
  allowedCountries?: string[],
  hideForbiddenCountries?: boolean
}

type Country = {
  countryName: string,
  countryShortCode: string
}

const getOptionValue = (option: Country) => option.countryShortCode;
const getOptionLabel = (option: Country | string) => (option as Country)?.countryName ?? option;

const CountrySelector = ({ name, label, required, allowedCountries, hideForbiddenCountries }: CountrySelectorProps) => {
  const options: Country[] = useMemo(() => data.filter(d =>
    !allowedCountries
    || !hideForbiddenCountries
    || allowedCountries.includes(d.countryShortCode.toLowerCase())
  ), [allowedCountries, hideForbiddenCountries]);

  const getOptionDisabled = useCallback((option: Country) => {
    if (!allowedCountries) {
      return false;
    } else {
      return !allowedCountries.some(c => c.toLowerCase() === option.countryShortCode.toLowerCase());
    }
  }, [allowedCountries]);

  return (
    <Autocomplete
      options={options}
      getOptionValue={getOptionValue}
      getOptionLabel={getOptionLabel}
      name={name}
      label={label}
      required={required}
      fullWidth
      disableClearable={required}
      getOptionDisabled={getOptionDisabled}
    />
  )
}

export default CountrySelector;