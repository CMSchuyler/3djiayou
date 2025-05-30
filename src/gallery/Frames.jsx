import { useRef, useState, useEffect } from 'react';
import Frame from './Frame';
import PropTypes from 'prop-types';

const GOLDENRATIO = 1.61803398875;

// 创建图片比例缓存对象
const imageAspectRatios = {};

// 预加载函数，返回Promise以便知道何时完成
const preloadImageAspectRatios = (images) => {
  return new Promise((resolve) => {
    let loadedCount = 0;
    const totalImages = images.length;
    
    // 如果没有图片需要加载，直接完成
    if (totalImages === 0) {
      resolve();
      return;
    }

    // 对每个图片加载并计算比例
    images.forEach((imageData) => {
      const { url } = imageData;
      
      // 检查是否已经缓存过这个图片的比例
      if (imageAspectRatios[url]) {
        loadedCount++;
        if (loadedCount === totalImages) {
          resolve();
        }
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        try {
          if (img.width && img.height) {
            const aspectRatio = img.width / img.height;
            // 限制在合理范围内
            const boundedRatio = Math.max(0.5, Math.min(2.0, aspectRatio));
            imageAspectRatios[url] = boundedRatio;
          } else {
            // 如果无法获取尺寸，使用默认比例
            imageAspectRatios[url] = GOLDENRATIO;
          }
        } catch (err) {
          console.error(`Error processing image ${url}:`, err);
          imageAspectRatios[url] = GOLDENRATIO;
        }
        
        loadedCount++;
        if (loadedCount === totalImages) {
          resolve();
        }
      };
      
      img.onerror = () => {
        console.error(`Failed to load image: ${url}`);
        imageAspectRatios[url] = GOLDENRATIO;
        
        loadedCount++;
        if (loadedCount === totalImages) {
          resolve();
        }
      };
      
      img.crossOrigin = "Anonymous";
      img.src = url;
    });
  });
};

const Frames = ({ images, onFrameClick, animationComplete }) => {
  const ref = useRef();
  const [loading, setLoading] = useState(true);
  
  // 在组件挂载时预加载所有图片比例
  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      await preloadImageAspectRatios(images);
      setLoading(false);
    };
    
    loadImages();
  }, [images]);

  // 如果还在加载中，可以返回一个加载指示器或空内容
  if (loading) {
    return <group ref={ref}></group>;
  }

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
          preloadedAspectRatio={imageAspectRatios[props.url] || GOLDENRATIO}
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