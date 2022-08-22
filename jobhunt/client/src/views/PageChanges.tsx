import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "react-router";
import { Link, Paper, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { Timeline, TimelineConnector, TimelineContent, timelineContentClasses, TimelineDot, timelineDotClasses, TimelineItem, TimelineSeparator } from "@mui/lab";
import dayjs from "dayjs";
import { Link as RouterLink } from "react-router-dom"

import Grid from "components/Grid";
import makeStyles from "makeStyles";
import { Helmet } from "react-helmet";
import WatchedPage from "types/models/WatchedPage";

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
      border: "none",
      background: "#fff"
    }
  },
  screenshot: {
    width: "100%",
    padding: theme.spacing(1)
  }
}));

const PageChanges = () => {
  const [watchedPage, setWatchedPage] = useState<WatchedPage>();
  const [current, setCurrent] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [view, setView] = useState("image");

  const { id } = useParams();
  const { classes } = useStyles();

  useEffect(() => {
    const fetchPage = async () => {
      const response = await fetch(`/api/odata/watchedpage(${id})?$expand=changes($select=id,created;$orderby=created desc),company`);
      if (response.ok) {
        const data = await response.json() as WatchedPage;
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

  const changes = useMemo(() => !watchedPage?.changes ? [] : (watchedPage.changes ?? []).map((c, i) => {
    const hasPrevious = i < watchedPage.changes.length - 1;
    const date = dayjs.utc(c.created);

    return {
      id: c.id,
      date: date.local().format("DD/MM/YYYY HH:mm"),
      hasPrevious: hasPrevious
    }
  }), [watchedPage]);

  const handleTimelineChange = useCallback((id: number, index: number) => () => {
    setCurrent(id);
    setCurrentIndex(index);
  }, []);

  const handleViewChange = useCallback((_: React.MouseEvent<HTMLElement>, newView: string) => {
    setView(newView);
  }, []);

  if (!watchedPage) {
    return null;
  }

  return (
    <Grid container direction="column" className={classes.root}>
      <Helmet>
        <title>Changes to {watchedPage.url} | JobHunt</title>
      </Helmet>
      <Grid item>
        <Typography variant="h6" marginBottom={1}>
          <Link component={RouterLink} to={`/company/${watchedPage.company.id}`} target="_blank">{watchedPage.company.name}</Link> - <Link href={watchedPage.url} target="_blank">{watchedPage.url}</Link>
        </Typography>
      </Grid>
      <Grid item container spacing={2} className={classes.root}>
        <Grid item xs={12} lg={2} xl={1}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            aria-label="View Mode"
            size="small"
          >
            <ToggleButton value="image" aria-label="Screenshot View">Screenshot</ToggleButton>
            <ToggleButton value="html" aria-label="Difference View">Diff</ToggleButton>
          </ToggleButtonGroup>
          <Timeline>
            {changes.map((c, i) => (
              <TimelineItem className={classes.timelineItem} key={`watchedpagechange-${c.id}`}>
                <TimelineSeparator>
                  <TimelineDot color={c.id === current ? "secondary" : "grey"} onClick={handleTimelineChange(c.id, i)} />
                  {c?.hasPrevious && (<TimelineConnector />)}
                </TimelineSeparator>
                <TimelineContent onClick={handleTimelineChange(c.id, i)}>{c.date}</TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Grid>
        {
          currentIndex < watchedPage.changes.length - 1 && (
            <Grid item container direction="column" xs={12} lg>
              <Typography variant="h6">{dayjs.utc(watchedPage.changes[currentIndex + 1].created).local().format("DD/MM/YYYY HH:mm")}</Typography>
              <Paper className={classes.iframePaper}>
                {view === "html" && (<iframe src={`/api/watchedpages/previoushtml/${current}`} sandbox={watchedPage.requiresJS ? "" : undefined} title="Before" />)}
                {view === "image" && (<img src={`/api/watchedpages/screenshot/${watchedPage.changes[currentIndex + 1].id}`} className={classes.screenshot} alt="Before"/>)}
              </Paper>
            </Grid>
          )
        }
        {
          current && (
            <Grid item container direction="column" xs={12} lg>
              <Typography variant="h6">{dayjs.utc(watchedPage.changes[currentIndex].created).local().format("DD/MM/YYYY HH:mm")}</Typography>
              <Paper className={classes.iframePaper}>
                {view === "html" && (<iframe src={`/api/watchedpages/html/${current}`} sandbox={watchedPage.requiresJS ? "" : undefined} title="After" />)}
                {view === "image" && (<img src={`/api/watchedpages/screenshot/${watchedPage.changes[currentIndex].id}`} className={classes.screenshot} alt="After"/>)}
              </Paper>
            </Grid>
          )
        }
      </Grid>
    </Grid>
  )
};

export default PageChanges;