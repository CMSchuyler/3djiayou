import { useRef, useState, useEffect } from 'react';
import { easing } from 'maath';
import getUuid from 'uuid-by-string';
import { useCursor, Image, Text } from '@react-three/drei';
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
  preloadedAspectRatio
}) => {
  const image = useRef();
  const frame = useRef();
  const [hovered, hover] = useState(false);
  const [imageOpacity, setImageOpacity] = useState(0);
  const name = getUuid(url);
  useCursor(hovered);

  // 使用useFrame的安全方式
  useFrame((state, delta) => {
    // 确保必要的对象存在
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
  
      // 安全地访问材质属性
      if (image.current.material) {
        image.current.material.zoom = 1.1;
        
        // 安全地执行easing操作
        if (image.current.scale) {
          easing.damp3(
            image.current.scale,
            [0.85 * (hovered ? 0.85 : 1), 0.9 * (hovered ? 0.905 : 1), 1],
            0.1,
            delta
          );
        }
      }
      
      // 安全地访问frame材质
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
      // Pass the x position to determine which side the frame is on
      onFrameClick(title, position[0]);
    }
  };

  // 使用预加载的宽高比计算Frame尺寸
  const frameWidth = 1 * scaleFactor;
  const frameHeight = frameWidth / preloadedAspectRatio;
  
  // 限制高度在合理范围内
  const maxHeight = 1.2 * scaleFactor;
  const minHeight = 0.8 * scaleFactor;
  
  // 判断高度是否需要调整
  let boundedHeight = frameHeight;
  let adjustedWidth = frameWidth;
  
  // 如果高度超出最大值，按最大高度等比例缩小
  if (frameHeight > maxHeight) {
    boundedHeight = maxHeight;
    // 保持宽高比，重新计算宽度
    adjustedWidth = boundedHeight * preloadedAspectRatio;
  } 
  // 如果高度小于最小值，按最小高度等比例放大
  else if (frameHeight < minHeight) {
    boundedHeight = minHeight;
    // 保持宽高比，重新计算宽度
    adjustedWidth = boundedHeight * preloadedAspectRatio;
  }
  
  // 调整Image组件中的缩放因子，确保图片适应Frame
  const adjustImageZoom = () => {
    if (image.current && image.current.material) {
      // 根据Frame的尺寸调整图片的缩放
      image.current.material.zoom = 1.0; // 基础缩放值
    }
  };
  
  // 每次渲染后调整图片
  useEffect(() => {
    adjustImageZoom();
  }, [preloadedAspectRatio]);

  return (
    <group position={position} rotation={rotation}>
      <mesh
        name={name}
        onPointerOver={(e) => (e.stopPropagation(), hover(true))}
        onPointerOut={() => hover(false)}
        onClick={handleClick}
        position={[0, GOLDENRATIO / 2, 0]}
        scale={[
          adjustedWidth,
          boundedHeight,
          0.05 * scaleFactor,
        ]}
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

// 添加PropTypes验证
Frame.propTypes = {
  url: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  position: PropTypes.array.isRequired,
  rotation: PropTypes.array.isRequired,
  scaleFactor: PropTypes.number.isRequired,
  GOLDENRATIO: PropTypes.number.isRequired,
  onFrameClick: PropTypes.func,
  animationComplete: PropTypes.bool,
  preloadedAspectRatio: PropTypes.number
};

// 设置默认值
Frame.defaultProps = {
  preloadedAspectRatio: 1.61803398875 // 默认使用黄金比例
};

export default Frame;