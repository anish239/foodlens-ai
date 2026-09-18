import React, { useState, useRef, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { PageTransition } from '../../components/animation/PageTransition';
import { analysisService } from '../../services/analysisService';
import {
  Sparkles,
  Upload,
  Camera,
  FileText,
  Image as ImageIcon,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  ShieldAlert,
  Info,
} from 'lucide-react';

export const AnalysisPage = () => {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or 'label'
  const [isDragging, setIsDragging] = useState(false);

  // Single unified image state used by both Upload and Take Photo flows
  const [selectedImage, setSelectedImage] = useState(null); // { file, dataUrl, name, size, mimeType }

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Analysis pipeline state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  /**
   * Safely compress and resize high-resolution user photos before base64 encoding.
   * Keeps image sharp for nutrition label OCR & dish recognition while ensuring
   * payload stays well under the 10MB/15MB backend limits.
   */
  const compressImage = (dataUrl, mimeType = 'image/jpeg') => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl); // Fallback to original if 2D context fails
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const outputMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = outputMime === 'image/jpeg' ? 0.88 : undefined;
        const compressedDataUrl = canvas.toDataURL(outputMime, quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        resolve(dataUrl); // Fallback to original
      };
      img.src = dataUrl;
    });
  };

  // File validation & processing
  const validateAndProcessFile = (file) => {
    if (!file) return;

    setAnalysisError(null);
    setCameraError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const fileType = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();
    const hasValidExt = /\.(jpe?g|png|webp)$/i.test(fileName);

    if (!validTypes.includes(fileType) && !hasValidExt) {
      setAnalysisError('Unsupported file format. Please upload a JPEG, PNG, or WEBP image.');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setAnalysisError('Image exceeds the 10MB size limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const rawDataUrl = reader.result;
        const processedDataUrl = await compressImage(rawDataUrl, file.type || 'image/jpeg');

        setSelectedImage({
          file,
          dataUrl: processedDataUrl,
          name: file.name || `photo-${Date.now()}.jpg`,
          size: file.size,
          mimeType: file.type || 'image/jpeg',
        });
        setAnalysisResult(null); // Clear previous result when new image is loaded
      } catch (err) {
        setSelectedImage({
          file,
          dataUrl: reader.result,
          name: file.name || `photo-${Date.now()}.jpg`,
          size: file.size,
          mimeType: file.type || 'image/jpeg',
        });
        setAnalysisResult(null);
      }
    };
    reader.onerror = () => {
      setAnalysisError('Failed to read image file. Please try selecting another photo.');
    };
    reader.readAsDataURL(file);
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    // Reset input value so selecting the same file triggers change
    if (e.target) e.target.value = '';
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  // Open device file picker
  const handleBrowseFiles = () => {
    setAnalysisError(null);
    fileInputRef.current?.click();
  };

  // Start live camera
  const handleStartCamera = async () => {
    setAnalysisError(null);
    setCameraError(null);

    // Fallback if browser does not support getUserMedia
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
        return;
      }
      setCameraError('Camera access is not supported by your browser. Please use the Upload Photo option.');
      return;
    }

    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      let message = 'Unable to access camera. Please check your camera permissions or use the Upload Photo option.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser settings, or use the Upload Photo option.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device was detected on this device. Please use the Upload Photo option.';
      }
      setCameraError(message);
      stopCamera();
    }
  };

  // Capture frame from live video
  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera stream is not ready for capture. Please try again.');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setCameraError('Failed to capture frame from camera stream.');
            return;
          }

          const fileName = `camera-capture-${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

          // Store in the SAME unified state
          setSelectedImage({
            file,
            dataUrl,
            name: fileName,
            size: blob.size,
            mimeType: 'image/jpeg',
          });

          setAnalysisError(null);
          setAnalysisResult(null);
          stopCamera();
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Frame capture failure:', err);
      setCameraError('Failed to capture photo. Please try again or use Upload Photo.');
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setAnalysisError(null);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Execute unified Gemini AI analysis
  const handleAnalyzeFood = async () => {
    if (!selectedImage || !selectedImage.dataUrl) {
      setAnalysisError('Please select or capture a photo before analyzing.');
      return;
    }

    if (isAnalyzing) return; // Prevent duplicate submissions

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await analysisService.analyzeImage({
        image: selectedImage.dataUrl,
        mimeType: selectedImage.mimeType,
        type: activeTab,
      });

      if (response && response.data && response.data.analysis) {
        setAnalysisResult(response.data.analysis);
      } else {
        throw new Error('AI analysis completed without returning a structured result.');
      }
    } catch (err) {
      console.error('Food analysis error:', err);
      // Safe error extraction to prevent React error #31 across all API error shapes
      let safeMsg = 'An unexpected error occurred during food analysis. Please try again.';
      if (typeof err === 'string') {
        safeMsg = err;
      } else if (err?.data?.message && typeof err.data.message === 'string') {
        safeMsg = err.data.message;
      } else if (err?.message && typeof err.message === 'string') {
        safeMsg = err.message;
      } else if (err?.data && typeof err.data === 'string') {
        safeMsg = err.data;
      } else if (err?.error?.message && typeof err.error.message === 'string') {
        safeMsg = err.error.message;
      } else if (err?.error && typeof err.error === 'string') {
        safeMsg = err.error;
      }
      setAnalysisError(safeMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <PageTransition className="space-y-8 max-w-4xl mx-auto pb-16">
      <PageHeader
        title="Food Analysis"
        description="Upload food package photos or nutrition labels for deep multimodal analysis powered by Google Gemini AI."
      />

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('image');
            setAnalysisResult(null);
          }}
          className={`flex items-center gap-2 pb-4 px-6 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'image'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Analyze Food Image</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('label');
            setAnalysisResult(null);
          }}
          className={`flex items-center gap-2 pb-4 px-6 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'label'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Analyze Nutrition Label</span>
        </button>
      </div>

      {/* Camera Denial or Hardware Error Banner */}
      {cameraError && (
        <Card className="p-4 bg-amber-50 border-amber-200/80 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-amber-800">
            <span className="font-bold block mb-0.5">Camera Notice</span>
            <span>{typeof cameraError === 'string' ? cameraError : 'Camera is currently unavailable.'}</span>
          </div>
          <button
            type="button"
            onClick={() => setCameraError(null)}
            className="text-amber-500 hover:text-amber-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </Card>
      )}

      {/* Live Camera Viewport */}
      {isCameraOpen && (
        <Card className="p-6 bg-slate-900 text-white rounded-3xl border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Live Camera Viewfinder</h4>
            </div>
            <button
              type="button"
              onClick={stopCamera}
              className="text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
              aria-label="Close Camera"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder Target Frame Overlay */}
            <div className="absolute inset-8 sm:inset-12 border-2 border-emerald-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              </div>
              <div className="text-center text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-black/60 px-3 py-1 rounded-full mx-auto backdrop-blur-xs">
                {activeTab === 'label' ? 'Align Nutrition Label' : 'Center Food Item'}
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              onClick={handleCapturePhoto}
              variant="primary"
              className="rounded-xl font-bold gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Photo</span>
            </Button>
            <Button
              type="button"
              onClick={stopCamera}
              variant="outline"
              className="rounded-xl font-bold text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              <span>Cancel</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Image Selection & Preview Zone */}
      {!isCameraOpen && (
        <>
          {selectedImage ? (
            /* Selected Image Preview Card */
            <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                      {selectedImage.name}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {formatFileSize(selectedImage.size)} • Ready for analysis
                    </span>
                  </div>
                </div>
                <Badge variant="success" className="rounded-lg text-[10px] font-bold">
                  Image Ready
                </Badge>
              </div>

              {/* Preview Display */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-h-96 flex items-center justify-center">
                <img
                  src={selectedImage.dataUrl}
                  alt="Selected Food Preview"
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>

              {/* Actions: Remove, Replace, Analyze */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    type="button"
                    onClick={handleRemoveImage}
                    variant="outline"
                    disabled={isAnalyzing}
                    className="rounded-xl font-bold gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 w-full sm:w-auto"
                  >
                    <X className="w-4 h-4" />
                    <span>Remove Photo</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBrowseFiles}
                    variant="outline"
                    disabled={isAnalyzing}
                    className="rounded-xl font-bold gap-2 text-slate-600 hover:text-slate-900 border-slate-200 w-full sm:w-auto"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Replace</span>
                  </Button>
                </div>

                <Button
                  type="button"
                  onClick={handleAnalyzeFood}
                  variant="primary"
                  disabled={isAnalyzing}
                  className="rounded-xl font-bold gap-2 px-8 py-2.5 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Food...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{activeTab === 'image' ? 'Analyze Food' : 'Analyze Nutrition Label'}</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ) : (
            /* Empty Upload Dropzone */
            <Card className="p-8 md:p-12 text-center rounded-3xl border-slate-200/80 shadow-2xs">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 md:p-14 transition-all flex flex-col items-center justify-center ${
                  isDragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300 bg-slate-50/50'
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-2xs">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">
                  {activeTab === 'image' ? 'Upload Food Photo or Meal' : 'Upload Nutrition Facts Label'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-6 font-medium">
                  Drag and drop your image here, browse from your device, or snap a photo directly using your camera.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleBrowseFiles}
                    variant="primary"
                    className="rounded-xl font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleStartCamera}
                    variant="outline"
                    className="rounded-xl font-bold gap-2 border-slate-300 hover:bg-slate-100 text-slate-700"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400 mt-6 font-medium">
                  Supported formats: JPEG, PNG, WEBP (Max size: 10MB)
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Analysis Loading State */}
      {isAnalyzing && (
        <Card className="p-7 bg-slate-900 text-white border-slate-800 shadow-xl rounded-3xl space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Google Gemini Multimodal AI
                </span>
                <h4 className="text-sm font-bold text-slate-100">Analyzing Food Intelligence...</h4>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Processing
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Extracting visual food markers, verifying nutritional composition, and synthesizing dietary guidance...
          </p>
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-slate-800 rounded-lg w-full" />
            <div className="h-3 bg-slate-800 rounded-lg w-5/6" />
            <div className="h-3 bg-slate-800 rounded-lg w-3/4" />
          </div>
        </Card>
      )}

      {/* Analysis Error Message */}
      {analysisError && (
        <Card className="p-6 bg-rose-50 border-rose-200 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                  Analysis Notice
                </span>
                <h4 className="text-sm font-bold text-slate-900">Analysis Error</h4>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAnalyzeFood}
              disabled={!selectedImage}
              className="rounded-xl gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>
          </div>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {typeof analysisError === 'string' ? analysisError : 'Failed to analyze food photo.'}
          </p>
        </Card>
      )}

      {/* AI Analysis Results Section */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Header Card */}
          <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border-slate-800 shadow-xl rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      FoodLens AI Intelligence
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                      {analysisResult.category || 'Food Item'}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    {analysisResult.productName || 'Identified Food Item'}
                  </h3>
                  {analysisResult.brand && (
                    <p className="text-xs text-slate-400 font-medium">{analysisResult.brand}</p>
                  )}
                </div>
              </div>

              {/* Health Score Pill */}
              <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/80">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Health Score</span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {analysisResult.healthScore >= 70
                      ? 'Wholesome'
                      : analysisResult.healthScore >= 50
                      ? 'Moderate'
                      : 'Limit Intake'}
                  </span>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black border ${
                    analysisResult.healthScore >= 70
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : analysisResult.healthScore >= 50
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  }`}
                >
                  {analysisResult.healthScore || 70}
                </div>
              </div>
            </div>

            {/* Summary */}
            {analysisResult.summary && (
              <div className="space-y-1.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Summary</h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  {typeof analysisResult.summary === 'string' ? analysisResult.summary : ''}
                </p>
              </div>
            )}

            {/* Estimated Nutrition Breakdown */}
            {analysisResult.estimatedNutrition && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Estimated Nutritional Profile
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Calories</span>
                    <span className="text-sm font-black text-white">
                      {String(analysisResult.estimatedNutrition.calories || 'N/A')}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Protein</span>
                    <span className="text-sm font-black text-emerald-400">
                      {String(analysisResult.estimatedNutrition.protein || 'N/A')}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Carbs</span>
                    <span className="text-sm font-black text-sky-400">
                      {String(analysisResult.estimatedNutrition.carbs || 'N/A')}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Fat</span>
                    <span className="text-sm font-black text-amber-400">
                      {String(analysisResult.estimatedNutrition.fat || 'N/A')}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Sugar</span>
                    <span className="text-sm font-black text-rose-300">
                      {String(analysisResult.estimatedNutrition.sugar || 'N/A')}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Sodium</span>
                    <span className="text-sm font-black text-purple-300">
                      {String(analysisResult.estimatedNutrition.sodium || 'N/A')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Highlights & Concerns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.isArray(analysisResult.highlights) && analysisResult.highlights.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Key Positives</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-100">
                    {analysisResult.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-emerald-400">•</span>
                        <span>{typeof h === 'string' ? h : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(analysisResult.concerns) && analysisResult.concerns.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Points of Attention</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-100">
                    {analysisResult.concerns.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-amber-400">•</span>
                        <span>{typeof c === 'string' ? c : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Identified Ingredients */}
            {Array.isArray(analysisResult.identifiedIngredients) && analysisResult.identifiedIngredients.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Identified Ingredients & Components
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.identifiedIngredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {typeof ing === 'string' ? ing : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detected Allergens */}
            {Array.isArray(analysisResult.detectedAllergens) && analysisResult.detectedAllergens.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Potential Allergens & Sensitive Ingredients</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysisResult.detectedAllergens.map((allergen, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-900/60 text-rose-200 border border-rose-700/80"
                    >
                      {typeof allergen === 'string' ? allergen : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            {analysisResult.recommendation && (
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Dietary Recommendation
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {typeof analysisResult.recommendation === 'string' ? analysisResult.recommendation : ''}
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="pt-4 border-t border-slate-800 flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
              <span>
                {typeof analysisResult.disclaimer === 'string'
                  ? analysisResult.disclaimer
                  : 'FoodLens AI provides informational food analysis and does not provide medical advice.'}
              </span>
            </div>

            {/* Reset & Analyze Another Photo Button */}
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                onClick={handleRemoveImage}
                variant="outline"
                className="rounded-xl font-bold gap-2 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Analyze Another Photo</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Gemini Info Banner */}
      <Card className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border border-emerald-900/40 p-6 sm:p-7 rounded-3xl shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm">Multimodal AI Intelligence</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Google Gemini multimodal vision inspects food plates, packaging labels, and ingredient panels to extract nutritional metrics, identify potential allergens, and provide personalized dietary intelligence.
            </p>
          </div>
        </div>
      </Card>
    </PageTransition>
  );
};
