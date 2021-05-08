import React, { FunctionComponent } from "react"
import { TextField, TextFieldProps } from "@material-ui/core"
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles"

type EditableComponentProps = TextFieldProps & {
  variant?: string,
  editing: boolean,
  fontSize?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body1" | "body2" | "subtitle1" | "subtitle2",
  colour?: "primary" | "secondary" | string
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  root: {
    "& input": {
      fontSize: (props: EditableComponentProps) => theme.typography[props.fontSize ?? "body1"].fontSize,
    },
    "& .MuiFormLabel-root.Mui-focused": {
      color: (props: EditableComponentProps) => props.colour ?? theme.palette.primary.main
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: (props: EditableComponentProps) => props.colour ?? theme.palette.primary.main
    }
  }
}));

const EditableComponent: FunctionComponent<EditableComponentProps> = (props) => {
  const classes = useStyles(props);
  const { editing, ...textProps } = props;
  if (props.editing) {
    return (<TextField {...textProps} className={classes.root} value={props.value}/>);
  } else {
    return (<React.Fragment>{props.children}</React.Fragment>);
  }
}

EditableComponent.defaultProps = {
  variant: "outlined",
  size: "small",
  fullWidth: true,
  fontSize: "body1"
}

export default EditableComponent;