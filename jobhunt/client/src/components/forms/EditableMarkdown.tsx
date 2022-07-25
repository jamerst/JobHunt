import React, { useState } from "react";

type EditableMarkdownProps = {
  value: string,
  onSave: (val: string) => void
}

const EditableMarkdown = ({ value, onSave }: EditableMarkdownProps) => {
  const editing = useState(false);
}

export default EditableMarkdown;