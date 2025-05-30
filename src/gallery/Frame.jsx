import { useRef, useState, useEffect } from 'react';
import { easing } from 'maath';
import getUuid from 'uuid-by-string';
import { useCursor, Image, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import PropTypes from 'prop-types';

const FRAME_RATIOS = {
  'Item 1': { width: 15, height: 12 },
  'Item 2': { width: 15, height: 12 },
  'Item 3': { width: 15, height: 12 },
  'Item 4': { width: 15, height: 12 },
  'Item 5': { width: 15, height: 12 },
  'Item 6': { width: 15, height: 12 },
  'Item 7': { width: 15, height: 12 },
  'Item 8': { width: 15, height: 12 },
  'Item 9': { width: 15, height: 12 },
  'Item 10': { width: 15, height: 12 },
  // ... 可以根据控制台输出的实际比例继续添加
};

const Frame = ({
  url,
  title,
  position,
  rotation,
  scaleFactor,
  GOLDENRATIO,
  onFrameClick,
  animationComplete
}) => {
  const image = useRef();
  const frame = useRef();
  const [hovered, hover] = useState(false);
  const [imageOpacity, setImageOpacity] = useState(0);
  const name = getUuid(url);
  useCursor(hovered);

  useFrame((state, delta) => {
    if (!state || !state.camera || !position || !image.current || !frame.current) {
      return;
    }
    
    try {
      const zDistance = Math.abs(state.camera.position.z - position[2]);
      
      const showThreshold = 120;
      const fadeThreshold = 180;
      
      let opacity = 0;
      if (zDistance < showThreshold) {
        opacity = 1;
      } else if (zDistance < fadeThreshold) {
        opacity = 1 - (zDistance - showThreshold) / (fadeThreshold - showThreshold);
      }
      
      setImageOpacity(Math.max(0, Math.min(1, opacity)));
  
      if (image.current.material) {
        easing.damp3(
          image.current.scale,
          [0.85 * (hovered ? 0.85 : 1), 0.9 * (hovered ? 0.905 : 1), 1],
          0.1,
          delta
        );
      }
      
      if (frame.current.material && frame.current.material.color) {
        easing.dampC(
          frame.current.material.color,
          hovered ? '#4B0401' : '#FAE3CA',
          0.1,
          delta
        );
      }
    } catch (error) {
      console.error('Error in animation frame:', error);
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (animationComplete && onFrameClick) {
      onFrameClick(title, position[0]);
    }
  };

  // 使用固定的宽高比
  const frameRatio = FRAME_RATIOS[title] || { width: 15, height: 12 };
  const adjustedWidth = frameRatio.width;
  const boundedHeight = frameRatio.height;

  return (
    <group position={position} rotation={rotation}>
      <mesh
        name={name}
        onPointerOver={(e) => (e.stopPropagation(), hover(true))}
        onPointerOut={() => hover(false)}
        onClick={handleClick}
        position={[0, GOLDENRATIO / 2, 0]}
        scale={[adjustedWidth, boundedHeight, 0.05 * scaleFactor]}
      >
        <boxGeometry />
        <meshStandardMaterial
          color="#151515"
          metalness={0.5}
          roughness={0.5}
          envMapIntensity={1}
        />
        <mesh
          ref={frame}
          raycast={() => null}
          scale={[0.9, 0.93, 0.9]}
          position={[0, 0, 0.2]}
        >
          <boxGeometry />
          <meshBasicMaterial toneMapped={false} fog={false} />
        </mesh>
        <Image
          raycast={() => null}
          ref={image}
          position={[0, 0, 1]}
          url={url}
          transparent
          opacity={imageOpacity}
          scale={[0.9, 0.9, 1]}
          grayscale={0}
          toneMapped={false}
        />
      </mesh>
      <Text
        maxWidth={0.1}
        anchorX="left"
        anchorY="top"
        position={[8, GOLDENRATIO * 6.5, 0]}
        fontSize={0.5}
      >
        {title}
      </Text>
    </group>
  );
};

Frame.propTypes = {
  url: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  position: PropTypes.array.isRequired,
  rotation: PropTypes.array.isRequired,
  scaleFactor: PropTypes.number.isRequired,
  GOLDENRATIO: PropTypes.number.isRequired,
  onFrameClick: PropTypes.func,
  animationComplete: PropTypes.bool
};

export default Frame;