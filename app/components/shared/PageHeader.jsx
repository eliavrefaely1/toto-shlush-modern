'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  showBackButton = true, 
  backUrl = '/',
  actions 
}) => {
  const router = useRouter();

  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        {Icon && <Icon className="w-8 h-8 text-blue-600" />}
        <h1 className="text-3xl font-bold text-blue-800">{title}</h1>
      </div>
      
      {subtitle && (
        <p className="text-lg text-gray-600 mb-4">{subtitle}</p>
      )}

      {showBackButton && (
        <div className="mb-4 flex items-center gap-2 flex-wrap justify-center">
          <button 
            onClick={() => router.push(backUrl)} 
            className="btn btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            חזרה
          </button>
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
