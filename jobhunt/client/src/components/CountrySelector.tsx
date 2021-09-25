import React, { FunctionComponent } from "react"
import Autocomplete from '@mui/material/Autocomplete'
import data from "country-region-data"
import { TextField } from "@mui/material"

type CountrySelectorProps = {
  value: string,
  onChange: (code: string) => void,
  required?: boolean,
  allowedCountries?: string[],
  hideForbiddenCountries?: boolean
}

const CountrySelector: FunctionComponent<CountrySelectorProps> = (props) => {
  return (
    <Autocomplete
      options={data.filter(d => !props.allowedCountries || !props.hideForbiddenCountries || props.allowedCountries.includes(d.countryShortCode.toLowerCase()))}
      getOptionLabel={(option) => option.countryName}
      renderInput={(params) => <TextField {...params} label={`Country${props.required ? " *" : ""}`} variant="outlined" />}
      fullWidth
      value={getCountry(props.value)}
      onChange={(_, val) => props.onChange(val?.countryShortCode ?? "")}
      disableClearable
      getOptionDisabled={(option) => props.allowedCountries !== undefined && !props.allowedCountries.includes(option.countryShortCode.toLowerCase())}
    />
  )
}

const getCountry = (code: string) => {
  const result = data.find(c => c.countryShortCode.toLowerCase() === code.toLowerCase());

  if (!result) {
    console.error(`CountrySelector Error: code '${code}' not found`);
  }

  return result;
}

export default CountrySelector;