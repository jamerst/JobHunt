import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "react-router";
import { Paper, Typography } from "@mui/material";
import { Timeline, timelineClasses, TimelineConnector, TimelineContent, timelineContentClasses, TimelineDot, timelineDotClasses, TimelineItem, TimelineSeparator } from "@mui/lab";
import dayjs from "dayjs";

import Grid from "components/Grid";
import makeStyles from "makeStyles";
import { Article } from "@mui/icons-material";

type WatchedPageResponse = {
  watchedPage: WatchedPage,
  changes: WatchedPageChange[]
}

type WatchedPage = {
  id: number,
  url: string,
  lastScraped?: string,
  lastUpdated?: string,
  statusMessage?: string,
  enabled: boolean
}

type WatchedPageChange = {
  id: number,
  created: string
}

type DisplayChange = {
  id: number,
  last: boolean,
  date: string
}

type DiffResponse = {
  previous?: string,
  current: string
}

const useStyles = makeStyles()((theme) => ({
  root: {
    flexGrow: "1"
  },
  timelineItem: {
    [`& .${timelineDotClasses.root}`]: {
      cursor: "pointer",
      transition: theme.transitions.create("background")
    },
    [`&:hover .${timelineDotClasses.root}`]: {
      background: theme.palette.primary.main
    },
    [`& .${timelineContentClasses.root}`]: {
      cursor: "pointer",
    },
    "&::before": {
      content: "none"
    }
  },
  iframePaper: {
    flexGrow: 1,
    "& iframe": {
      width: "100%",
      height: "100%",
      border: "none"
    }
  }
}));

const PageChanges = () => {
  const [watchedPage, setWatchedPage] = useState<WatchedPageResponse | undefined>();
  const [current, setCurrent] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentDiff, setCurrentDiff] = useState<DiffResponse | undefined>();

  const { id } = useParams();
  const { classes } = useStyles();

  useEffect(() => {
    const fetchPage = async () => {
      const response = await fetch(`/api/watchedpages/${id}`);
      if (response.ok) {
        const data = await response.json() as WatchedPageResponse;
        setWatchedPage(data);

        if (data.changes.length > 0) {
          setCurrent(data.changes[0].id);
          setCurrentIndex(0);
        } else {
          setCurrent(0);
          setCurrentIndex(0);
        }
      }
    }

    fetchPage();
  }, [id]);

  useEffect(() => {
    if (current === 0) {
      return;
    }

    const fetchDiff = async () => {
      const response = await fetch(`/api/watchedpages/diff/${current}`);
      if (response.ok) {
        setCurrentDiff(await response.json() as DiffResponse);
      }
    }

    fetchDiff();
  }, [current]);

  const changes = useMemo(() => !watchedPage?.changes ? [] : (watchedPage.changes ?? []).map((c, i) => {
    const hasPrevious = i < watchedPage.changes.length - 1;
    const date = dayjs(c.created);

    let format = "DD/MM/YYYY HH:mm";
    let sameDate = false;
    if (hasPrevious && dayjs(watchedPage.changes[i + 1].created).isSame(date, "day")) {
      sameDate = true;
      format = "DD/MM/YYYY";
    }

    return {
      id: c.id,
      date: date.format(format),
      hasPrevious: hasPrevious,
      sameDate: sameDate
    }
  }), [watchedPage]);

  const handleChange = useCallback((id: number, index: number) => {
    setCurrent(id);
    setCurrentIndex(index);
  }, []);

  if (!watchedPage) {
    return null;
  }

  return (
    <Grid container spacing={2} className={classes.root}>
      <Grid item xs={12} lg={2} xl={1}>
        <Timeline>
          {changes.map((c, i) => (
            <TimelineItem className={classes.timelineItem}>
              <TimelineSeparator>
                <TimelineDot color={c.id === current ? "secondary" : "grey"} onClick={() => handleChange(c.id, i)} />
                {c?.hasPrevious && (<TimelineConnector />)}
              </TimelineSeparator>
              <TimelineContent onClick={() => handleChange(c.id, i)}>{c.date}</TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Grid>
      {
        currentDiff?.previous && (
          <Grid item container direction="column" xs={12} lg>
            <Typography variant="h6">{currentIndex < watchedPage.changes.length - 1 ? dayjs(watchedPage.changes[currentIndex + 1].created).format("DD/MM/YYYY HH:mm") : ""}</Typography>
            <Paper className={classes.iframePaper}>
              <iframe srcDoc={currentDiff.previous} />
            </Paper>
          </Grid>
        )
      }
      {
        currentDiff && (
          <Grid item container direction="column" xs={12} lg>
            <Typography variant="h6">{dayjs(watchedPage.changes[currentIndex].created).format("DD/MM/YYYY HH:mm")}</Typography>
            <Paper className={classes.iframePaper}>
              <iframe srcDoc={currentDiff.current} />
            </Paper>
          </Grid>
        )
      }
    </Grid>
  )
};

export default PageChanges;