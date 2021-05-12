import React, { FunctionComponent } from "react"

type RatingProps = {
  rating: number,
  onRatingChange: (rating: number) => void
}

const Rating:FunctionComponent<RatingProps> = (props) => {
  return (<p>Hello</p>);
}

export default Rating;