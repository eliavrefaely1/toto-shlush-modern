'use client';

const InstructionsSection = ({ icon: Icon, title, children }) => {
  return (
    <section className="card">
      <div className="card-header flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-blue-600" />}
        <h2 className="text-xl font-bold text-blue-800">{title}</h2>
      </div>
      <div className="card-content text-gray-700 leading-7">
        {children}
      </div>
    </section>
  );
};

export default InstructionsSection;
