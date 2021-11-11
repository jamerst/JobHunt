import Immutable from "immutable";

import { Condition, Group, TreeGroup } from "./types"

export const rootGroupUuid = "17c63a07-397b-4f03-a74b-2f935dcc6c8a";
export const rootConditionUuid = "18c1713a-2480-40c0-b60f-220a3fd4b117";

export const allOperators = ["eq", "ne", "gt", "lt", "ge", "le", "contains", "null", "notnull"];
export const numericOperators = ["eq", "ne", "gt", "lt", "ge", "le"];

export const initialClauses = Immutable.Map<string, Group | Condition>({
  [rootGroupUuid]: {
    id: rootGroupUuid,
    connective: "and"
  },
  [rootConditionUuid]: {
    id: rootConditionUuid,
    field: "",
    op: "eq",
    value: null
  }
})

export const initialTree = Immutable.Map<string, TreeGroup | string>({
  [rootGroupUuid]: {
    id: rootGroupUuid,
    children: Immutable.Map({ [rootConditionUuid]: rootConditionUuid })
  }
})