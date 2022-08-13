import React, { Fragment, useState, useCallback, useEffect, useMemo } from "react"
import { Badge, IconButton, List, ListItem, Paper, Popover, Tooltip, Typography, Link, PopoverOrigin, tooltipClasses } from "@mui/material"
import Grid from "components/Grid";
import { Notifications, ClearAll  } from "@mui/icons-material";
import makeStyles from "makeStyles";
import { Link as RouterLink } from "react-router-dom";

import dayjs, { Dayjs } from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import Date, { DateTooltipProps } from "./Date";

type AlertProps = {
  onAlertClick?: () => void,
  setAlertCount?: React.Dispatch<React.SetStateAction<number>>
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
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.action.selected
    },
    "& a, a:hover": {
      textDecoration: "none"
    }
  },
  unread: {
    "&::before": {
      content: "''",
      position: "absolute",
      left: theme.spacing(1),
      top: 0,
      bottom: 0,
      margin: "auto",
      borderRadius: "50%",
      width: theme.spacing(2),
      height: theme.spacing(2),
      background: theme.palette.primary.main
    }
  },
  tooltip: {
    [`& .${tooltipClasses.tooltip}`]: {
      background: theme.palette.mode === "dark" ? theme.palette.background.default : ""
    }
  }
}));

dayjs.extend(relativeTime);

const anchorOrigin:PopoverOrigin = { vertical: "bottom", horizontal: "left" };

const Alerts = ({onAlertClick, setAlertCount}: AlertProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertAnchor, setAlertAnchor] = useState<null | HTMLElement>(null);

  const { classes, cx } = useStyles();
  const dateTooltipProps: DateTooltipProps = useMemo(() => ({ classes: { popper: classes.tooltip } }), [classes]);

  const onClick = useCallback((id: number) => async () => {
    const response = await fetch(`/api/alerts/read/${id}`, { method: "PATCH" });
    if (response.ok) {
      setAlerts((a) => {
        let newAlerts = [...a];
        const alertIndex = newAlerts.findIndex(a => a.id === id);
        newAlerts[alertIndex].read = true;
        return newAlerts;
      });
      setAlertAnchor(null);

      if (onAlertClick) {
        onAlertClick();
      }

      if (setAlertCount) {
        setAlertCount(c => c - 1);
      }
    } else {
      console.error(`API request failed: PATCH /api/alerts/read/${id}, HTTP ${response.status}`);
    }
  }, [onAlertClick, setAlertCount]);

  const markAllRead = useCallback(async () => {
    const response = await fetch(`/api/alerts/allread`, { method: "PATCH" });
    if (response.ok) {
      setAlerts((a) => {
        let newAlerts = [...a];
        newAlerts.forEach(a => a.read = true);
        return newAlerts;
      });

      if (setAlertCount) {
        setAlertCount(0);
      }
    } else {
      console.error(`API request failed: PATCH /api/alerts/allread, HTTP ${response.status}`);
    }
  }, [setAlertCount]);

  const onOpen = useCallback((e: React.MouseEvent) => setAlertAnchor(e.currentTarget as HTMLElement), []);
  const onClose = useCallback(() => setAlertAnchor(null), []);

  const unread = useMemo(() => alerts.filter(a => !a.read).length, [alerts]);

  const getClasses = useCallback((a: Alert) => {
    const c = [classes.listItem];
    if (!a.read) {
      c.push(classes.unread);
    }

    return cx(c);
  }, [classes, cx]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const response = await fetch("/api/alerts");
      if (response.ok) {
        const data = await response.json() as Alert[];
        data.forEach(a => {
          a.created = dayjs.utc(a.created);
        });

        setAlerts(data);

        if (setAlertCount) {
          setAlertCount(data.filter(a => !a.read).length);
        }
      } else {
        console.error(`API request failed: GET /api/alerts, HTTP ${response.status}`);
      }
    }

    fetchAlerts();
  }, [setAlertCount]);

  return (
    <Fragment>
      <Tooltip title="View Alerts">
        <IconButton
          aria-label="View Alerts"
          onClick={onOpen}
          size="large">
          <Badge badgeContent={unread} color="secondary">
            <Notifications/>
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        anchorEl={alertAnchor}
        open={alertAnchor !== null}
        anchorOrigin={anchorOrigin}
        className={classes.popper}
        onClose={onClose}
        transitionDuration={250}
      >
        <Paper className={classes.paper}>
          <Grid container justifyContent="space-between" alignItems="center" className={classes.header}>
            <Grid item>
              <Typography variant="h6">Alerts</Typography>
            </Grid>
            <Grid item>
              <Tooltip title="Mark all as read">
                <IconButton onClick={markAllRead} size="large">
                  <ClearAll/>
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          <List className={classes.list}>
            {alerts.map(a => (
              <ListItem key={a.id} className={getClasses(a)} onClick={onClick(a.id)}>
                {a.url ? (
                  <Link component={RouterLink} to={a.url}>
                    <Typography>{a.title}</Typography>
                    <Typography variant="body2">{a.message}</Typography>
                    <Typography variant="caption"><Date date={a.created} tooltipProps={dateTooltipProps} /></Typography>
                  </Link>
                ) : (
                  <Fragment>
                    <Typography>{a.title}</Typography>
                    <Typography variant="body2">{a.message}</Typography>
                      <Typography variant="caption"><Date date={a.created} tooltipProps={dateTooltipProps} /></Typography>
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