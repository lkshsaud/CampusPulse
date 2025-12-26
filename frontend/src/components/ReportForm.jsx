import React from "react";
import { FiMapPin } from "react-icons/fi";

const ReportForm = ({
  formData,
  onChange,
  onSubmit,
  selectedLocation,
  onRemoveLocation
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const handleInputChange = (e) => {
    const { id, value, files } = e.target;
    if (id === "image") {
      onChange({ ...formData, image: files[0] });
    } else {
      onChange({ ...formData, [id]: value });
    }
  };

  return (
    <div className="form-container">
      <h2><FiMapPin /> Report Lost/Found Item</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="form-group">
          <label htmlFor="itemName">Item Name *</label>
          <input
            type="text"
            id="itemName"
            value={formData.itemName}
            onChange={handleInputChange}
            required
            placeholder="e.g., Wallet, Keys, Phone"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows="3"
            placeholder="Describe the item in detail..."
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="contact">Contact Number (10 digits)</label>
          <input
            type="tel"
            id="contact"
            value={formData.contact}
            onChange={handleInputChange}
            pattern="[0-9]{10}"
            placeholder="9812345678"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Upload Image (for better matching)</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-group">
          <label>Selected Location *</label>
          <div className="location-display">
            {selectedLocation ? (
              <div className="location-selected">
                <span className="location-coords">
                  📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </span>
                <button
                  type="button"
                  className="clear-location-btn"
                  onClick={onRemoveLocation}
                >
                  Clear
                </button>
              </div>
            ) : (
              <span className="location-hint">
                Click on the map to select location inside KU Campus
              </span>
            )}
          </div>
        </div>
        
        <button type="submit" className="submit-btn">
          <span className="submit-btn-text">📤 Submit Report</span>
        </button>
      </form>
    </div>
  );
};

export default ReportForm;