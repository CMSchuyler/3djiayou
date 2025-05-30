import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import PropTypes from 'prop-types';
import Frames from './Frames';

// 初始空数组，将被图片数据替换
const defaultImages = [];

const Gallery = forwardRef(({ onFrameClick }, ref) => {
  const { progress } = useProgress();
  const [times, setTimes] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentRotation, setCurrentRotation] = useState({ x: 0, y: 0 });
  const [animationComplete, setAnimationComplete] = useState(false);
  const [focusedFrame, setFocusedFrame] = useState(null);
  const [images, setImages] = useState(defaultImages);
  const [loading, setLoading] = useState(true);
  
  const cameraStateRef = useRef({
    initialPosition: { x: 0, y: 7, z: 1150 },
    preMovePosition: { x: 0, y: 7, z: 1150 },
    targetPosition: { x: 0, y: 7, z: 1150 }
  });
  
  const animationRef = useRef({
    complete: false,
    initialPositionSet: false,
    currentZ: 1150,
    targetZ: 1150,
    isMovingToFrame: false,
    isReturningFromFrame: false
  });

  useEffect(() => {
    const loadImagesFromMapping = async () => {
      setLoading(true);
      try {
        const response = await fetch('/downloaded_images/image_mapping.json');
        
        if (response.ok) {
          const mapping = await response.json();
          
          const imageData = mapping.map((entry, index) => {
            const isEven = index % 2 === 0;
            const row = Math.floor(index / 2);
            const Z_OFFSET = 25; // 右侧相框比左侧Z轴偏移量
            
            return {
              url: entry.localPath,
              title: entry.title || `Item ${index + 1}`,
              position: isEven
                ? [-15, 7, 50 + row * 50] // 左侧
                : [15, 7, (50 + row * 50) + Z_OFFSET], // 右侧，Z轴增加固定偏移
              rotation: isEven
                ? [0, Math.PI / 12, 0]
                : [0, -Math.PI / 12, 0]
            };
          });
          
          setImages(imageData);
          console.log('从映射文件加载了图片数据', imageData.length);
        } else {
          console.error('映射文件不存在');
          setLoading(false);
        }
      } catch (error) {
        console.error('加载图片映射失败:', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadImagesFromMapping();
  }, []);

  useEffect(() => {
    const mouseMoveHandler = (event) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      });
    };

    window.addEventListener('mousemove', mouseMoveHandler);
    return () => window.removeEventListener('mousemove', mouseMoveHandler);
  }, []);

  useEffect(() => {
    const wheelHandler = (event) => {
      event.preventDefault();
      
      if (animationRef.current.complete && !focusedFrame && !animationRef.current.isMovingToFrame && !animationRef.current.isReturningFromFrame) {
        const scrollDirection = Math.sign(event.deltaY);
        const scrollAmount = 10;
        
        const newTarget = animationRef.current.targetZ - scrollDirection * scrollAmount;
        animationRef.current.targetZ = Math.max(50, Math.min(1150, newTarget));
      }
    };
    
    window.addEventListener('wheel', wheelHandler, { passive: false });
    return () => window.removeEventListener('wheel', wheelHandler, { passive: false });
  }, [focusedFrame]);
  
  useFrame((state) => {
    const elapsedTime = state.clock.getElapsedTime();
    
    if (progress === 100) {
      if (times.length === 0) setTimes([elapsedTime]);
      const delay = 8 + times[0];
      
      if (elapsedTime < delay) {
        const startZ = 1000;
        const endZ = 1150;
        const t = elapsedTime / delay;
        
        state.camera.position.z = startZ + t * (endZ - startZ);
        state.camera.position.y = 7;
        state.camera.rotation.x = 0;
        
        animationRef.current.currentZ = state.camera.position.z;
        animationRef.current.targetZ = endZ;
        animationRef.current.complete = false;
        setAnimationComplete(false);
      } else {
        if (!animationRef.current.initialPositionSet) {
          animationRef.current.currentZ = state.camera.position.z;
          animationRef.current.targetZ = state.camera.position.z;
          animationRef.current.initialPositionSet = true;
          animationRef.current.complete = true;
          
          cameraStateRef.current.initialPosition = {
            x: 0,
            y: 7,
            z: state.camera.position.z
          };
          cameraStateRef.current.preMovePosition = {
            x: 0,
            y: 7,
            z: state.camera.position.z
          };
          
          setAnimationComplete(true);
        }
        
        if (!animationRef.current.complete) {
          animationRef.current.complete = true;
          setAnimationComplete(true);
        }
        
        if (focusedFrame && animationRef.current.isMovingToFrame) {
          const { position, isLeftSide } = focusedFrame;
          
          const offsetX = isLeftSide ? 5 : -5;
          const offsetY = 0;
          const offsetZ = 20;
          
          const targetX = position[0] + offsetX;
          const targetY = position[1] + offsetY;
          const targetZ = position[2] + offsetZ;
          
          cameraStateRef.current.targetPosition = {
            x: targetX,
            y: targetY,
            z: targetZ
          };
          
          const easingFactor = 0.05;
          state.camera.position.x += (targetX - state.camera.position.x) * easingFactor;
          state.camera.position.y += (targetY - state.camera.position.y) * easingFactor;
          state.camera.position.z += (targetZ - state.camera.position.z) * easingFactor;
          
          const distanceToTarget = Math.sqrt(
            Math.pow(targetX - state.camera.position.x, 2) +
            Math.pow(targetY - state.camera.position.y, 2) +
            Math.pow(targetZ - state.camera.position.z, 2)
          );
          
          if (distanceToTarget < 0.5) {
            animationRef.current.isMovingToFrame = false;
            
            state.camera.position.x = targetX;
            state.camera.position.y = targetY;
            state.camera.position.z = targetZ;
          }
          
        } else if (animationRef.current.isReturningFromFrame) {
          const { preMovePosition } = cameraStateRef.current;
          const easingFactor = 0.05;
          
          state.camera.position.x += (preMovePosition.x - state.camera.position.x) * easingFactor;
          state.camera.position.y += (preMovePosition.y - state.camera.position.y) * easingFactor;
          state.camera.position.z += (preMovePosition.z - state.camera.position.z) * easingFactor;
          
          const distanceToOriginal = Math.sqrt(
            Math.pow(preMovePosition.x - state.camera.position.x, 2) +
            Math.pow(preMovePosition.y - state.camera.position.y, 2) +
            Math.pow(preMovePosition.z - state.camera.position.z, 2)
          );
          
          if (distanceToOriginal < 0.5) {
            state.camera.position.x = preMovePosition.x;
            state.camera.position.y = preMovePosition.y;
            state.camera.position.z = preMovePosition.z;
            
            animationRef.current.isReturningFromFrame = false;
            animationRef.current.targetZ = preMovePosition.z;
            
            if (typeof animationRef.current.returnCallback === 'function') {
              animationRef.current.returnCallback();
              animationRef.current.returnCallback = null;
            }
            
            setFocusedFrame(null);
            
            console.log("相机已返回原位置:", state.camera.position);
          }
          
        } else {
          state.camera.position.y = 7;
          
          if (animationRef.current.complete && !focusedFrame) {
            const rotationSpeed = 0.05;
            const easingFactor = 0.1;
            
            const targetRotationY = -mousePosition.x * rotationSpeed;
            const targetRotationX = mousePosition.y * rotationSpeed;
            
            setCurrentRotation(prev => ({
              x: prev.x + (targetRotationX - prev.x) * easingFactor,
              y: prev.y + (targetRotationY - prev.y) * easingFactor
            }));
            
            state.camera.rotation.y = currentRotation.y;
            state.camera.rotation.x = currentRotation.x;
            
            cameraStateRef.current.preMovePosition = {
              x: state.camera.position.x,
              y: state.camera.position.y,
              z: state.camera.position.z
            };
          }
          
          if (!focusedFrame) {
            const currentZ = state.camera.position.z;
            const distance = animationRef.current.targetZ - currentZ;
            
            if (Math.abs(distance) > 0.1) {
              const acceleration = 0.05;
              const step = distance * acceleration;
              state.camera.position.z += step;
            }
          }
        }
      }
    }
  });

  const returnToOriginalPosition = (callback) => {
    if (focusedFrame) {
      animationRef.current.isReturningFromFrame = true;
      console.log("触发相机返回原位");
      
      animationRef.current.returnCallback = callback;
    }
  };
  
  useImperativeHandle(ref, () => ({
    returnToOriginalPosition
  }));

  const handleFrameClick = (title, xPosition) => {
    if (focusedFrame) {
      returnToOriginalPosition(() => {
        if (onFrameClick) {
          const currentTitle = images.find(img => 
            img.position[0] === focusedFrame.position[0] && 
            img.position[1] === focusedFrame.position[1] && 
            img.position[2] === focusedFrame.position[2]
          )?.title;
          
          if (currentTitle) {
            onFrameClick(currentTitle, focusedFrame.isLeftSide ? -1 : 1);
          }
        }
      });
      return;
    }
    
    const clickedFrame = images.find(img => img.title === title);
    if (clickedFrame) {
      const camera = document.querySelector('canvas')?.['__r3f']?.state?.camera;
      if (camera) {
        cameraStateRef.current.preMovePosition = {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        };
        console.log("记录移动前位置:", cameraStateRef.current.preMovePosition);
      }
      
      setFocusedFrame({
        position: clickedFrame.position,
        isLeftSide: xPosition < 0
      });
      animationRef.current.isMovingToFrame = true;
      
      if (onFrameClick) {
        onFrameClick(title, xPosition);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && focusedFrame) {
        returnToOriginalPosition();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedFrame]);

  return (
    <group>
      {loading ? (
        <mesh>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ) : (
        <Frames 
          images={images} 
          onFrameClick={handleFrameClick}
          animationComplete={animationComplete}
        />
      )}
    </group>
  );
});

Gallery.displayName = 'Gallery';

Gallery.propTypes = {
  onFrameClick: PropTypes.func
};

Gallery.defaultProps = {
  onFrameClick: () => {}
};

export default Gallery;