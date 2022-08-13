import React, { Fragment, useMemo } from "react";

import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { Tooltip, TooltipProps } from "@mui/material";

export type DateProps = {
  date?: string | Dayjs,
  emptyText?: string,
  disableRelative?: boolean,
  format?: string,
  tooltipProps?: DateTooltipProps
}

export type DateTooltipProps = Omit<TooltipProps, "title" | "children">;

const Date = ({ date, emptyText, disableRelative, format = "DD/MM/YYYY HH:mm", tooltipProps }: DateProps) => {
  dayjs.extend(relativeTime);
  dayjs.extend(utc);

  const result = useMemo(() => {
    if (!date) {
      const empty = emptyText ?? "";
      return { displayDate: empty, fullDate: empty, isoDate: empty }
    } else {
      const d = typeof (date) === "string" ? dayjs.utc(date).local() : date;

      const fullDate = d.format(format);
      const displayDate = !disableRelative ? d.fromNow() : fullDate;
      const isoDate = d.toISOString();

      return { displayDate, fullDate, isoDate };
    }


  }, [date, emptyText, disableRelative, format]);

  if (!result.displayDate || result.displayDate === emptyText) {
    return <Fragment>{result.displayDate}</Fragment>;
  }else if (result.displayDate !== result.fullDate) {
    return <Tooltip title={result.fullDate} placement="right" {...tooltipProps}><time dateTime={result.isoDate}>{result.displayDate}</time></Tooltip>;
  } else {
    return <time dateTime={result.isoDate}>{result.displayDate}</time>;
  }
}

export default Date;