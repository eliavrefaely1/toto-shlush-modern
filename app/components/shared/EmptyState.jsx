'use client';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionText 
}) => {
  return (
    <div className="card text-center py-16">
      <div className="card-content">
        {Icon && <Icon className="w-20 h-20 text-gray-400 mx-auto mb-4" />}
        <h3 className="text-2xl font-bold text-gray-600 mb-2">{title}</h3>
        {description && (
          <p className="text-gray-500 mb-6">{description}</p>
        )}
        {action && actionText && (
          <button onClick={action} className="btn btn-primary text-lg py-3 px-6">
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
