import React, { useRef } from 'react';
import { Type, Image as ImageIcon, Check, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import './WatermarkControls.css';

const WatermarkControls = ({ settings, onChange, onApply, onRemove, isApplied, onRealtimeUpdate, onMoveStart, onMoveStop }) => {
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Read file as data URL for client-side processing
    const reader = new FileReader();
    reader.onload = (event) => {
      handleChange('imageUrl', event.target.result);
    };
    reader.onerror = (error) => {
      console.error('Error reading watermark image:', error);
      alert('Failed to load watermark image');
    };
    reader.readAsDataURL(file);
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

      {isApplied && onMoveStart && onMoveStop && (
        <div className="control-group">
          <label>Position</label>
          <div className="position-controls">
            <div className="position-row">
              <button 
                className="position-btn" 
                onMouseDown={() => onMoveStart('up')}
                onMouseUp={onMoveStop}
                onMouseLeave={onMoveStop}
                title="Move Up (Hold to move continuously)"
              >
                <ArrowUp size={20} />
              </button>
            </div>
            <div className="position-row">
              <button 
                className="position-btn" 
                onMouseDown={() => onMoveStart('left')}
                onMouseUp={onMoveStop}
                onMouseLeave={onMoveStop}
                title="Move Left (Hold to move continuously)"
              >
                <ArrowLeft size={20} />
              </button>
              <button 
                className="position-btn" 
                onMouseDown={() => onMoveStart('down')}
                onMouseUp={onMoveStop}
                onMouseLeave={onMoveStop}
                title="Move Down (Hold to move continuously)"
              >
                <ArrowDown size={20} />
              </button>
              <button 
                className="position-btn" 
                onMouseDown={() => onMoveStart('right')}
                onMouseUp={onMoveStop}
                onMouseLeave={onMoveStop}
                title="Move Right (Hold to move continuously)"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

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
          <p>💡 <strong>Tip:</strong> Use the arrow buttons above to position the watermark precisely on your document.</p>
        </div>
      </div>
    </div>
  );
};

export default WatermarkControls;
