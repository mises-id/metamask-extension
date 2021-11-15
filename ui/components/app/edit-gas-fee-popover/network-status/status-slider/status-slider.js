import React from 'react';

const GRADIENT_COLORS = [
  '#037DD6',
  '#1876C8',
  '#2D70BA',
  '#4369AB',
  '#57629E',
  '#6A5D92',
  '#805683',
  '#9A4D71',
  '#B44561',
  '#C54055',
];

const StatusSlider = () => {
  const statusValue = 0.5;
  const sliderValueNumeric = Math.round(statusValue * 10);
  return (
    <div className="status-slider">
      <div
        className="status-slider__arrow"
        style={{
          borderTopColor: GRADIENT_COLORS[sliderValueNumeric],
          marginLeft: `${sliderValueNumeric * 10 - 10}%`,
        }}
      />
      <div className="status-slider__line" />
      <div
        className="status-slider__label"
        style={{ color: GRADIENT_COLORS[sliderValueNumeric] }}
      >
        {statusValue <= 0.5 ? 'Stable' : 'Unstable'}
      </div>
    </div>
  );
};

export default StatusSlider;
