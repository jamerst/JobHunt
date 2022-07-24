import React, { useCallback } from "react";

type FieldProps = {
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void,
  type?: React.InputHTMLAttributes<unknown>['type']
}

type NumberFieldProps<TProps extends FieldProps> = TProps & {
  allowDecimal?: boolean,
  allowNegative?: boolean,
  component: (props: TProps) => JSX.Element
}

const decimalSep = Intl.NumberFormat().formatToParts(1.1).find(p => p.type === "decimal")?.value;

const NumberField = <TProps extends FieldProps,>(props: NumberFieldProps<TProps>) => {
  const { allowDecimal, allowNegative, component: Component, onKeyDown: propOnKeyDown, ...rest } = props;

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

    if (propOnKeyDown) {
      propOnKeyDown(e);
    }
  }, [allowDecimal, allowNegative, propOnKeyDown]);

  // ideally this should destructure props instead of rest, but doing this breaks it for some unfathomable reason
  // somehow react-final-form thinks the name property is undefined even though it clearly isn't, but changing it to use
  // rest magically fixes it

  // doing it this way means that if TProps has any properties in common with NumberFieldProps they won't be passed to
  // the component, but oh well
  return <Component type="tel" {...rest as unknown as TProps} onKeyDown={onKeyDown} />
}

export default NumberField;