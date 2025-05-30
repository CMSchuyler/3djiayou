import Gallery from './Gallery';
import Ocean from './Ocean';
import { Environment, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import PropTypes from 'prop-types';
import { useRef } from 'react';

const RotatingStars = () => {
  const starsRef = useRef();
  
  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.05;
    }
  });
  
  return (
    <>
      <Stars ref={starsRef} radius={300} depth={50} count={5000} factor={4} />
      <Environment 
        files={'/textures/shanmai3.hdr'} 
        background 
        environmentIntensity={1} 
        resolution={1024}
        blur={0}
      />
    </>
  );
};

const Scene = ({ onFrameClick, galleryRef }) => {
  return (
    <Canvas
      shadows
      camera={{
        fov: 75,
        position: [0, 0, 0],
        rotation: [-Math.PI * 0.5, 0, 0],
      }}
    >
      <Gallery ref={galleryRef} onFrameClick={onFrameClick} />
      <Ocean />
      <RotatingStars />
    </Canvas>
  );
};

Scene.propTypes = {
  onFrameClick: PropTypes.func,
  galleryRef: PropTypes.object
};

export default Scene;