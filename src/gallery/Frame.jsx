import { useRef, useState } from 'react';
import { easing } from 'maath';
import getUuid from 'uuid-by-string';
import { useCursor, Image as DreiImage, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import PropTypes from 'prop-types';

const Frame = ({
  url,
  title,
  position,
  rotation,
  scaleFactor,
  GOLDENRATIO,
  onFrameClick,
  animationComplete,
  aspectRatio
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
        if (image.current.scale) {
          easing.damp3(
            image.current.scale,
            [0.85 * (hovered ? 0.85 : 1), 0.9 * (hovered ? 0.905 : 1), 1],
            0.1,
            delta
          );
        }
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

  // Frame尺寸计算
  const frameWidth = 1 * scaleFactor;
  const frameHeight = frameWidth / aspectRatio;

  // 计算图片缩放
  // 如果图片比例大于frame比例，以宽度为准
  // 如果图片比例小于frame比例，以高度为准
  const imageScaleX = 0.9; // 留出一些边距
  const imageScaleY = imageScaleX * (frameWidth / frameHeight);

  return (
    <group position={position} rotation={rotation}>
      <mesh
        name={name}
        onPointerOver={(e) => (e.stopPropagation(), hover(true))}
        onPointerOut={() => hover(false)}
        onClick={handleClick}
        position={[0, GOLDENRATIO / 2, 0]}
        scale={[frameWidth, frameHeight, 0.05 * scaleFactor]}
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
        <DreiImage
          raycast={() => null}
          ref={image}
          position={[0, 0, 1]}
          url={url}
          transparent
          opacity={imageOpacity}
          scale={[imageScaleX, imageScaleY, 1]}
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
  animationComplete: PropTypes.bool,
  aspectRatio: PropTypes.number.isRequired
};

export default Frame;