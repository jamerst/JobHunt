import React, { FunctionComponent } from "react"
import Autocomplete from "@material-ui/lab/Autocomplete"
import data from "country-region-data"
import { TextField } from "@material-ui/core"

type CountrySelectorProps = {
  value: string,
  onChange: (code: string) => void,
  required?: boolean
}

const CountrySelector: FunctionComponent<CountrySelectorProps> = (props) => {
  return (
    <Autocomplete
      options={data}
      getOptionLabel={(option) => option.countryName}
      renderInput={(params) => <TextField {...params} label={`Country${props.required ? " *" : ""}`} variant="outlined" />}
      fullWidth
      value={getCountry(props.value)}
      onChange={(_, val) => props.onChange(val?.countryShortCode ?? "")}
      disableClearable
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