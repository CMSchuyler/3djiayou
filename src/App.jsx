import Scene from './gallery/Scene';
import InfoPanel from './gallery/InfoPanel';
import { useState, useRef } from 'react';

function App() {
  const [panelInfo, setPanelInfo] = useState({
    visible: false,
    title: '',
    position: 0
  });
  
  // 创建一个ref来存储Gallery组件的引用
  const galleryRef = useRef(null);

  // 处理相框点击
  const handleFrameClick = (title, position) => {
    // 如果面板已经可见且点击了同一个相框，则关闭面板并返回原位
    if (panelInfo.visible && panelInfo.title === title) {
      setPanelInfo(prev => ({
        ...prev,
        visible: false
      }));
      
      // 调用Gallery的返回函数
      if (galleryRef.current) {
        galleryRef.current.returnToOriginalPosition();
      }
    } else {
      // 否则显示面板
      setPanelInfo({
        visible: true,
        title,
        position
      });
    }
  };

  // 处理面板关闭
  const handlePanelClose = () => {
    setPanelInfo(prev => ({
      ...prev,
      visible: false
    }));
    
    // 调用Gallery的返回函数
    if (galleryRef.current) {
      galleryRef.current.returnToOriginalPosition();
    }
  };

  return (
    <>
      <Scene onFrameClick={handleFrameClick} galleryRef={galleryRef} />
      <InfoPanel 
        title={panelInfo.title}
        visible={panelInfo.visible}
        onClose={handlePanelClose}
        position={panelInfo.position}
      />
    </>
  );
}

export default App;