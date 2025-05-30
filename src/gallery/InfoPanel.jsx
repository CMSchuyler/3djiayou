import { useEffect } from 'react';
import PropTypes from 'prop-types';

const InfoPanel = ({ title, visible, onClose, position }) => {
  // 当面板关闭时，只调用传入的onClose函数
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // 监听ESC键
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && visible) {
        handleClose();
      }
    };
    
    if (visible) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);
  
  if (!visible) return null;
  
  // If position is negative (left side), show panel on right side
  // If position is positive (right side), show panel on left side
  const side = position < 0 ? 'right' : 'left';
  
  return (
    <div 
      style={{
        position: 'fixed',
        [side]: '0',
        top: '0',
        width: '300px',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '20px',
        transition: 'all 0.3s ease',
        transform: visible ? 'translateX(0)' : `translateX(${side === 'left' ? '-100%' : '100%'})`,
        zIndex: 1000,
        cursor: 'pointer'
      }}
      onClick={handleClose}
    >
      <h2 style={{ 
        fontSize: '24px',
        marginTop: '20px',
        fontWeight: '300',
        color: '#fff'
      }}>
        {title}
      </h2>
    </div>
  );
};

InfoPanel.propTypes = {
  title: PropTypes.string,
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  position: PropTypes.number
};

InfoPanel.defaultProps = {
  title: '',
  visible: false,
  position: 0
};

export default InfoPanel;