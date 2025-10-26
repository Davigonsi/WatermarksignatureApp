import React, { useRef } from 'react';
import { Type, Image as ImageIcon, Check, X } from 'lucide-react';
import axios from 'axios';
import './WatermarkControls.css';

const WatermarkControls = ({ settings, onChange, onApply, onRemove, isApplied, onRealtimeUpdate }) => {
  const fileInputRef = useRef(null);

  const handleChange = (field, value) => {
    onChange({ ...settings, [field]: value });
    
    // Real-time update for specific properties
    if (onRealtimeUpdate && isApplied) {
      if (field === 'opacity' || field === 'rotation' || field === 'color' || field === 'fontSize') {
        onRealtimeUpdate(field, value);
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('watermark', file);

      const response = await axios.post('/api/upload-watermark', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      if (response.data.success) {
        const imageUrl = `/api/files/${response.data.filename}`;
        handleChange('imageUrl', imageUrl);
      }
    } catch (error) {
      console.error('Watermark upload error:', error);
      alert('Failed to upload watermark image');
    }
  };

  return (
    <div className="watermark-controls">
      <h3>Watermark Settings</h3>

      <div className="control-group">
        <label>Type</label>
        <div className="type-buttons">
          <button
            className={`type-btn ${settings.type === 'text' ? 'active' : ''}`}
            onClick={() => handleChange('type', 'text')}
          >
            <Type size={18} />
            Text
          </button>
          <button
            className={`type-btn ${settings.type === 'image' ? 'active' : ''}`}
            onClick={() => handleChange('type', 'image')}
          >
            <ImageIcon size={18} />
            Image
          </button>
        </div>
      </div>

      {settings.type === 'text' ? (
        <>
          <div className="control-group">
            <label>Text</label>
            <input
              type="text"
              value={settings.text}
              onChange={(e) => handleChange('text', e.target.value)}
              placeholder="Enter watermark text"
            />
          </div>

          <div className="control-group">
            <label>Font Size: {settings.fontSize}px</label>
            <input
              type="range"
              min="12"
              max="120"
              value={settings.fontSize}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Color</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={settings.color}
                onChange={(e) => handleChange('color', e.target.value)}
              />
              <span className="color-value">{settings.color}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="control-group">
          <label>Upload Image</label>
          <button
            className="upload-image-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={18} />
            {settings.imageUrl ? 'Change Image' : 'Select Image'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          {settings.imageUrl && (
            <div className="image-preview">
              <img src={settings.imageUrl} alt="Watermark" />
            </div>
          )}
        </div>
      )}

      <div className="control-group">
        <label>Opacity: {Math.round(settings.opacity * 100)}%</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.opacity}
          onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>Rotation: {settings.rotation}°</label>
        <input
          type="range"
          min="-180"
          max="180"
          value={settings.rotation}
          onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
        />
      </div>

      <div className="watermark-action-buttons">
        <button className="apply-watermark-btn" onClick={onApply}>
          <Check size={18} />
          {isApplied ? 'Update Watermark' : 'Apply Watermark'}
        </button>
        {isApplied && (
          <button className="remove-watermark-btn" onClick={onRemove}>
            <X size={18} />
            Remove
          </button>
        )}
      </div>

      <div className="control-group">
        <div className="info-box">
          <p>💡 <strong>Tip:</strong> Click and drag the watermark on the canvas to position it anywhere. Use the corner handles to resize and rotate.</p>
        </div>
      </div>
    </div>
  );
};

export default WatermarkControls;
