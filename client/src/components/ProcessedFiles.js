import React, { useState } from 'react';
import { Download, Package, RotateCcw, CheckCircle } from 'lucide-react';
import JSZip from 'jszip';
import axios from 'axios';
import './ProcessedFiles.css';

const ProcessedFiles = ({ files, totalUploaded, onReset }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadSingle = async (filename) => {
    try {
      const response = await axios.get(`/api/download/${filename}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleDownloadAll = async () => {
    if (files.length === 0) return;

    setDownloading(true);

    try {
      const zip = new JSZip();

      // Fetch all files and add to zip
      for (const file of files) {
        const response = await axios.get(`/api/download/${file.filename}`, {
          responseType: 'blob',
        });
        zip.file(file.filename, response.data);
      }

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download zip
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'processed-files.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Batch download error:', error);
      alert('Failed to download files');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="processed-files-container fade-in">
      <div className="success-card">
        <div className="success-icon">
          <CheckCircle size={64} />
        </div>
        
        <h2>Processing Complete!</h2>
        <p className="success-message">
          Successfully processed {files.length} of {totalUploaded} file{totalUploaded !== 1 ? 's' : ''}
        </p>

        <div className="files-list">
          <h3>Processed Files</h3>
          {files.map((file, index) => (
            <div key={index} className="processed-file-item">
              <span className="file-name">{file.originalName}</span>
              <button
                className="download-single-btn"
                onClick={() => handleDownloadSingle(file.filename)}
              >
                <Download size={18} />
                Download
              </button>
            </div>
          ))}
        </div>

        <div className="action-buttons">
          <button
            className="download-all-btn"
            onClick={handleDownloadAll}
            disabled={downloading || files.length === 0}
          >
            {downloading ? (
              <>
                <div className="spinner"></div>
                Creating ZIP...
              </>
            ) : (
              <>
                <Package size={20} />
                Download All as ZIP
              </>
            )}
          </button>

          <button className="reset-btn" onClick={onReset}>
            <RotateCcw size={20} />
            Process More Files
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessedFiles;
