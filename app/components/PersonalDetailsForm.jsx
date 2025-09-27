'use client';

const PersonalDetailsForm = ({ formData, handleInputChange }) => {
  return (
    <div className="card mb-6">
      <div className="card-header">
        <h2 className="text-xl font-bold text-blue-800">פרטים אישיים</h2>
      </div>
      <div className="card-content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="input"
              placeholder="הזן את שמך"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;
