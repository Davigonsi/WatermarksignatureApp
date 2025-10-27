import React, { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import SignaturePad from './SignaturePad';
import WatermarkControls from './WatermarkControls';
import { Download, SkipForward, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import './Editor.css';

const Editor = ({ file, fileIndex, totalFiles, onFileProcessed, onSkip }) => {
  console.log('Editor component mounted with file:', file);
  console.log('File has data property:', !!file?.data);
  console.log('File mimetype:', file?.mimetype);
  
  const [canvas, setCanvas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [watermarkSettings, setWatermarkSettings] = useState({
    type: 'text', // text or image
    text: 'CONFIDENTIAL',
    fontSize: 48,
    color: '#000000',
    opacity: 0.5,
    rotation: -45,
    imageUrl: null,
  });
  const [signatureData, setSignatureData] = useState(null);
  const [watermarkApplied, setWatermarkApplied] = useState(false);
  const [signatureApplied, setSignatureApplied] = useState(false);
  const [isPDF, setIsPDF] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const pdfDocRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  useEffect(() => {
    // Set worker path for pdfjs
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    
    initializeCanvas();
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    if (isPDF && pdfDocRef.current) {
      renderPDFPage(currentPdfPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPdfPage, isPDF]);

  const initializeCanvas = async () => {
    setLoading(true);
    console.log('Initializing canvas with file:', file);
    
    if (!file || !file.data) {
      console.error('File or file.data is missing!');
      console.error('File object:', file);
      setLoading(false);
      return;
    }
    
    const isPdf = file.mimetype === 'application/pdf';
    setIsPDF(isPdf);

    try {
      if (isPdf) {
        console.log('Loading PDF preview...');
        await loadPDFPreview();
      } else {
        console.log('Loading image...');
        await loadImage();
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setLoading(false);
    }
  };

  const loadImage = async () => {
    console.log('loadImage called, file.data:', file.data ? 'exists' : 'missing');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = file.data;

    img.onload = () => {
      console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
      const maxWidth = 800;
      const maxHeight = 600;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      if (canvasRef.current) {
        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
          width: width,
          height: height,
          selection: true,
          preserveObjectStacking: true,
          interactive: true,
          allowTouchScrolling: false,
        });

        fabric.Image.fromURL(img.src, (fabricImg) => {
          fabricImg.scaleToWidth(width);
          fabricImg.scaleToHeight(height);
          fabricImg.selectable = false;
          fabricImg.evented = false;
          fabricCanvas.setBackgroundImage(fabricImg, fabricCanvas.renderAll.bind(fabricCanvas));
          
          // Set canvas state after background is loaded
          fabricCanvasRef.current = fabricCanvas;
          setCanvas(fabricCanvas);
          setLoading(false);
        });

        // Enable object interaction
        fabricCanvas.on('object:moving', () => fabricCanvas.renderAll());
        fabricCanvas.on('object:scaling', () => fabricCanvas.renderAll());
        fabricCanvas.on('object:rotating', () => fabricCanvas.renderAll());
        fabricCanvas.on('object:modified', () => fabricCanvas.renderAll());

        // Ensure canvas is interactive
        fabricCanvas.selection = true;
        fabricCanvas.interactive = true;
      }
    };

    img.onerror = (error) => {
      console.error('Error loading image:', error);
      console.error('File data type:', typeof file.data);
      console.error('File data preview:', file.data ? file.data.substring(0, 100) : 'no data');
      setLoading(false);
    };
  };

  const loadPDFPreview = async () => {
    try {
      console.log('loadPDFPreview: Starting PDF load');
      console.log('file.data exists:', !!file.data);
      
      // Convert data URL to ArrayBuffer
      const base64Data = file.data.split(',')[1];
      console.log('loadPDFPreview: Base64 data length:', base64Data?.length);
      
      const binaryString = atob(base64Data);
      console.log('loadPDFPreview: Binary string length:', binaryString.length);
      
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log('loadPDFPreview: Bytes array created, length:', bytes.length);

      console.log('loadPDFPreview: Loading PDF document...');
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      console.log('loadPDFPreview: PDF loaded, pages:', pdf.numPages);
      
      pdfDocRef.current = pdf;
      setPdfPageCount(pdf.numPages);
      setCurrentPdfPage(1);

      console.log('loadPDFPreview: Rendering first page...');
      await renderPDFPage(1, pdf);
      console.log('loadPDFPreview: First page rendered successfully');
    } catch (error) {
      console.error('Error loading PDF:', error);
      console.error('Error stack:', error.stack);
      setLoading(false);
    }
  };

  const renderPDFPage = async (pageNumber, pdfDocument = null) => {
    try {
      console.log('renderPDFPage: Starting render for page', pageNumber);
      const pdf = pdfDocument || pdfDocRef.current;
      if (!pdf) {
        console.error('renderPDFPage: No PDF document available');
        return;
      }

      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });

      // Scale to fit canvas
      const maxWidth = 800;
      const maxHeight = 600;
      let scale = 1.5;

      if (viewport.width > maxWidth) {
        scale = (maxWidth / viewport.width) * 1.5;
      }
      if (viewport.height > maxHeight) {
        const heightScale = (maxHeight / viewport.height) * 1.5;
        scale = Math.min(scale, heightScale);
      }

      const scaledViewport = page.getViewport({ scale });

      // Create temporary canvas for PDF rendering
      const tempCanvas = document.createElement('canvas');
      const context = tempCanvas.getContext('2d');
      tempCanvas.width = scaledViewport.width;
      tempCanvas.height = scaledViewport.height;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;

      // Create or update fabric canvas
      if (canvasRef.current) {
        // Dispose existing canvas if changing pages
        if (fabricCanvasRef.current && pdfDocument === null) {
          // Save existing watermarks and signatures
          const existingObjects = fabricCanvasRef.current.getObjects().filter(
            obj => obj.name === 'watermark' || obj.name === 'signature'
          );
          
          fabricCanvasRef.current.dispose();
          
          const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            width: scaledViewport.width,
            height: scaledViewport.height,
            selection: true,
            preserveObjectStacking: true,
          });

          // Set PDF page as background
          const pdfImage = new Image();
          pdfImage.src = tempCanvas.toDataURL();
          pdfImage.onload = () => {
            fabric.Image.fromURL(pdfImage.src, (img) => {
              img.selectable = false;
              fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
              
              // Re-add watermarks and signatures
              existingObjects.forEach(obj => {
                fabricCanvas.add(obj);
              });
              fabricCanvas.renderAll();
            });
          };

          // Enable object interaction
          fabricCanvas.on('object:moving', () => fabricCanvas.renderAll());
          fabricCanvas.on('object:scaling', () => fabricCanvas.renderAll());
          fabricCanvas.on('object:rotating', () => fabricCanvas.renderAll());

          fabricCanvasRef.current = fabricCanvas;
          setCanvas(fabricCanvas);
        } else if (!fabricCanvasRef.current) {
          // Initial load
          const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            width: scaledViewport.width,
            height: scaledViewport.height,
            selection: true,
            preserveObjectStacking: true,
          });

          const pdfImage = new Image();
          pdfImage.src = tempCanvas.toDataURL();
          pdfImage.onload = () => {
            fabric.Image.fromURL(pdfImage.src, (img) => {
              img.selectable = false;
              fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas));
              
              // Set canvas state and stop loading after background is set
              fabricCanvasRef.current = fabricCanvas;
              setCanvas(fabricCanvas);
              setLoading(false);
              console.log('renderPDFPage: Canvas initialized and loading complete');
            });
          };

          // Enable object interaction
          fabricCanvas.on('object:moving', () => fabricCanvas.renderAll());
          fabricCanvas.on('object:scaling', () => fabricCanvas.renderAll());
          fabricCanvas.on('object:rotating', () => fabricCanvas.renderAll());
        }
      }
    } catch (error) {
      console.error('Error rendering PDF page:', error);
      setLoading(false);
    }
  };

  const applyWatermark = () => {
    if (!canvas) return;

    // Remove existing watermark
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (obj.name === 'watermark') {
        canvas.remove(obj);
      }
    });

    if (watermarkSettings.type === 'text' && watermarkSettings.text) {
      const text = new fabric.Text(watermarkSettings.text, {
        fontSize: watermarkSettings.fontSize,
        fill: watermarkSettings.color,
        opacity: watermarkSettings.opacity,
        angle: watermarkSettings.rotation,
        name: 'watermark',
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockUniScaling: false,
        hoverCursor: 'move',
        moveCursor: 'move',
      });

      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.renderAll();
      setWatermarkApplied(true);
      console.log('Text watermark added and selected');
    } else if (watermarkSettings.type === 'image' && watermarkSettings.imageUrl) {
      fabric.Image.fromURL(watermarkSettings.imageUrl, (img) => {
        img.scaleToWidth(200);
        img.opacity = watermarkSettings.opacity;
        img.angle = watermarkSettings.rotation;
        img.name = 'watermark';
        img.left = canvas.width / 2;
        img.top = canvas.height / 2;
        img.originX = 'center';
        img.originY = 'center';
        img.selectable = true;
        img.evented = true;
        img.hasControls = true;
        img.hasBorders = true;
        img.hoverCursor = 'move';
        img.moveCursor = 'move';
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        setWatermarkApplied(true);
        console.log('Image watermark added and selected');
      });
    }

    canvas.renderAll();
  };

  const updateWatermarkRealtime = (property, value) => {
    if (!canvas || !watermarkApplied) return;

    const objects = canvas.getObjects();
    const watermark = objects.find(obj => obj.name === 'watermark');
    
    if (watermark) {
      if (property === 'opacity') {
        watermark.set('opacity', value);
      } else if (property === 'rotation') {
        watermark.set('angle', value);
      } else if (property === 'color') {
        watermark.set('fill', value);
      } else if (property === 'fontSize') {
        watermark.set('fontSize', value);
      }
      canvas.renderAll();
    }
  };

  const removeWatermark = () => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (obj.name === 'watermark') {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
    setWatermarkApplied(false);
  };

  const applySignature = () => {
    if (!canvas || !signatureData) return;

    // Remove existing signature
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (obj.name === 'signature') {
        canvas.remove(obj);
      }
    });

    fabric.Image.fromURL(signatureData, (img) => {
      img.scaleToWidth(200);
      img.name = 'signature';
      img.left = canvas.width - 220;
      img.top = canvas.height - 150;
      img.selectable = true;
      img.evented = true;
      img.hasControls = true;
      img.hasBorders = true;
      img.hoverCursor = 'move';
      img.moveCursor = 'move';
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      setSignatureApplied(true);
      console.log('Signature added and selected');
    });
  };

  const removeSignature = () => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (obj.name === 'signature') {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
    setSignatureApplied(false);
    setSignatureData(null);
  };

  // Debug function to test canvas interaction
  const testCanvasInteraction = () => {
    if (!canvas) {
      console.error('Canvas not initialized');
      return;
    }

    console.log('=== Canvas Debug Info ===');
    console.log('Canvas selection enabled:', canvas.selection);
    console.log('Canvas interactive:', canvas.interactive);
    console.log('Number of objects:', canvas.getObjects().length);
    
    const objects = canvas.getObjects();
    objects.forEach((obj, index) => {
      console.log(`Object ${index}:`, {
        name: obj.name,
        type: obj.type,
        selectable: obj.selectable,
        evented: obj.evented,
        hasControls: obj.hasControls,
        hasBorders: obj.hasBorders,
      });
    });

    // Try to select first non-background object
    const selectableObj = objects.find(obj => obj.selectable);
    if (selectableObj) {
      canvas.setActiveObject(selectableObj);
      canvas.renderAll();
      console.log('Selected object:', selectableObj.name);
    } else {
      console.log('No selectable objects found');
    }
  };


  const handleProcess = async () => {
    setProcessing(true);

    try {
      if (isPDF) {
        await processPDF();
      } else {
        await processImage();
      }
    } catch (error) {
      console.error('Processing error:', error);
      alert('Failed to process file. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const processImage = async () => {
    const dataURL = canvas.toDataURL('image/png');
    const blob = await (await fetch(dataURL)).blob();
    
    const processedFilename = `processed-${file.originalName}`;
    
    // Create download link for client-side download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = processedFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onFileProcessed({
      filename: processedFilename,
      originalName: file.originalName,
      blob: blob,
      url: url
    });
  };

  const processPDF = async () => {
    try {
      // Convert data URL to ArrayBuffer
      const base64Data = file.data.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pdfDoc = await PDFDocument.load(bytes);
      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();

        // Add text watermark
        if (watermarkSettings.type === 'text' && watermarkSettings.text) {
          const fontSize = watermarkSettings.fontSize * 0.75; // Adjust for PDF
          const textWidth = watermarkSettings.text.length * fontSize * 0.6;
          
          let x = width / 2;
          let y = height / 2;

          // Position based on settings
          switch (watermarkSettings.position) {
            case 'top-left':
              x = 50;
              y = height - 50;
              break;
            case 'top-right':
              x = width - textWidth - 50;
              y = height - 50;
              break;
            case 'bottom-left':
              x = 50;
              y = 50;
              break;
            case 'bottom-right':
              x = width - textWidth - 50;
              y = 50;
              break;
            default:
              x = width / 2 - textWidth / 2;
              y = height / 2;
          }

          const hexColor = watermarkSettings.color.replace('#', '');
          const r = parseInt(hexColor.substr(0, 2), 16) / 255;
          const g = parseInt(hexColor.substr(2, 2), 16) / 255;
          const b = parseInt(hexColor.substr(4, 2), 16) / 255;

          page.drawText(watermarkSettings.text, {
            x: x,
            y: y,
            size: fontSize,
            color: rgb(r, g, b),
            opacity: watermarkSettings.opacity,
            rotate: { angle: watermarkSettings.rotation },
          });
        }

        // Add signature
        if (signatureData) {
          try {
            const signatureImageBytes = await fetch(signatureData).then(res => res.arrayBuffer());
            const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
            const signatureDims = signatureImage.scale(0.3);

            page.drawImage(signatureImage, {
              x: width - signatureDims.width - 20,
              y: 20,
              width: signatureDims.width,
              height: signatureDims.height,
            });
          } catch (err) {
            console.error('Error adding signature to PDF:', err);
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const processedFilename = `processed-${file.originalName}`;
      
      // Create download link for client-side download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = processedFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onFileProcessed({
        filename: processedFilename,
        originalName: file.originalName,
        blob: blob,
        url: url
      });
    } catch (error) {
      console.error('PDF processing error:', error);
      throw error;
    }
  };

  return (
    <div className="editor-container fade-in">
      <div className="editor-header">
        <h2>
          Edit File {fileIndex + 1} of {totalFiles}
        </h2>
        <p className="file-name">{file.originalName}</p>
      </div>

      <div className="editor-content">
        <div className="editor-left">
          <div className="canvas-container">
            {loading ? (
              <div className="loading-state">
                <Loader className="spinner" size={48} />
                <p>Loading file...</p>
              </div>
            ) : (
              <>
                <canvas ref={canvasRef} />
                {isPDF && pdfPageCount > 1 && (
                  <div className="pdf-navigation">
                    <button
                      className="pdf-nav-btn"
                      onClick={() => setCurrentPdfPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPdfPage === 1}
                    >
                      <ChevronLeft size={20} />
                      Previous
                    </button>
                    <span className="pdf-page-info">
                      Page {currentPdfPage} of {pdfPageCount}
                    </span>
                    <button
                      className="pdf-nav-btn"
                      onClick={() => setCurrentPdfPage(prev => Math.min(pdfPageCount, prev + 1))}
                      disabled={currentPdfPage === pdfPageCount}
                    >
                      Next
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="editor-actions">
            <button 
              className="skip-btn" 
              onClick={testCanvasInteraction}
              style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
            >
              🔍 Test Canvas
            </button>
            <button className="skip-btn" onClick={onSkip}>
              <SkipForward size={20} />
              Skip File
            </button>
            <button
              className="process-btn"
              onClick={handleProcess}
              disabled={processing || loading}
            >
              {processing ? (
                <>
                  <Loader className="spinner" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Process & Continue
                </>
              )}
            </button>
          </div>
        </div>

        <div className="editor-right">
          <WatermarkControls
            settings={watermarkSettings}
            onChange={setWatermarkSettings}
            onApply={applyWatermark}
            onRemove={removeWatermark}
            isApplied={watermarkApplied}
            onRealtimeUpdate={updateWatermarkRealtime}
          />
          
          <SignaturePad
            onSignatureChange={setSignatureData}
            onApply={applySignature}
            onRemove={removeSignature}
            isApplied={signatureApplied}
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;
