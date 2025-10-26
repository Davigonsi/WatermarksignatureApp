import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Pen, Eraser, Upload, Check, X } from 'lucide-react';
import './SignaturePad.css';

const SignaturePad = ({ onSignatureChange, onApply, onRemove, isApplied }) => {
  const sigPadRef = useRef(null);
  const fileInputRef = useRef(null);
  const [signatureMethod, setSignatureMethod] = useState('draw'); // draw or upload
  const [uploadedSignature, setUploadedSignature] = useState(null);
  const [penColor, setPenColor] = useState('#000000');

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      onSignatureChange(null);
    }
  };

  const handleApply = () => {
    if (signatureMethod === 'draw' && sigPadRef.current && !sigPadRef.current.isEmpty()) {
      const dataURL = sigPadRef.current.toDataURL('image/png');
      onSignatureChange(dataURL);
      if (onApply) onApply();
    } else if (signatureMethod === 'upload' && uploadedSignature) {
      onSignatureChange(uploadedSignature);
      if (onApply) onApply();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedSignature(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="signature-pad-container">
      <h3>E-Signature</h3>

      <div className="signature-method-buttons">
        <button
          className={`method-btn ${signatureMethod === 'draw' ? 'active' : ''}`}
          onClick={() => setSignatureMethod('draw')}
        >
          <Pen size={18} />
          Draw
        </button>
        <button
          className={`method-btn ${signatureMethod === 'upload' ? 'active' : ''}`}
          onClick={() => setSignatureMethod('upload')}
        >
          <Upload size={18} />
          Upload
        </button>
      </div>

      {signatureMethod === 'draw' ? (
        <div className="signature-canvas-wrapper">
          <div className="signature-color-picker">
            <label>Pen Color:</label>
            <div className="color-options">
              {['#000000', '#1e40af', '#dc2626', '#16a34a', '#9333ea', '#ea580c'].map(color => (
                <button
                  key={color}
                  className={`color-btn ${penColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setPenColor(color);
                    if (sigPadRef.current) {
                      sigPadRef.current.clear();
                    }
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
          <SignatureCanvas
            ref={sigPadRef}
            penColor={penColor}
            canvasProps={{
              className: 'signature-canvas',
            }}
            backgroundColor="rgba(255, 255, 255, 0)"
          />
          <button className="clear-btn" onClick={handleClear}>
            <Eraser size={18} />
            Clear
          </button>
        </div>
      ) : (
        <div className="signature-upload">
          <button
            className="upload-signature-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} />
            {uploadedSignature ? 'Change Signature' : 'Upload Signature'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          {uploadedSignature && (
            <div className="signature-preview">
              <img src={uploadedSignature} alt="Signature" />
            </div>
          )}
        </div>
      )}

      <div className="signature-action-buttons">
        <button className="apply-signature-btn" onClick={handleApply}>
          <Check size={18} />
          {isApplied ? 'Update Signature' : 'Apply Signature'}
        </button>
        {isApplied && onRemove && (
          <button className="remove-signature-btn" onClick={onRemove}>
            <X size={18} />
            Remove
          </button>
        )}
      </div>

      <div className="info-box">
        <p>💡 <strong>Tip:</strong> After applying, drag the signature on the canvas to reposition it. Use corner handles to resize.</p>
      </div>
    </div>
  );
};

export default SignaturePad;
