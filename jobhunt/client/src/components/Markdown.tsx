import React, { FunctionComponent } from "react"
import ReactMarkdown from "react-markdown";
import makeStyles from "makeStyles";

type MarkdownProps = {
  value: string
}

const useStyles = makeStyles()((theme) => ({
  root: {
    "& h1, h2, h3, h4, h5, h6, p, li": {
      fontFamily: theme.typography.fontFamily,
      fontWeight: theme.typography.fontWeightRegular
    },
    "& h1, h3": {
      fontWeight: theme.typography.fontWeightMedium
    }
  }
}));

const Markdown:FunctionComponent<MarkdownProps> = (props) => {
  const { classes } = useStyles();

  return <div className={classes.root}><ReactMarkdown skipHtml>{props.value}</ReactMarkdown></div>
}

export default Markdown;