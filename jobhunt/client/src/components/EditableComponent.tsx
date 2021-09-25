import React, { Fragment, PropsWithChildren } from "react"
import { TextField, TextFieldProps } from "@mui/material"
import makeStyles from "makeStyles"

type EditableComponentProps<T> = TextFieldProps & {
  variant?: string,
  editing: boolean,
  fontSize?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body1" | "body2" | "subtitle1" | "subtitle2",
  colour?: "primary" | "secondary" | string,
  data?: T[],
  renderEdit?: (data: T[]) => React.ReactNode
}

const useStyles = makeStyles<EditableComponentProps<any>>()((theme, props) => ({
  root: {
    "& input": {
      fontSize: theme.typography[props.fontSize ?? "body1"].fontSize,
    },
    "& .MuiFormLabel-root.Mui-focused": {
      color: props.colour ?? theme.palette.primary.main
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: props.colour ?? theme.palette.primary.main
    }
  }
}));

const EditableComponent= <T, >(props: PropsWithChildren<EditableComponentProps<T>>) => {
  const { classes } = useStyles(props);

  if (props.editing) {
    if (!props.data || !Array.isArray(props.data)) {
      const { editing, ...textProps } = props;
      return (<TextField {...textProps} className={classes.root} value={props.value}/>);
    } else if (props.data && Array.isArray(props.data)) {
      return (
        <Fragment>
          {props.renderEdit ? props.renderEdit(props.data) : null}
        </Fragment>
      );
    } else {
      return null;
    }
  } else {
    return (<React.Fragment>{props.children}</React.Fragment>);
  }
}

EditableComponent.defaultProps = {
  variant: "outlined",
  size: "small",
  fullWidth: true,
  fontSize: "body1",
  allowAdding: false
}

export default EditableComponent;