'use client';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'אישור פעולה', 
  message = 'האם אתה בטוח?', 
  confirmText = 'אישור', 
  cancelText = 'ביטול',
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const typeClasses = {
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const buttonClasses = {
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border ${typeClasses[type]}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded font-medium ${buttonClasses[type]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
