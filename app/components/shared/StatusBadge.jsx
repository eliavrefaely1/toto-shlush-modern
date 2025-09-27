'use client';

const StatusBadge = ({ status, type = 'default' }) => {
  const statusConfig = {
    paid: { text: '✓ שולם', classes: 'bg-green-100 text-green-800' },
    unpaid: { text: '✗ לא שולם', classes: 'bg-red-100 text-red-800' },
    locked: { text: '🔒 נעול', classes: 'bg-yellow-100 text-yellow-800' },
    unlocked: { text: '🔓 פתוח', classes: 'bg-green-100 text-green-800' },
    active: { text: 'פעיל', classes: 'bg-green-100 text-green-800' },
    inactive: { text: 'לא פעיל', classes: 'bg-gray-100 text-gray-800' }
  };

  const config = statusConfig[status] || { 
    text: status, 
    classes: type === 'success' ? 'bg-green-100 text-green-800' :
             type === 'error' ? 'bg-red-100 text-red-800' :
             type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
             'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.classes}`}>
      {config.text}
    </span>
  );
};

export default StatusBadge;
