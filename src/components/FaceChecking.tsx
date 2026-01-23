import { useState, useEffect, useRef } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface FaceCheckingProps {
  onBack: () => void;
}

const FaceChecking = ({ onBack }: FaceCheckingProps) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const isSetupRef = useRef(false);

  // Eye landmarks indices (MediaPipe Face Mesh) - using key points for EAR calculation
  const LEFT_EYE_TOP = 159;
  const LEFT_EYE_BOTTOM = 145;
  const LEFT_EYE_LEFT = 33;
  const LEFT_EYE_RIGHT = 133;
  const LEFT_EYE_TOP_INNER = 158;
  const LEFT_EYE_BOTTOM_INNER = 153;
  
  const RIGHT_EYE_TOP = 386;
  const RIGHT_EYE_BOTTOM = 374;
  const RIGHT_EYE_LEFT = 362;
  const RIGHT_EYE_RIGHT = 263;
  const RIGHT_EYE_TOP_INNER = 385;
  const RIGHT_EYE_BOTTOM_INNER = 380;
  
  // Eye Aspect Ratio calculation
  const calculateEAR = (landmarks: any[], eyeTop: number, eyeBottom: number, eyeLeft: number, eyeRight: number, eyeTopInner: number, eyeBottomInner: number) => {
    const top = landmarks[eyeTop];
    const bottom = landmarks[eyeBottom];
    const left = landmarks[eyeLeft];
    const right = landmarks[eyeRight];
    const topInner = landmarks[eyeTopInner];
    const bottomInner = landmarks[eyeBottomInner];
    
    const vertical1 = Math.sqrt(
      Math.pow(top.x - bottom.x, 2) +
      Math.pow(top.y - bottom.y, 2)
    );
    const vertical2 = Math.sqrt(
      Math.pow(topInner.x - bottomInner.x, 2) +
      Math.pow(topInner.y - bottomInner.y, 2)
    );
    
    const horizontal = Math.sqrt(
      Math.pow(left.x - right.x, 2) +
      Math.pow(left.y - right.y, 2)
    );
    
    if (horizontal === 0) return 1.0;
    return (vertical1 + vertical2) / (2.0 * horizontal);
  };
  
  const blinkStateRef = useRef({ 
    state: 'OPEN' as 'OPEN' | 'CLOSING' | 'CLOSED' | 'OPENING',
    closedFrames: 0,
    openFrames: 0,
    lastEAR: 1.0,
    baselineEAR: 1.0,
    earHistory: [] as number[],
    frameCount: 0
  });
  const EAR_DROP_RATIO = 0.5;
  const MIN_CLOSED_FRAMES = 0;
  const MIN_OPEN_FRAMES = 0;
  const BASELINE_FRAMES = 20;
  const FAST_BLINK_DROP_THRESHOLD = 0.35;
  const FAST_BLINK_RECOVERY_THRESHOLD = 0.75;

  const setupFaceMesh = () => {
    if (!videoRef.current || isSetupRef.current) return;
    isSetupRef.current = true;
    
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });
    
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    faceMesh.onResults((results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        setFaceDetected(true);
        const landmarks = results.multiFaceLandmarks[0];
        
        // Calculate EAR for both eyes
        const leftEAR = calculateEAR(
          landmarks, 
          LEFT_EYE_TOP, LEFT_EYE_BOTTOM, LEFT_EYE_LEFT, LEFT_EYE_RIGHT,
          LEFT_EYE_TOP_INNER, LEFT_EYE_BOTTOM_INNER
        );
        const rightEAR = calculateEAR(
          landmarks,
          RIGHT_EYE_TOP, RIGHT_EYE_BOTTOM, RIGHT_EYE_LEFT, RIGHT_EYE_RIGHT,
          RIGHT_EYE_TOP_INNER, RIGHT_EYE_BOTTOM_INNER
        );
        const avgEAR = (leftEAR + rightEAR) / 2.0;
        
        const state = blinkStateRef.current;
        state.frameCount++;
        state.lastEAR = avgEAR;
        
        // Calculate baseline EAR
        if (state.frameCount <= BASELINE_FRAMES) {
          state.earHistory.push(avgEAR);
          if (state.frameCount === BASELINE_FRAMES) {
            const sum = state.earHistory.reduce((a, b) => a + b, 0);
            state.baselineEAR = sum / state.earHistory.length;
          }
        } else {
          state.baselineEAR = state.baselineEAR * 0.99 + avgEAR * 0.01;
        }
        
        // Calculate dynamic threshold
        const dynamicThreshold = state.baselineEAR * EAR_DROP_RATIO;
        const fastBlinkThreshold = state.baselineEAR * FAST_BLINK_DROP_THRESHOLD;
        const fastBlinkRecovery = state.baselineEAR * FAST_BLINK_RECOVERY_THRESHOLD;
        
        const isClosed = avgEAR < dynamicThreshold;
        const isFastBlinkClosed = avgEAR < fastBlinkThreshold;
        const isRecovered = avgEAR >= fastBlinkRecovery;
        const earDropPercent = ((state.baselineEAR - avgEAR) / state.baselineEAR) * 100;
        const earDropRatio = avgEAR / state.baselineEAR;
        
        const previousEAR = state.lastEAR;
        const rapidDrop = previousEAR > 0 && ((previousEAR - avgEAR) / previousEAR) > 0.3;
        
        // Blink detection state machine
        switch (state.state) {
          case 'OPEN':
            if (state.frameCount > BASELINE_FRAMES) {
              if (isFastBlinkClosed && rapidDrop) {
                state.state = 'CLOSED';
                state.closedFrames = 1;
                state.openFrames = 0;
                setIsBlinking(true);
              } else if (isClosed) {
                state.state = 'CLOSING';
                state.closedFrames = 1;
                state.openFrames = 0;
              }
            }
            break;
            
          case 'CLOSING':
            if (isClosed || isFastBlinkClosed) {
              state.closedFrames++;
              if (state.closedFrames > MIN_CLOSED_FRAMES || isFastBlinkClosed || rapidDrop) {
                state.state = 'CLOSED';
                setIsBlinking(true);
              }
            } else {
              if (earDropPercent > 30 && state.closedFrames > 0) {
                state.state = 'CLOSED';
                setIsBlinking(true);
              } else {
                state.state = 'OPEN';
                state.closedFrames = 0;
              }
            }
            break;
            
          case 'CLOSED':
            if (!isClosed || isRecovered) {
              state.state = 'OPENING';
              state.openFrames = 1;
            }
            break;
            
          case 'OPENING':
            if (!isClosed || isRecovered) {
              state.openFrames++;
              const canDetectBlink = state.openFrames > MIN_OPEN_FRAMES || 
                                    isRecovered || 
                                    (earDropRatio >= 0.7 && state.openFrames > 0) ||
                                    (rapidDrop && avgEAR > state.baselineEAR * 0.65);
              
              if (canDetectBlink) {
                setBlinkCount(prev => prev + 1);
                setIsBlinking(true);
                
                state.state = 'OPEN';
                state.closedFrames = 0;
                state.openFrames = 0;
                
                setTimeout(() => {
                  setIsBlinking(false);
                }, 300);
              }
            } else {
              state.state = 'CLOSED';
              state.openFrames = 0;
            }
            break;
        }
        
        state.lastEAR = avgEAR;
        
        // Draw landmarks on canvas for visual feedback
        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw eye landmarks - rectangles around eyes
            ctx.strokeStyle = isBlinking ? '#ef4444' : '#10b981';
            ctx.lineWidth = 2;
            
            // Left eye rectangle
            const leftEyeTop = landmarks[LEFT_EYE_TOP];
            const leftEyeBottom = landmarks[LEFT_EYE_BOTTOM];
            const leftEyeLeft = landmarks[LEFT_EYE_LEFT];
            const leftEyeRight = landmarks[LEFT_EYE_RIGHT];
            
            const leftEyeX = canvas.width - (Math.min(leftEyeLeft.x, leftEyeRight.x) * canvas.width);
            const leftEyeY = Math.min(leftEyeTop.y, leftEyeBottom.y) * canvas.height;
            const leftEyeWidth = Math.abs((leftEyeRight.x - leftEyeLeft.x) * canvas.width);
            const leftEyeHeight = Math.abs((leftEyeBottom.y - leftEyeTop.y) * canvas.height);
            
            ctx.strokeRect(leftEyeX - leftEyeWidth, leftEyeY, leftEyeWidth, leftEyeHeight);
            
            // Right eye rectangle
            const rightEyeTop = landmarks[RIGHT_EYE_TOP];
            const rightEyeBottom = landmarks[RIGHT_EYE_BOTTOM];
            const rightEyeLeft = landmarks[RIGHT_EYE_LEFT];
            const rightEyeRight = landmarks[RIGHT_EYE_RIGHT];
            
            const rightEyeX = canvas.width - (Math.min(rightEyeLeft.x, rightEyeRight.x) * canvas.width);
            const rightEyeY = Math.min(rightEyeTop.y, rightEyeBottom.y) * canvas.height;
            const rightEyeWidth = Math.abs((rightEyeRight.x - rightEyeLeft.x) * canvas.width);
            const rightEyeHeight = Math.abs((rightEyeBottom.y - rightEyeTop.y) * canvas.height);
            
            ctx.strokeRect(rightEyeX - rightEyeWidth, rightEyeY, rightEyeWidth, rightEyeHeight);
          }
        }
      } else {
        setFaceDetected(false);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      }
    });
    
    faceMeshRef.current = faceMesh;
    
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await faceMesh.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });
    
    cameraRef.current = camera;
    camera.start();
  };

  const handleActivateCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
      setIsCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setIsCameraActive(false);
    setFaceDetected(false);
    setBlinkCount(0);
    setIsBlinking(false);
    blinkStateRef.current = { 
      state: 'OPEN', 
      closedFrames: 0, 
      openFrames: 0, 
      lastEAR: 1.0,
      baselineEAR: 1.0,
      earHistory: [],
      frameCount: 0
    };
    isSetupRef.current = false;
  };

  useEffect(() => {
    return () => {
      handleStopCamera();
    };
  }, []);

  // Update video srcObject when camera becomes active
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().then(() => {
        // Setup FaceMesh after video starts playing
        setTimeout(() => {
          setupFaceMesh();
        }, 500);
      }).catch(err => {
        console.error('Error playing video:', err);
      });
    } else {
      // Cleanup
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
      setFaceDetected(false);
      setBlinkCount(0);
      setIsBlinking(false);
      blinkStateRef.current = { 
        state: 'OPEN', 
        closedFrames: 0, 
        openFrames: 0, 
        lastEAR: 1.0,
        baselineEAR: 1.0,
        earHistory: [],
        frameCount: 0
      };
      isSetupRef.current = false;
    }
  }, [isCameraActive]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 sm:p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 uppercase">
            Verifikasi Wajah
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Posisikan wajah Anda di depan kamera
          </p>
        </div>

        {/* Camera Feed Area */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-gray-100 rounded-lg overflow-hidden relative w-full" style={{ aspectRatio: '4/3', minHeight: '300px' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none ${isCameraActive ? 'block' : 'hidden'}`}
            />
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-sm sm:text-base font-medium">Kamera belum diaktifkan</p>
              </div>
            )}
          </div>
        </div>

        {/* Face Detection and Blink Status */}
        {isCameraActive && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${faceDetected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {faceDetected ? 'Wajah Terdeteksi' : 'Menunggu Wajah...'}
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Blink Count:</span>
                    <span className={`text-lg font-bold ${isBlinking ? 'text-red-500 scale-125 transition-transform' : 'text-blue-600'}`}>
                      {blinkCount}
                    </span>
                  </div>
                  {isBlinking && (
                    <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold animate-pulse">
                      BLINK DETECTED!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-2.5 sm:py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Kembali
          </button>
          {!isCameraActive ? (
            <button
              onClick={handleActivateCamera}
              className="flex-1 py-2.5 sm:py-3 px-4 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Aktifkan Kamera
            </button>
          ) : (
            <button
              onClick={handleStopCamera}
              className="flex-1 py-2.5 sm:py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Matikan Kamera
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceChecking;
