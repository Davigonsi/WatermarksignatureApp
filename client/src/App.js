import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Editor from './components/Editor';
import ProcessedFiles from './components/ProcessedFiles';
import { FileText } from 'lucide-react';
import './App.css';

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [step, setStep] = useState('upload'); // upload, edit, complete

  const handleFilesUploaded = (files) => {
    setUploadedFiles(files);
    setCurrentFileIndex(0);
    setStep('edit');
  };

  const handleFileProcessed = (processedFile) => {
    setProcessedFiles(prev => [...prev, processedFile]);
    
    // Move to next file or complete
    if (currentFileIndex < uploadedFiles.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    } else {
      setStep('complete');
    }
  };

  const handleSkipFile = () => {
    if (currentFileIndex < uploadedFiles.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    } else {
      setStep('complete');
    }
  };

  const handleReset = () => {
    setUploadedFiles([]);
    setProcessedFiles([]);
    setCurrentFileIndex(0);
    setStep('upload');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <FileText size={32} />
            <h1>Watermark & E-Signature</h1>
          </div>
          <p className="subtitle">Add watermarks and signatures to your documents locally</p>
        </div>
      </header>

      <main className="app-main">
        {step === 'upload' && (
          <FileUpload onFilesUploaded={handleFilesUploaded} />
        )}

        {step === 'edit' && uploadedFiles.length > 0 && (
          <Editor
            file={uploadedFiles[currentFileIndex]}
            fileIndex={currentFileIndex}
            totalFiles={uploadedFiles.length}
            onFileProcessed={handleFileProcessed}
            onSkip={handleSkipFile}
          />
        )}

        {step === 'complete' && (
          <ProcessedFiles
            files={processedFiles}
            totalUploaded={uploadedFiles.length}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>© 2024 Watermark App • All processing done locally • No data sent to external servers</p>
      </footer>
    </div>
  );
}

export default App;
