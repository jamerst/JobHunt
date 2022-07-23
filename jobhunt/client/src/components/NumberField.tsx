import { TextField } from "@mui/material";
import React, { useCallback } from "react";

type FieldProps = {
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
}

type NumberFieldProps<TProps extends FieldProps> = TProps & {
  allowDecimal?: boolean,
  allowNegative?: boolean,
  component?: (props: TProps) => JSX.Element
}

const decimalSep = Intl.NumberFormat().formatToParts(1.1).find(p => p.type === "decimal")?.value;
const NumberField = <TProps extends FieldProps,>({ allowDecimal, allowNegative, component: Component = TextField, ...rest}: NumberFieldProps<TProps>) => {
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key.length === 1) {
      const target = e.target as HTMLInputElement;
      if (!target) {
        return;
      }

      if (allowDecimal && e.key === decimalSep && !target.value.includes(decimalSep)) {
        return;
      } else if (allowNegative && e.key === '-' && !target.value.includes('-') && target.selectionStart === 0) {
        return;
      } else if (!isNaN(parseInt(e.key, 10))) {
        return;
      }
      e.preventDefault();
    }

    if (rest.onKeyDown) {
      rest.onKeyDown(e);
    }
  }, [allowDecimal, allowNegative, rest.onKeyDown]);

  return <Component type="tel" {...rest as TProps} onKeyDown={onKeyDown} />
}

export default NumberField;