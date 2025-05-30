import { useRef, useState, useEffect } from 'react';
import Frame from './Frame';
import PropTypes from 'prop-types';

const GOLDENRATIO = 1.61803398875;

// Fixed aspect ratios for each image
const ASPECT_RATIOS = {
  'Item 1': 0.788,
  'Item 2': 0.739,
  'Item 3': 1.181,
  'Item 4': 0.687,
  'Item 5': 1.342,
  'Item 6': 0.705,
  'Item 7': 0.614,
  'Item 8': 1.359,
  'Item 9': 1.011,
  'Item 10': 1.369,
  'Item 11': 2.561,
  'Item 12': 1.217,
  'Item 13': 0.602,
  'Item 14': 0.758,
  'Item 15': 1.658,
  'Item 16': 1.667,
  'Item 17': 1.639,
  'Item 18': 1.271,
  'Item 19': 1.308,
  'Item 20': 0.711,
  'Item 21': 1.245,
  'Item 22': 0.759,
  'Item 23': 1.446,
  'Item 24': 1.304,
  'Item 25': 0.752,
  'Item 26': 0.749,
  'Item 27': 1.304,
  'Item 28': 1.325,
  'Item 29': 1.644,
  'Item 30': 0.594,
  'Item 31': 1.219,
  'Item 32': 0.925,
  'Item 33': 0.604,
  'Item 34': 2.083,
  'Item 35': 1.962,
  'Item 36': 1.655,
  'Item 37': 1.025,
  'Item 38': 1.335,
  'Item 39': 1.385,
  'Item 40': 1.355,
  'Item 41': 1.965,
  'Item 42': 0.925,
  'Item 43': 1.386,
  'Item 44': 0.679
};

const Frames = ({ images, onFrameClick, animationComplete }) => {
  const ref = useRef();
  
  return (
    <group ref={ref}>
      {images.map((props) => (
        <Frame
          key={props.url}
          {...props}
          GOLDENRATIO={GOLDENRATIO}
          scaleFactor={15}
          onFrameClick={onFrameClick}
          animationComplete={animationComplete}
          aspectRatio={ASPECT_RATIOS[props.title] || GOLDENRATIO}
        />
      ))}
    </group>
  );
};

Frames.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      position: PropTypes.array.isRequired,
      rotation: PropTypes.array.isRequired
    })
  ).isRequired,
  onFrameClick: PropTypes.func,
  animationComplete: PropTypes.bool
};

export default Frames;