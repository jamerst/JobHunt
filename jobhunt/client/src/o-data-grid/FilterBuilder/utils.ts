import { SelectOption, ValueOption } from "o-data-grid/types";
import { v4 as uuid } from "uuid";

import { Group, Condition } from "./types"

export const getDefaultCondition = (): Condition => ({
  field: "",
  op: "eq",
  id: uuid()
})

export const getDefaultGroup = (): Group => ({
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