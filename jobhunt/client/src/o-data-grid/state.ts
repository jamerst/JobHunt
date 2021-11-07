import { atom } from "recoil"

import { ODataGridColDef } from "./types";

export const columnsState = atom<ODataGridColDef[]>({
  key: "columns",
  default: []
});