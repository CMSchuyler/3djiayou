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
  
  // 使用useRef存储相机的当前状态
  const cameraStateRef = useRef({
    // 初始位置
    initialPosition: { x: 0, y: 7, z: 1150 },
    // 点击相框前的位置（会在每次点击前更新）
    preMovePosition: { x: 0, y: 7, z: 1150 },
    // 当前目标位置
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

  // 从映射文件加载图片数据
  useEffect(() => {
    const loadImagesFromMapping = async () => {
      setLoading(true);
      try {
        // 尝试加载图片映射文件
        const response = await fetch('/downloaded_images/image_mapping.json');
        
        // 如果映射文件存在，使用它
        if (response.ok) {
          const mapping = await response.json();
          
          // 构建图片数据
          const imageData = mapping.map((entry, index) => {
            // 直接使用本地路径
            const imageUrl = entry.localPath;
            
            return {
              url: imageUrl,
              title: entry.title || `Item ${index + 1}`,
              position: index < 22 
                ? [-15, 7, 50 + index * 50] // 左侧
                : [15, 7, 75 + (index - 22) * 50], // 右侧
              rotation: index < 22 
                ? [0, Math.PI / 12, 0] // 向右倾斜
                : [0, -Math.PI / 12, 0], // 向左倾斜
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
      
      // 只有在动画完成且没有聚焦相框时才允许滚轮控制
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
          
          // 初始化相机位置引用
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
        
        // 处理相机移动到相框或从相框返回
        if (focusedFrame && animationRef.current.isMovingToFrame) {
          const { position, isLeftSide } = focusedFrame;
          
          // ===== 相机移动位置计算（可根据需要修改） =====
          // 修改这里的值以调整相机相对于相框的位置
          const offsetX = isLeftSide ? 5 : -5; // 左侧相框相机偏右，右侧相框相机偏左
          const offsetY = 0; // Y轴偏移，0表示与相框同高
          const offsetZ = 20; // Z轴偏移，负值表示在相框前方
          
          // 计算目标位置
          const targetX = position[0] + offsetX;
          const targetY = position[1] + offsetY;
          const targetZ = position[2] + offsetZ; // 使用加法，因为负的offsetZ会使相机向前移动
          
          // 更新目标位置
          cameraStateRef.current.targetPosition = {
            x: targetX,
            y: targetY,
            z: targetZ
          };
          // ============================================
          
          const easingFactor = 0.05;
          state.camera.position.x += (targetX - state.camera.position.x) * easingFactor;
          state.camera.position.y += (targetY - state.camera.position.y) * easingFactor;
          state.camera.position.z += (targetZ - state.camera.position.z) * easingFactor;
          
          // 当相机接近目标位置时，完成移动
          const distanceToTarget = Math.sqrt(
            Math.pow(targetX - state.camera.position.x, 2) +
            Math.pow(targetY - state.camera.position.y, 2) +
            Math.pow(targetZ - state.camera.position.z, 2)
          );
          
          if (distanceToTarget < 0.5) {
            animationRef.current.isMovingToFrame = false;
            
            // 精确设置到目标位置
            state.camera.position.x = targetX;
            state.camera.position.y = targetY;
            state.camera.position.z = targetZ;
          }
          
        } else if (animationRef.current.isReturningFromFrame) {
          // 获取移动前的位置
          const { preMovePosition } = cameraStateRef.current;
          const easingFactor = 0.05;
          
          // 返回到移动前的位置
          state.camera.position.x += (preMovePosition.x - state.camera.position.x) * easingFactor;
          state.camera.position.y += (preMovePosition.y - state.camera.position.y) * easingFactor;
          state.camera.position.z += (preMovePosition.z - state.camera.position.z) * easingFactor;
          
          // 当相机接近原始位置时，完成返回
          const distanceToOriginal = Math.sqrt(
            Math.pow(preMovePosition.x - state.camera.position.x, 2) +
            Math.pow(preMovePosition.y - state.camera.position.y, 2) +
            Math.pow(preMovePosition.z - state.camera.position.z, 2)
          );
          
          // 更精确的检测返回完成条件
          if (distanceToOriginal < 0.5) {
            // 强制设置相机位置
            state.camera.position.x = preMovePosition.x;
            state.camera.position.y = preMovePosition.y;
            state.camera.position.z = preMovePosition.z;
            
            // 重置所有状态
            animationRef.current.isReturningFromFrame = false;
            animationRef.current.targetZ = preMovePosition.z;
            
            // 如果有回调函数，在相机返回原位后调用
            if (typeof animationRef.current.returnCallback === 'function') {
              animationRef.current.returnCallback();
              animationRef.current.returnCallback = null;
            }
            
            setFocusedFrame(null);
            
            console.log("相机已返回原位置:", state.camera.position);
          }
          
        } else {
          // 正常模式下的相机控制
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
            
            // 在正常模式下，持续更新preMovePosition
            cameraStateRef.current.preMovePosition = {
              x: state.camera.position.x,
              y: state.camera.position.y,
              z: state.camera.position.z
            };
          }
          
          // 只在非聚焦状态下应用滚轮控制的z轴移动
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

  // 返回原位置的函数，添加一个可选的回调参数
  const returnToOriginalPosition = (callback) => {
    if (focusedFrame) {
      animationRef.current.isReturningFromFrame = true;
      console.log("触发相机返回原位");
      
      // 存储回调函数，在相机完成返回时调用
      animationRef.current.returnCallback = callback;
    }
  };
  
  // 通过useImperativeHandle暴露方法给父组件
  useImperativeHandle(ref, () => ({
    returnToOriginalPosition
  }));

  // 处理相框点击
  const handleFrameClick = (title, xPosition) => {
    // 如果已经聚焦在相框上，点击任何相框都会返回原位并关闭面板
    if (focusedFrame) {
      // 调用returnToOriginalPosition并传入回调函数，在相机返回原位后关闭面板
      returnToOriginalPosition(() => {
        if (onFrameClick) {
          // 传递当前聚焦的相框标题，让App组件知道要关闭哪个面板
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
    
    // 找到被点击的相框
    const clickedFrame = images.find(img => img.title === title);
    if (clickedFrame) {
      // 在移动前记录当前相机位置
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
        isLeftSide: xPosition < 0 // 判断是左侧还是右侧相框
      });
      animationRef.current.isMovingToFrame = true;
      
      // 调用传入的onFrameClick函数
      if (onFrameClick) {
        onFrameClick(title, xPosition);
      }
    }
  };

  // 添加键盘事件监听器，按ESC键返回原位
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

// 添加displayName
Gallery.displayName = 'Gallery';

Gallery.propTypes = {
  onFrameClick: PropTypes.func
};

Gallery.defaultProps = {
  onFrameClick: () => {}
};

export default Gallery;