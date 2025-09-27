'use client';

const ProgressBar = ({ 
  progress, 
  total = 100, 
  showPercentage = true, 
  color = 'blue',
  size = 'md',
  animated = false 
}) => {
  const percentage = Math.min(100, Math.max(0, (progress / total) * 100));
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      <div className={`bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full transition-all duration-300 ${colorClasses[color]} ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-gray-600 mt-1 text-center">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
