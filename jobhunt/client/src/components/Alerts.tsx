import React, { Fragment, useState, useCallback, useEffect } from "react"
import { Badge, ClickAwayListener, IconButton, List, ListItem, Paper, Popper, Tooltip, Typography } from "@material-ui/core"
import Grid from "components/Grid";
import { Notifications, ClearAll  } from "@material-ui/icons";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"
import { Link } from "react-router-dom";

import dayjs, { Dayjs } from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

type Alert = {
  id: number,
  read: boolean,
  type: string,
  title: string,
  message?: string,
  url?: string,
  created: Dayjs
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  title: {
    width: "100%",
    textAlign: "center"
  },
  popper: {
    zIndex: 1300
  },
  paper: {
    transformOrigin: "top right",
  },
  header: {
    padding: theme.spacing(1, 2)
  },
  list: {
    width: theme.spacing(45),
    maxHeight: theme.spacing(60),
    overflow: "auto"
  },
  listItem: {
    display: "flex",
    flexDirection: "column",
    wordBreak: "break-word",
    alignItems: "flex-start",
    padding: theme.spacing(3, 2, 3, 4),
    transition: ".25s ease",
    position: "relative",
    "&:hover": {
      background: theme.palette.action.selected
    },
    "& a": {
      textDecoration: "none"
    }
  },
  unread: {
    position: "absolute",
    left: theme.spacing(1),
    top: 0,
    bottom: 0,
    margin: "auto",
    borderRadius: "50%",
    content: '',
    width: theme.spacing(2),
    height: theme.spacing(2),
    background: theme.palette.primary.main
  }
}));

dayjs.extend(relativeTime);
const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertAnchor, setAlertAnchor] = useState<null | HTMLElement>(null);

  const classes = useStyles();

  const markRead = useCallback(async (id: number) => {
    const response = await fetch(`/api/alerts/read/${id}`, { method: "PATCH" });
    if (response.ok) {
      let newAlerts = [...alerts];
      const alertIndex = newAlerts.findIndex(a => a.id === id);
      newAlerts[alertIndex].read = true;
      setAlerts(newAlerts);
      setAlertAnchor(null);
    } else {
      console.error(`API request failed: PATCH /api/alerts/read/${id}, HTTP ${response.status}`);
    }
  }, [alerts]);

  const markAllRead = useCallback(async () => {
    const response = await fetch(`/api/alerts/allread`, { method: "PATCH" });
    if (response.ok) {
      let newAlerts = [...alerts];
      newAlerts.forEach(a => a.read = true);
      setAlerts(newAlerts);
    } else {
      console.error(`API request failed: PATCH /api/alerts/allread, HTTP ${response.status}`);
    }
  }, [alerts]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const response = await fetch("/api/alerts");
      if (response.ok) {
        const data = await response.json() as Alert[];
        data.forEach(a => a.created = dayjs(a.created));
        setAlerts(data);
      } else {
        console.error(`API request failed: GET /api/alerts, HTTP ${response.status}`);
      }
    }

    fetchAlerts();
  }, []);

  return (
    <Fragment>
      <Tooltip title="View Alerts">
        <IconButton aria-label="View Alerts" onClick={(e) => setAlertAnchor(e.currentTarget)}>
          <Badge badgeContent={alerts.filter(a => !a.read).length} color="secondary">
            <Notifications/>
          </Badge>
        </IconButton>
      </Tooltip>
      <Popper
        anchorEl={alertAnchor}
        open={alertAnchor !== null}
        placement="bottom-end"
        className={classes.popper}
      >
        <ClickAwayListener onClickAway={() => setAlertAnchor(null)}>
          <Paper className={classes.paper}>
            <Grid container justify="space-between" alignItems="center" className={classes.header}>
              <Grid item>
                <Typography variant="h6">Alerts</Typography>
              </Grid>
              <Grid item>
                <Tooltip title="Mark all as read">
                  <IconButton onClick={() => markAllRead()}>
                    <ClearAll/>
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
            <List className={classes.list}>
              {alerts.map(a => (
                <ListItem key={a.id} className={classes.listItem}>
                  {a.url ? (
                    <Link to={a.url} onClick={() => markRead(a.id)}>
                      {a.read ? null : <div className={classes.unread}></div>}
                      <Typography>{a.title}</Typography>
                      <Typography variant="body2">{a.message}</Typography>
                      <Typography variant="caption">{a.created.isBefore(dayjs().subtract(1, "day"), "day") ? a.created.format("DD/MM/YYYY HH:mm") : a.created.fromNow() }</Typography>
                    </Link>
                  ) : (
                    <Fragment>
                      {a.read ? null : <div className={classes.unread}></div>}
                      <Typography>{a.title}</Typography>
                      <Typography variant="body2">{a.message}</Typography>
                      <Typography variant="caption">{a.created.isBefore(dayjs().subtract(1, "day"), "day") ? a.created.format("DD/MM/YYYY HH:mm") : a.created.fromNow() }</Typography>
                    </Fragment>
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Fragment>
  )
}

export default Alerts;