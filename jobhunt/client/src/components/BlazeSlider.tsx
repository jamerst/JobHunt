import React, { PropsWithChildren } from "react";
import { MediaConfig } from "blaze-slider";
import { useBlazeSlider } from "react-blaze-slider";
import "blaze-slider/dist/blaze.css";

type BlazeSliderProps = Partial<MediaConfig>;

export const BlazeSlider = (props: PropsWithChildren<BlazeSliderProps>) => {
  const { children, ...config } = props;
  const ref = useBlazeSlider({ all: config });

  return (
    <div className="blaze-slider" ref={ref}>
      <div className="blaze-container">
        <div className="blaze-track-container">
          <div className="blaze-track">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

