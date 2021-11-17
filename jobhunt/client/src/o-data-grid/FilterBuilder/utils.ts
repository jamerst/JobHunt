import { SelectOption, ValueOption } from "o-data-grid/types";
import { v4 as uuid } from "uuid";
import { defaultLocale } from "./constants";

import { GroupClause, ConditionClause, FilterBuilderLocaleText } from "./types"

export const getDefaultCondition = (field: string): ConditionClause => ({
  field: field,
  op: "eq",
  value: null,
  id: uuid()
})

export const getDefaultGroup = (): GroupClause => ({
  connective: "and",
  id: uuid()
});

export const getSelectOption = (option: ValueOption): SelectOption => {
  if (typeof option === "string") {
    return { value: option, label: option };
  } else if (typeof option === "number") {
    return { value: option.toString(), label: option.toString() }
  } else {
    return option;
  }
}

export const getLocaleText = (key: keyof FilterBuilderLocaleText, locale: FilterBuilderLocaleText | undefined) =>
  locale !== undefined && locale[key] ? locale[key]! : defaultLocale[key];