import React, { Fragment, useState, useCallback, useEffect } from "react"
import { Badge, IconButton, List, ListItem, Paper, Popover, Tooltip, Typography, Link } from "@mui/material"
import Grid from "components/Grid";
import { Notifications, ClearAll  } from "@mui/icons-material";
import makeStyles from "makeStyles";
import { Link as RouterLink } from "react-router-dom";

import dayjs, { Dayjs } from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

type AlertProps = {
  onAlertClick?: () => void,
  setAlertCount?: (count: number) => void
}

type Alert = {
  id: number,
  read: boolean,
  type: string,
  title: string,
  message?: string,
  url?: string,
  created: Dayjs
}

const useStyles = makeStyles()((theme) => ({
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
    overflow: "auto",
    maxWidth: "100%",
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
    "& a, a:hover": {
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
    content: "''",
    width: theme.spacing(2),
    height: theme.spacing(2),
    background: theme.palette.primary.main
  }
}));

dayjs.extend(relativeTime);
const Alerts = (props: AlertProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertAnchor, setAlertAnchor] = useState<null | HTMLElement>(null);

  const { classes } = useStyles();

  const onClick = useCallback(async (id: number) => {
    const response = await fetch(`/api/alerts/read/${id}`, { method: "PATCH" });
    if (response.ok) {
      let newAlerts = [...alerts];
      const alertIndex = newAlerts.findIndex(a => a.id === id);
      newAlerts[alertIndex].read = true;
      setAlerts(newAlerts);
      setAlertAnchor(null);
      if (props.onAlertClick) {
        props.onAlertClick();
      }
      if (props.setAlertCount) {
        props.setAlertCount(newAlerts.filter(a => !a.read).length);
      }
    } else {
      console.error(`API request failed: PATCH /api/alerts/read/${id}, HTTP ${response.status}`);
    }
  }, [alerts, props]);

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
        data.forEach(a => a.created = dayjs.utc(a.created));
        setAlerts(data);
        if (props.setAlertCount) {
          props.setAlertCount(data.filter(a => !a.read).length);
        }
      } else {
        console.error(`API request failed: GET /api/alerts, HTTP ${response.status}`);
      }
    }

    fetchAlerts();
  }, [props]);

  return (
    <Fragment>
      <Tooltip title="View Alerts">
        <IconButton
          aria-label="View Alerts"
          onClick={(e) => setAlertAnchor(e.currentTarget)}
          size="large">
          <Badge badgeContent={alerts.filter(a => !a.read).length} color="secondary">
            <Notifications/>
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        anchorEl={alertAnchor}
        open={alertAnchor !== null}
        anchorOrigin={{vertical: "bottom", horizontal: "left"}}
        className={classes.popper}
        onClose={() => setAlertAnchor(null)}
        transitionDuration={250}
      >
        <Paper className={classes.paper}>
          <Grid container justifyContent="space-between" alignItems="center" className={classes.header}>
            <Grid item>
              <Typography variant="h6">Alerts</Typography>
            </Grid>
            <Grid item>
              <Tooltip title="Mark all as read">
                <IconButton onClick={() => markAllRead()} size="large">
                  <ClearAll/>
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          <List className={classes.list}>
            {alerts.map(a => (
              <ListItem key={a.id} className={classes.listItem}>
                {a.url ? (
                  <Link component={RouterLink} to={a.url} onClick={() => onClick(a.id)}>
                    {a.read ? null : <div className={classes.unread}></div>}
                    <Typography>{a.title}</Typography>
                    <Typography variant="body2">{a.message}</Typography>
                    <Typography variant="caption">{a.created.isBefore(dayjs.utc().subtract(1, "day"), "day") ? a.created.format("DD/MM/YYYY HH:mm") : a.created.fromNow() }</Typography>
                  </Link>
                ) : (
                  <Fragment>
                    {a.read ? null : <div className={classes.unread}></div>}
                    <Typography>{a.title}</Typography>
                    <Typography variant="body2">{a.message}</Typography>
                    <Typography variant="caption">{a.created.isBefore(dayjs.utc().subtract(1, "day"), "day") ? a.created.format("DD/MM/YYYY HH:mm") : a.created.fromNow() }</Typography>
                  </Fragment>
                )}
              </ListItem>
            ))}
          </List>
        </Paper>
      </Popover>
    </Fragment>
  );
}

export default Alerts;