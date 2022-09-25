import { TextField, TextFieldProps } from "mui-rff";
import React, { useCallback, useMemo } from "react";

type NumberFieldProps = TextFieldProps & {
  allowDecimal?: boolean,
  allowNegative?: boolean
}

const decimalSep = Intl.NumberFormat().formatToParts(1.1).find(p => p.type === "decimal")?.value ?? ".";

const NumberField = (props: NumberFieldProps) => {
  const { allowDecimal, allowNegative, onKeyDown: propOnKeyDown, inputProps: propInputProps, ...rest } = props;

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key.length === 1) {
      const target = e.target as HTMLInputElement;
      if (!target) {
        return;
      }

      if (e.ctrlKey) {
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

    if (propOnKeyDown) {
      propOnKeyDown(e);
    }
  }, [allowDecimal, allowNegative, propOnKeyDown]);

  const regexPattern = useMemo(() => `^${allowNegative ? "-?" : ""}\\d+${allowDecimal ? `\\${decimalSep}?\\d*` : ""}$`, [allowDecimal, allowNegative]);
  const regex = useMemo(() =>
    new RegExp(regexPattern),
    [regexPattern]
  );

  // prevent inputting invalid values when pasting
  // it would be better to modify the pasted value so that it is valid, but I couldn't get this to work with
  // react-final-form, it still persisted the invalid value and I can't see a way to set the value programmatically
  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const input = e.target as HTMLInputElement;
    if (input) {
      const currentValue = input.value;

      const value = e.clipboardData.getData("text/plain");
      if (!regex.test(value)) {
        // prevent pasting if pasted value is not a valid number
        e.preventDefault();
      }

      if (currentValue && input.selectionStart !== 0 && input.selectionEnd !== currentValue.length) {
        if ((currentValue.includes("-") && value.includes("-")) || (currentValue.includes(decimalSep) && value.includes(decimalSep))) {
          // prevent pasting if field already contains decimal or negative symbol and so does pasted value
          e.preventDefault();
        }
      }
    }
  }, [regex]);

  const inputProps = useMemo(() => ({
    ...propInputProps,
    pattern: regexPattern
  }), [propInputProps, regexPattern]);

  return <TextField type="tel" {...rest} inputProps={inputProps} onKeyDown={onKeyDown} onPaste={onPaste} />
}

export default NumberField;