import { InputBaseProps, TextField, TextFieldProps } from "@material-ui/core"
import React, { ElementType, FunctionComponent } from "react"

type EditableComponentProps = TextFieldProps & {
  multiline?: boolean,
  lines?: number,
  variant?: string,
  editing: boolean
}

const EditableComponent: FunctionComponent<EditableComponentProps> = (props) => {
  if (props.editing && !props.multiline) {
    return (<TextField {...props} value={props.value}/>);
  } else {
    return (<React.Fragment>{props.children}</React.Fragment>);
  }
}

EditableComponent.defaultProps = {
  multiline: false,
  lines: 5,
  variant: "outlined",
  size: "small",
  fullWidth: true
}

export default EditableComponent;