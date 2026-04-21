import React, { useEffect } from 'react';

// 定义Modal的属性类型
interface ModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk?: () => void;
  title?: string;
  footer?: React.ReactNode;
  width?: string | number;
  closable?: boolean;
  maskClosable?: boolean;
  children: React.ReactNode;
  className?: string;
}

// Modal组件实现
const Modal: React.FC<ModalProps> = ({
  visible,
  onCancel,
  onOk,
  title,
  footer,
  width = 520,
  closable = true,
  maskClosable = true,
  children,
  className = '',
}) => {
  // 点击遮罩层关闭模态框
  const handleMaskClick = (e: React.MouseEvent) => {
    if (maskClosable && e.target === e.currentTarget) {
      onCancel();
    }
  };

  // 点击ESC键关闭模态框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onCancel();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onCancel]);

  // 如果不可见，不渲染任何内容
  if (!visible) return null;

  // 渲染默认的页脚
  const renderFooter = () => {
    if (footer) return footer;
    
    if (onOk) {
      return (
        <div className="flex justify-end space-x-2 pt-4 border-t shrink-0">
          <button
            className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            onClick={onOk}
          >
            确定
          </button>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleMaskClick}
      ></div>
      
      {/* 模态框内容 */}
      <div
        className={`bg-white rounded-lg shadow-xl z-10 flex flex-col ${className}`}
        style={{ width, maxHeight: '90vh' }}
      >
        {/* 模态框头部 */}
        {(title || closable) && (
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
            {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
            {closable && (
              <button 
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onCancel}
              >
                <i className="fa fa-times"></i>
              </button>
            )}
          </div>
        )}
        
        {/* 模态框主体 */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>
        
        {/* 模态框页脚 */}
        {renderFooter()}
      </div>
    </div>
  );
};

export default Modal;
