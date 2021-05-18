import React, { FunctionComponent } from "react"
import { makeStyles, Theme, TypographyVariant } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import { CSSProperties } from "@material-ui/styles";
import ReactMarkdown from "react-markdown";

type MarkdownProps = {
  value: string
}

const useStyles = makeStyles((theme: Theme) => {
  const tags:TypographyVariant[] = ["h1", "h2", "h3", "h4", "h5", "h6"];
  const nestedRules:CSSProperties = {
    "& ul": {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(2)
    }
  };
  tags.forEach((tag) => {
    nestedRules[`& ${tag}`] = { ...theme.typography[tag], marginTop: theme.spacing(2), marginBottom: theme.spacing(1) };
  });
  return {
    root: nestedRules
  };
});

const Markdown:FunctionComponent<MarkdownProps> = (props) => {
  const classes = useStyles();

  return <Typography variant="body1" className={classes.root}><ReactMarkdown skipHtml>{props.value}</ReactMarkdown></Typography>
}

export default Markdown;