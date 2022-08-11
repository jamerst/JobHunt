import React, { useMemo } from "react";

import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

export type DateProps = {
  date: string | Dayjs,
  maxRelativeDays?: number
}

const Date = ({ date, maxRelativeDays }: DateProps) => {
  dayjs.extend(relativeTime);
  dayjs.extend(utc);

  const result = useMemo(() => {
    const d = typeof (date) === "string" ? dayjs.utc(date) : date;
    // const relative =

  }, [date, maxRelativeDays]);


}