'use client';

const MessageToast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const typeClasses = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded text-white shadow ${typeClasses[type]}`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageToast;
