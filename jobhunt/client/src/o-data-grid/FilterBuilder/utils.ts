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