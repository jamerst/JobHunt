import { useCallback } from "react";
import { useRecoilValue } from "recoil"
import { rootGroupUuid } from "./constants";
import { clauseState, schemaState, treeState } from "./state"
import { BaseFieldDef, ConditionClause, FieldDef, GroupClause, Operation, QueryStringCollection, StateClause, StateTree, TreeGroup } from "./types";

export const UseODataFilter = () => {
  const schema = useRecoilValue(schemaState);
  const clauses = useRecoilValue(clauseState);
  const tree = useRecoilValue(treeState);

  return useCallback(() => {
    const filter = buildGroup(schema, clauses, tree, rootGroupUuid, []);

    return { filter: filter[0], queryString: filter[1] }
  }, [schema, clauses, tree]);
}

const buildGroup = (schema: FieldDef[], clauses: StateClause, tree: StateTree, id: string, path: string[]): [string, QueryStringCollection?] => {
  const clause = clauses.get(id) as GroupClause;
  const treeNode = tree.getIn([...path, id]) as TreeGroup;

  if (!treeNode) {
    console.error(`Tree node ${[...path, id].join("->")} not found`);
    return [""];
  }

  const childClauses = treeNode.children.toArray().map((c) => {
    if (typeof c[1] === "string") {
      return buildCondition(schema, clauses, c[0]);
    } else {
      return buildGroup(schema, clauses, tree, c[0], [...path, id, "children"]);
    }
  });

  if (childClauses.length > 1) {
    return [
      `(${childClauses.filter(c => c[0] !== "").join(` ${clause.connective} `)})`,
      childClauses.filter(c => c[1]).reduce((x, c) => ({ ...x, ...c }), {})
    ];
  } else if (childClauses.length === 1) {
    return childClauses[0]
  } else {
    return [""];
  }
}

const buildCondition = (schema: FieldDef[], clauses: StateClause, id: string): [string, QueryStringCollection?] => {
  const clause = clauses.get(id) as ConditionClause;

  if (clause.default === true) {
    return [""];
  }

  const def = schema.find(d => d.field === clause.field);

  if (!def) {
    return [""];
  }

  const filterField = def.filterField ?? def.field;

  if (clause.collectionOp) {
    if (clause.collectionOp === "count") {
      return [`${filterField}/$count ${clause.op} ${clause.value}`];
    } else {
      const collectionDef = def.collectionFields!.find(d => d.field === clause.collectionField!);
      const result = buildInnerCondition(collectionDef!, "x/" + clause.collectionField!, clause.op, clause.value);
      return [result[0], result[1]];
    }
  } else {
    return buildInnerCondition(def, filterField, clause.op, clause.value);
  }
}

const buildInnerCondition = (schema: BaseFieldDef, field: string, op: Operation, value: any): [string, QueryStringCollection?] => {
  if (schema.getCustomQueryString) {
    return ["", schema.getCustomQueryString(op, value)];
  }

  if (schema.getCustomFilterString) {
    return [schema.getCustomFilterString(op, value)];
  }

  if (op === "contains") {
    if ((schema.type && schema.type !== "string") || typeof value !== "string") {
      console.warn(`Warning: operation "contains" is only supported for fields of type "string"`);
      return [""];
    }
    if (schema.caseSensitive === true) {
      return [`contains(${field}, '${value}')`];
    } else {
      return [`contains(tolower(${field}), tolower('${value}'))`];
    }
  } else if (op === "null") {
    return [`${field} eq null`];
  } else if (op === "notnull") {
    return [`${field} ne null`];
  } else {
    if (schema.type === "date") {
        return [`date(${field}) ${op} ${value}`];
    } else if (schema.type === "datetime") {
      return [`${field} ${op} ${value}`];
    } else if (!schema.type || schema.type === "string" || typeof value === "string") {
      if (schema.caseSensitive === true) {
        return [`${field} ${op} '${value}'`];
      } else {
        return [`tolower(${field}) ${op} tolower('${value}')`];
      }
    } else {
      return [`${field} ${op} ${value}`];
    }
  }
}