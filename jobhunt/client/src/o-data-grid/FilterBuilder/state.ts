import { atom } from "recoil"
import Immutable from "immutable"

import { Group, Condition, TreeGroup } from "./types"
import { rootGroupUuid, rootConditionUuid } from "./constants";

export const clauseState = atom({
  key: "filterClauses",
  default: Immutable.Map<string, Group | Condition>({
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
});

export const treeState = atom({
  key: "filterTree",
  default: Immutable.Map<string, TreeGroup | string>({
    [rootGroupUuid]: {
      id: rootGroupUuid,
      children: Immutable.Map({ [rootConditionUuid]: rootConditionUuid })}
  })
});