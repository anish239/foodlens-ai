import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { PageTransition } from '../../components/animation/PageTransition';
import { foodService } from '../../services/foodService';
import { ProductNotFoundState } from '../../components/food/ProductNotFoundState';
import {
  BarcodeFormat,
  DecodeHintType,
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
  MultiFormatOneDReader,
  QRCodeReader,
} from '@zxing/library';
import {
  normalizeBarcode,
  verifyBarcode,
} from '../../utils/barcodeValidator';
import {
  ScanBarcode,
  Camera,
  CameraOff,
  Keyboard,
  AlertCircle,
  AlertTriangle,
  Loader2,
  FlipHorizontal,
  Flashlight,
  FlashlightOff,
  CornerDownLeft,
  ShieldCheck,
} from 'lucide-react';

/**
 * Robust helper to wait until the video element has loaded real dimensions and is ready for frame capture
 */
const waitForVideoReady = (video, timeoutMs = 4000) => {
  return new Promise((resolve) => {
    if (!video) {
      resolve(false);
      return;
    }

    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      resolve(true);
      return;
    }

    let timeoutTimer = null;
    let pollInterval = null;

    const onReady = () => {
      cleanup();
      resolve(true);
    };

    const cleanup = () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (pollInterval) clearInterval(pollInterval);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('playing', onReady);
      video.removeEventListener('canplay', onReady);
    };

    video.addEventListener('loadeddata', onReady);
    video.addEventListener('loadedmetadata', onReady);
    video.addEventListener('playing', onReady);
    video.addEventListener('canplay', onReady);

    pollInterval = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        onReady();
      }
    }, 50);

    timeoutTimer = setTimeout(() => {
      cleanup();
      resolve(video.videoWidth > 0 && video.videoHeight > 0);
    }, timeoutMs);
  });
};

export const ScannerPage = () => {
  // Manual Entry state
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualError, setManualError] = useState('');

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraErrorType, setCameraErrorType] = useState(null); // 'NOT_ALLOWED' | 'NOT_FOUND' | 'INSECURE' | 'UNKNOWN'
  const [scanningStatus, setScanningStatus] = useState('Point your camera at a food barcode');
  const [checksumWarning, setChecksumWarning] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Lookup & Navigation state
  const [loading, setLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const [error, setError] = useState('');
  const [notFoundBarcode, setNotFoundBarcode] = useState(null);

  // References
  const videoRef = useRef(null);
  const scannerLoopRef = useRef(null);
  const streamRef = useRef(null);
  const isMountedRef = useRef(true);
  const isProcessingScanRef = useRef(false);
  const isCameraActiveRef = useRef(false);
  const manualInputRef = useRef(null);
  const navigate = useNavigate();

  // Diagnostic logging in development mode
  const logDiagnostic = useCallback((event, data = {}) => {
    if (import.meta.env?.DEV) {
      console.log(`[FoodLens Scanner DEV] ${event}:`, data);
    }
  }, []);

  /**
   * Stop active camera stream and dispose of scanner resources cleanly (idempotent)
   */
  const stopCamera = useCallback(() => {
    logDiagnostic('Stopping camera stream and resetting scanner');
    isCameraActiveRef.current = false;
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);

    if (scannerLoopRef.current) {
      try {
        scannerLoopRef.current.stop();
      } catch (e) {
        console.warn('Error stopping scanner loop:', e);
      }
      scannerLoopRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('Error stopping media tracks:', e);
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
  }, [logDiagnostic]);

  /**
   * Unified product lookup service flow for both Camera Scans and Manual Entry.
   */
  const handleLookup = async (barcodeToLookup, source = 'scanner') => {
    if (!barcodeToLookup || loading) return;

    const normalized = normalizeBarcode(barcodeToLookup);
    logDiagnostic('Initiating product lookup', { barcode: normalized, source });

    setLoading(true);
    setLookupMessage('Looking up product in food database...');
    setError('');
    setManualError('');
    setNotFoundBarcode(null);
    setChecksumWarning('');

    try {
      // Ensure camera stream is stopped before navigating away
      stopCamera();

      const res = await foodService.getProductByBarcode(normalized);

      if (res.success && res.data?.product) {
        const prod = res.data.product;
        const isPartial = prod.isPartial || res.data.isPartial || prod.status === 'partial';

        logDiagnostic('Product found successfully', {
          barcode: prod.barcode,
          name: prod.name,
          isPartial,
        });

        if (isPartial) {
          setScanningStatus('Product found, but some nutritional information is unavailable.');
        } else {
          setScanningStatus('Product found!');
        }

        // Asynchronously record scan in user history
        try {
          await foodService.recordScan(prod.barcode);
        } catch (historyErr) {
          console.warn('Failed to record scan event in history:', historyErr);
        }

        setTimeout(() => {
          if (isMountedRef.current) {
            navigate(`/app/product/${prod.barcode}`);
          }
        }, 350);
      } else {
        throw new Error('Unexpected product response format');
      }
    } catch (err) {
      logDiagnostic('Product lookup failed', {
        status: err.status,
        errorType: err.data?.error?.errorType || err.data?.error?.errorCode,
        message: err.message,
      });

      setLoading(false);
      isProcessingScanRef.current = false;

      const errorType = err.data?.error?.errorType || err.data?.error?.errorCode;
      const status = err.status || err.response?.status;
      const isNotFound =
        status === 404 ||
        errorType === 'PRODUCT_NOT_FOUND' ||
        err.message?.toLowerCase().includes('not found');

      if (isNotFound) {
        setNotFoundBarcode(normalized);
        setScanningStatus("We couldn't find this product in our available product databases.");
      } else if (errorType === 'INVALID_CHECKSUM') {
        setError('This barcode appears invalid. Please check the barcode and try again.');
        setScanningStatus('Invalid checksum');
      } else if (errorType === 'INVALID_BARCODE') {
        setError('Invalid barcode format.');
        setScanningStatus('Invalid barcode');
      } else if (status === 429 || errorType === 'RATE_LIMITED') {
        setError('Too many requests to the food database. Please wait a moment and try again.');
        setScanningStatus('Rate limit reached');
      } else if (
        status === 502 ||
        status === 504 ||
        errorType === 'PROVIDER_UNAVAILABLE' ||
        errorType === 'UPSTREAM_ERROR' ||
        errorType === 'UPSTREAM_TIMEOUT' ||
        err.code === 'ERR_NETWORK'
      ) {
        setError('Product lookup is temporarily unavailable. Please try again.');
        setScanningStatus('Provider unavailable');
      } else {
        setError(err.message || 'Unable to retrieve product details. Please try again.');
        setScanningStatus('Lookup failed');
      }
    }
  };

  /**
   * Handles raw barcode string detected by camera stream.
   */
  const handleBarcodeScanned = useCallback((rawText) => {
    const normalized = normalizeBarcode(rawText);
    logDiagnostic('Raw barcode decoded from camera frame', { rawText, normalized });

    // Validate using shared barcodeValidator
    const validation = verifyBarcode(normalized, { requireChecksum: true });

    if (!validation.isValid) {
      logDiagnostic('Barcode validation failed', validation);

      if (validation.errorType === 'CHECKSUM_FAILED') {
        setChecksumWarning('Barcode read may be incorrect. Please hold steady or move camera closer.');
        setScanningStatus('Retrying read...');

        setTimeout(() => {
          if (isMountedRef.current && isCameraActiveRef.current) {
            setChecksumWarning('');
            setScanningStatus('Point your camera at a food barcode');
            isProcessingScanRef.current = false;
          }
        }, 2200);
      } else {
        setChecksumWarning(validation.error || 'Could not read barcode clearly.');
        setTimeout(() => {
          if (isMountedRef.current && isCameraActiveRef.current) {
            setChecksumWarning('');
            setScanningStatus('Point your camera at a food barcode');
            isProcessingScanRef.current = false;
          }
        }, 1800);
      }
      return;
    }

    setScanningStatus(`Barcode detected (${validation.format}): ${normalized}`);
    handleLookup(normalized, 'camera_scanner');
  }, [logDiagnostic]);

  /**
   * Starts camera with progressive fallback constraints and safe ZXing initialization.
   */
  const startCamera = async (targetDeviceId = null) => {
    setError('');
    setCameraError('');
    setCameraErrorType(null);
    setChecksumWarning('');
    setIsCameraActive(true);
    isCameraActiveRef.current = true;
    isProcessingScanRef.current = false;
    setScanningStatus('Initializing camera...');

    if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setIsCameraActive(false);
      isCameraActiveRef.current = false;
      setCameraErrorType('INSECURE');
      setCameraError('Camera access requires HTTPS. Please use manual barcode entry below.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setIsCameraActive(false);
      isCameraActiveRef.current = false;
      setCameraErrorType('NOT_FOUND');
      setCameraError('Camera hardware is not supported or accessible on this device. Please use manual entry.');
      return;
    }

    if (streamRef.current || scannerLoopRef.current) {
      stopCamera();
      setIsCameraActive(true);
      isCameraActiveRef.current = true;
    }

    const constraintLevels = [];

    if (targetDeviceId) {
      constraintLevels.push({
        video: {
          deviceId: { exact: targetDeviceId },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
      });
      constraintLevels.push({ video: { deviceId: { exact: targetDeviceId } } });
    } else {
      constraintLevels.push({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          aspectRatio: { ideal: 16 / 9 },
          frameRate: { ideal: 30, min: 15 },
        },
      });
      constraintLevels.push({
        video: { facingMode: { ideal: 'environment' } },
      });
      constraintLevels.push({ video: true });
    }

    let mediaStream = null;

    for (let i = 0; i < constraintLevels.length; i++) {
      try {
        logDiagnostic(`Requesting camera constraints level ${i + 1}`, constraintLevels[i]);
        mediaStream = await navigator.mediaDevices.getUserMedia(constraintLevels[i]);
        break;
      } catch (constraintErr) {
        logDiagnostic(`Constraint level ${i + 1} failed`, constraintErr.name);
        if (constraintErr.name === 'NotAllowedError' || constraintErr.name === 'PermissionDeniedError') {
          setIsCameraActive(false);
          isCameraActiveRef.current = false;
          setCameraErrorType('NOT_ALLOWED');
          setCameraError('Unable to access camera. Please allow camera permissions in your browser or enter the barcode manually.');
          return;
        }
      }
    }

    if (!mediaStream) {
      setIsCameraActive(false);
      isCameraActiveRef.current = false;
      setCameraErrorType('NOT_FOUND');
      setCameraError('Unable to access camera. Please check camera availability or enter the barcode manually.');
      return;
    }

    // Check if component unmounted or cancelled while requesting stream
    if (!isCameraActiveRef.current || !isMountedRef.current) {
      mediaStream.getTracks().forEach((track) => track.stop());
      return;
    }

    streamRef.current = mediaStream;

    const videoTrack = mediaStream.getVideoTracks()[0];
    if (videoTrack) {
      try {
        const capabilities = typeof videoTrack.getCapabilities === 'function' ? videoTrack.getCapabilities() : {};
        if (capabilities.focusMode && Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes('continuous')) {
          videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
        }
        if (Boolean(capabilities.torch)) {
          setHasTorch(true);
        }
      } catch (e) {}
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableCameras(videoDevices);

      if (targetDeviceId) {
        setSelectedCameraId(targetDeviceId);
      } else if (videoTrack?.getSettings?.()?.deviceId) {
        setSelectedCameraId(videoTrack.getSettings().deviceId);
      }
    } catch (e) {
      console.warn('Could not enumerate video devices:', e);
    }

    try {
      const videoElement = videoRef.current;
      if (!videoElement) {
        throw new Error('Video preview element not available');
      }

      // Attach media stream to video element directly and ensure autoplay
      videoElement.srcObject = mediaStream;
      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('autoplay', 'true');
      videoElement.setAttribute('muted', 'true');

      try {
        await videoElement.play();
      } catch (playErr) {
        console.warn('Video playback notice:', playErr);
      }

      // Ensure video element has valid dimensions before capturing frames
      const isReady = await waitForVideoReady(videoElement, 4000);

      if (!isCameraActiveRef.current || !isMountedRef.current) {
        stopCamera();
        return;
      }

      logDiagnostic('Video element ready state confirmed', {
        videoWidth: videoElement.videoWidth,
        videoHeight: videoElement.videoHeight,
        readyState: videoElement.readyState,
        isReady,
      });

      const retailFormats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.UPC_A,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.ITF,
      ];

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, retailFormats);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const oneDReader = new MultiFormatOneDReader(hints);
      const qrReader = new QRCodeReader();

      // Create an offscreen canvas buffer for frame pixel extraction
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      let isLoopRunning = true;
      let scanTimer = null;

      const stopLoop = () => {
        isLoopRunning = false;
        if (scanTimer) {
          clearTimeout(scanTimer);
          scanTimer = null;
        }
      };

      scannerLoopRef.current = { stop: stopLoop };

      const processFrame = () => {
        if (!isLoopRunning || !isCameraActiveRef.current || !isMountedRef.current) {
          return;
        }

        const video = videoRef.current;
        if (!video || video.paused || video.ended || video.readyState < 2) {
          scanTimer = setTimeout(processFrame, 120);
          return;
        }

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (vw <= 0 || vh <= 0) {
          scanTimer = setTimeout(processFrame, 120);
          return;
        }

        try {
          // Standardize resolution to maximum 1280px for performance
          let targetWidth = vw;
          let targetHeight = vh;
          if (targetWidth > 1280) {
            const scale = 1280 / targetWidth;
            targetWidth = 1280;
            targetHeight = Math.round(vh * scale);
          }

          if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
          }

          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          const rgba = imageData.data;
          const pixelCount = targetWidth * targetHeight;
          const luminances = new Uint8ClampedArray(pixelCount);

          // Fast luminance conversion
          for (let i = 0; i < pixelCount; i++) {
            const off = i * 4;
            luminances[i] = ((rgba[off] * 306 + rgba[off + 1] * 601 + rgba[off + 2] * 117) >> 10) & 0xff;
          }

          // Build LuminanceSource and BinaryBitmap
          const lumSource = new RGBLuminanceSource(luminances, targetWidth, targetHeight);
          const binarizer = new HybridBinarizer(lumSource);
          const bitmap = new BinaryBitmap(binarizer);

          let decodedResult = null;

          // Attempt 1D barcode decode
          try {
            decodedResult = oneDReader.decode(bitmap, hints);
          } catch (e1) {
            // Attempt QR code fallback
            try {
              decodedResult = qrReader.decode(bitmap, hints);
            } catch (e2) {}
          }

          // If not detected horizontally, try 90-degree rotated buffer for vertical barcodes
          if (!decodedResult) {
            try {
              const rotatedLuminances = new Uint8ClampedArray(pixelCount);
              for (let y = 0; y < targetHeight; y++) {
                for (let x = 0; x < targetWidth; x++) {
                  rotatedLuminances[x * targetHeight + (targetHeight - 1 - y)] = luminances[y * targetWidth + x];
                }
              }
              const rotatedSource = new RGBLuminanceSource(rotatedLuminances, targetHeight, targetWidth);
              const rotatedBitmap = new BinaryBitmap(new HybridBinarizer(rotatedSource));
              decodedResult = oneDReader.decode(rotatedBitmap, hints);
            } catch (e3) {}
          }

          if (decodedResult && !isProcessingScanRef.current && isCameraActiveRef.current) {
            const rawText = decodedResult.getText();
            if (rawText) {
              isProcessingScanRef.current = true;
              stopLoop();
              handleBarcodeScanned(rawText);
              return;
            }
          }
        } catch (frameErr) {
          // Continue scanning next frame
        }

        scanTimer = setTimeout(processFrame, 100);
      };

      // Start the scan loop
      processFrame();
      setScanningStatus('Point your camera at a food barcode');
    } catch (scannerErr) {
      console.error('Barcode scanner initialization failed:', scannerErr);
      stopCamera();
      setCameraError('Failed to initialize barcode scanner engine. Please use manual barcode entry.');
    }
  };

  const handleSwitchCamera = () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextDevice = availableCameras[nextIndex];
    if (nextDevice?.deviceId) {
      startCamera(nextDevice.deviceId);
    }
  };

  const handleToggleTorch = async () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const newTorchState = !isTorchOn;
      await videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setIsTorchOn(newTorchState);
    } catch (torchErr) {
      console.warn('Torch toggle failed:', torchErr);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setManualError('');
    setError('');

    const normalized = normalizeBarcode(manualBarcode);

    if (!normalized) {
      setManualError('Please enter a barcode number.');
      manualInputRef.current?.focus();
      return;
    }

    const validation = verifyBarcode(normalized, { requireChecksum: true });

    if (!validation.isValid) {
      if (validation.errorType === 'CHECKSUM_FAILED') {
        setManualError(
          `Checksum verification failed (calculated check digit is ${validation.expectedCheckDigit}, but barcode ends with ${validation.actualCheckDigit}). Please check the digits.`
        );
      } else {
        setManualError(validation.error || 'Please enter a valid numeric barcode.');
      }
      manualInputRef.current?.focus();
      return;
    }

    handleLookup(validation.normalized, 'manual_form');
  };

  const focusManualEntry = () => {
    manualInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    manualInputRef.current?.focus();
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <PageTransition className="space-y-8 max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Scan Product"
        description="Scan the barcode on a packaged food product to discover nutrition, ingredients, allergens, and transparent product data."
      />

      {notFoundBarcode ? (
        <ProductNotFoundState
          barcode={notFoundBarcode}
          onResetScan={() => {
            setNotFoundBarcode(null);
            setError('');
            setChecksumWarning('');
            startCamera();
          }}
        />
      ) : (
        <>
          {/* General Lookup Error Banner */}
          {error && (
            <Alert variant="destructive" className="rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="font-medium text-xs">
                  {typeof error === 'string' ? error : (error?.message || 'An error occurred during barcode lookup.')}
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError('')}
                className="text-rose-800 hover:bg-rose-100 text-xs h-7 px-2.5 rounded-lg"
              >
                Dismiss
              </Button>
            </Alert>
          )}

          {/* Camera Access Warning Banner */}
          {cameraError && (
            <Alert variant="warning" className="rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5 sm:mt-0" />
                <div>
                  <AlertTitle className="font-bold text-xs">
                    {typeof cameraError === 'string' ? cameraError : (cameraError?.message || 'Camera Error')}
                  </AlertTitle>
                  <p className="text-[11px] text-amber-800 mt-0.5 font-medium">
                    {cameraErrorType === 'NOT_ALLOWED'
                      ? 'Camera permissions can be enabled in your browser or device site settings.'
                      : 'You can easily type or paste the numbers printed under the packaging barcode.'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={focusManualEntry}
                className="bg-white hover:bg-amber-50 text-amber-900 border-amber-300 text-xs rounded-xl font-bold whitespace-nowrap gap-1.5"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Use Manual Entry</span>
              </Button>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Primary Camera Scanner Card */}
              <Card className="p-6 text-center bg-slate-900 text-white border-slate-800 relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center shadow-xl rounded-3xl">
                {/* Active Camera Viewport */}
                <div
                  className={`relative w-full h-[300px] sm:h-[340px] bg-black rounded-2xl overflow-hidden flex items-center justify-center ${
                    isCameraActive ? 'block' : 'hidden'
                  }`}
                >
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    autoPlay
                  />

                  {/* Aiming Reticle & Scanning Animation */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                    <div className="relative w-64 sm:w-72 h-36 sm:h-40 rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.5)] flex items-center justify-center overflow-hidden">
                      {/* Corner reticle brackets */}
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />

                      {/* Animated Laser Scanning Line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_14px_#10b981] animate-scan-laser" />
                    </div>
                    <span className="mt-4 text-xs font-bold tracking-wide text-emerald-300 bg-slate-950/80 px-4 py-1.5 rounded-full backdrop-blur-md border border-emerald-500/20 shadow-lg">
                      Center barcode inside the frame
                    </span>
                  </div>

                  {/* Top Bar Controls */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="truncate max-w-[170px] sm:max-w-xs">{scanningStatus}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasTorch && (
                        <button
                          type="button"
                          onClick={handleToggleTorch}
                          className={`p-2 rounded-xl border backdrop-blur-md transition-colors ${
                            isTorchOn
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800'
                          }`}
                          title={isTorchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                        >
                          {isTorchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                        </button>
                      )}

                      {availableCameras.length > 1 && (
                        <button
                          type="button"
                          onClick={handleSwitchCamera}
                          className="p-2 rounded-xl bg-slate-900/80 text-white border border-slate-700 hover:bg-slate-800 backdrop-blur-md transition-colors"
                          title="Switch Camera (Front/Rear)"
                        >
                          <FlipHorizontal className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={stopCamera}
                        className="p-2 rounded-xl bg-slate-900/80 text-white border border-slate-700 hover:bg-slate-800 backdrop-blur-md transition-colors"
                        title="Close Camera"
                      >
                        <CameraOff className="w-4 h-4 text-rose-400" />
                      </button>
                    </div>
                  </div>

                  {/* Checksum Warning Toast */}
                  {checksumWarning && (
                    <div className="absolute bottom-3 inset-x-3 bg-amber-500/95 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xl backdrop-blur-md z-10 animate-fade-in">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{checksumWarning}</span>
                    </div>
                  )}
                </div>

                {/* Inactive Camera State */}
                {!isCameraActive && (
                  <div className="relative z-10 space-y-4 max-w-md mx-auto py-8">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-inner">
                      <Camera className="w-10 h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">Live Barcode Scanner</h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto font-medium">
                        Point your camera at any packaged food item to automatically decode EAN-13, EAN-8, UPC-A, or UPC-E barcodes.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button
                        variant="primary"
                        onClick={() => startCamera()}
                        disabled={loading}
                        className="w-full sm:w-auto shadow-md shadow-emerald-950/40 rounded-xl gap-2 font-bold"
                      >
                        <ScanBarcode className="w-4 h-4" />
                        <span>Start Camera Scan</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={focusManualEntry}
                        className="w-full sm:w-auto text-white border-slate-700 bg-slate-800/80 hover:bg-slate-800 rounded-xl gap-2 font-bold"
                      >
                        <Keyboard className="w-4 h-4" />
                        <span>Enter Manually</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading Overlay During Database Query */}
                {loading && (
                  <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center z-30 animate-fade-in">
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
                    <p className="text-sm font-bold text-white tracking-wide">{lookupMessage}</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Checking Open Food Facts catalog &amp; health score</p>
                  </div>
                )}
              </Card>

              {/* Manual Input Section */}
              <Card className="border-slate-200/90 shadow-sm p-6 sm:p-7 rounded-3xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-emerald-600" />
                    <span>Enter Barcode Manually</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                    8, 12, or 13 digits
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
                  Type or paste the numeric barcode printed directly beneath the packaging stripes (spaces or dashes are cleaned automatically).
                </p>

                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Input
                        ref={manualInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        placeholder="e.g. 5449000000996 or 012345678905"
                        value={manualBarcode}
                        onChange={(e) => {
                          setManualBarcode(e.target.value);
                          if (manualError) setManualError('');
                        }}
                        className={`font-mono text-sm tracking-wider rounded-xl ${
                          manualError ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/30' : ''
                        }`}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      className="px-5 font-bold rounded-xl gap-1.5"
                    >
                      <CornerDownLeft className="w-4 h-4" />
                      <span>Find Product</span>
                    </Button>
                  </div>

                  {/* Inline Validation Error */}
                  {manualError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-fade-in">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <span className="font-bold">{typeof manualError === 'string' ? manualError : (manualError?.message || 'Invalid barcode')}</span>
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          Standard retail packaging codes use 12 digits (UPC-A), 13 digits (EAN-13), or 8 digits (EAN-8) with a mathematical check digit.
                        </p>
                      </div>
                    </div>
                  )}
                </form>
              </Card>
            </div>

            {/* Scanner Guidelines Sidebar */}
            <div className="space-y-6">
              <Card className="bg-emerald-50/50 border-emerald-100/80 shadow-xs p-6 rounded-3xl space-y-3.5">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ScanBarcode className="w-4 h-4 text-emerald-600" />
                  <span>Scanning Guidelines</span>
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                    <span>Hold your camera 4 to 6 inches away from the product barcode.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                    <span>Keep the barcode horizontal and centered in the green frame.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                    <span>Avoid glare, heavy shadows, or crumpled packaging reflections.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                    <span>Supports standard EAN-13, UPC-A, EAN-8, and UPC-E codes.</span>
                  </li>
                </ul>
              </Card>

              <Card className="bg-slate-50 border-slate-200/80 shadow-xs p-6 rounded-3xl space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Barcode Reliability &amp; Fallback</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Every detected barcode is validated with standard GS1 checksum verification before database querying to eliminate camera misreads.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  If your device camera is blocked or packaging is damaged, manual entry provides identical instant product analysis.
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </PageTransition>
  );
};
