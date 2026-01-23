import { useState, useEffect, useRef } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface Member {
  id: number;
  name: string;
  pt: string;
  start: string;
  end: string;
  gateTime: string;
  gateStatus: boolean;
  bookingStatus: boolean;
  faceStatus: boolean;
}

interface FaceValidationProps {
  member: Member;
  onBack: () => void;
}

const FaceValidation = ({ member, onBack }: FaceValidationProps) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const isSetupRef = useRef(false);
  
  // Eye landmarks indices (MediaPipe Face Mesh) - using key points for EAR calculation
  // Left eye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
  // Right eye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
  // Using 6 key points for EAR: outer corner, inner corner, top, bottom
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
  
  // Eye Aspect Ratio calculation - improved version
  const calculateEAR = (landmarks: any[], eyeTop: number, eyeBottom: number, eyeLeft: number, eyeRight: number, eyeTopInner: number, eyeBottomInner: number) => {
    // Get key points
    const top = landmarks[eyeTop];
    const bottom = landmarks[eyeBottom];
    const left = landmarks[eyeLeft];
    const right = landmarks[eyeRight];
    const topInner = landmarks[eyeTopInner];
    const bottomInner = landmarks[eyeBottomInner];
    
    // Calculate vertical distances (average of outer and inner)
    const vertical1 = Math.sqrt(
      Math.pow(top.x - bottom.x, 2) +
      Math.pow(top.y - bottom.y, 2)
    );
    const vertical2 = Math.sqrt(
      Math.pow(topInner.x - bottomInner.x, 2) +
      Math.pow(topInner.y - bottomInner.y, 2)
    );
    
    // Calculate horizontal distance
    const horizontal = Math.sqrt(
      Math.pow(left.x - right.x, 2) +
      Math.pow(left.y - right.y, 2)
    );
    
    // EAR formula: average vertical / horizontal
    if (horizontal === 0) return 1.0;
    return (vertical1 + vertical2) / (2.0 * horizontal);
  };
  
  const blinkStateRef = useRef({ 
    state: 'OPEN' as 'OPEN' | 'CLOSING' | 'CLOSED' | 'OPENING',
    closedFrames: 0,
    openFrames: 0,
    lastEAR: 1.0,
    baselineEAR: 1.0, // Baseline EAR saat mata terbuka normal
    earHistory: [] as number[], // History untuk calculate baseline
    frameCount: 0
  });
  const EAR_DROP_RATIO = 0.5; // EAR harus turun 50% dari baseline untuk dianggap tertutup
  const MIN_CLOSED_FRAMES = 0; // Minimum frames mata harus tertutup (0 untuk deteksi sangat cepat)
  const MIN_OPEN_FRAMES = 0; // Minimum frames mata harus terbuka setelah tertutup (0 untuk deteksi sangat cepat)
  const BASELINE_FRAMES = 20; // Frames untuk calculate baseline (reduced for faster initialization)
  const FAST_BLINK_DROP_THRESHOLD = 0.35; // Threshold untuk deteksi blink sangat cepat (35% drop)
  const FAST_BLINK_RECOVERY_THRESHOLD = 0.75; // Threshold untuk recovery blink cepat (75% dari baseline)
  const [currentEAR, setCurrentEAR] = useState<number | null>(null);
  const [baselineEAR, setBaselineEAR] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const day = days[date.getDay()];
    const dayNum = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}, ${dayNum}/${month}/${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

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
        
        // Calculate EAR for both eyes using improved calculation
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
        setCurrentEAR(avgEAR);
        
        const state = blinkStateRef.current;
        state.frameCount++;
        state.lastEAR = avgEAR;
        
        // Calculate baseline EAR (average of recent frames when eyes are open)
        if (state.frameCount <= BASELINE_FRAMES) {
          state.earHistory.push(avgEAR);
          if (state.frameCount === BASELINE_FRAMES) {
            // Calculate baseline as average of history
            const sum = state.earHistory.reduce((a, b) => a + b, 0);
            state.baselineEAR = sum / state.earHistory.length;
            setBaselineEAR(state.baselineEAR);
            console.log('📊 Baseline EAR calculated:', state.baselineEAR.toFixed(3));
          }
        } else {
          // Update baseline gradually (moving average)
          state.baselineEAR = state.baselineEAR * 0.99 + avgEAR * 0.01;
          setBaselineEAR(state.baselineEAR);
        }
        
        // Calculate dynamic threshold based on baseline
        const dynamicThreshold = state.baselineEAR * EAR_DROP_RATIO;
        const fastBlinkThreshold = state.baselineEAR * FAST_BLINK_DROP_THRESHOLD;
        const fastBlinkRecovery = state.baselineEAR * FAST_BLINK_RECOVERY_THRESHOLD;
        
        // State machine for blink detection using relative threshold
        const isClosed = avgEAR < dynamicThreshold;
        const isFastBlinkClosed = avgEAR < fastBlinkThreshold;
        const isRecovered = avgEAR >= fastBlinkRecovery;
        const earDropPercent = ((state.baselineEAR - avgEAR) / state.baselineEAR) * 100;
        const earDropRatio = avgEAR / state.baselineEAR;
        
        // Track previous EAR for detecting rapid changes
        const previousEAR = state.lastEAR;
        const rapidDrop = previousEAR > 0 && ((previousEAR - avgEAR) / previousEAR) > 0.3; // 30% drop in one frame
        
        switch (state.state) {
          case 'OPEN':
            if (state.frameCount > BASELINE_FRAMES) {
              // Check for very fast blink (direct OPEN -> CLOSED -> OPEN in rapid succession)
              if (isFastBlinkClosed && rapidDrop) {
                // Ultra-fast blink detected - go directly to CLOSED
                state.state = 'CLOSED';
                state.closedFrames = 1;
                state.openFrames = 0;
                setIsBlinking(true);
                console.log('⚡⚡ Ultra-fast blink detected (OPEN->CLOSED), EAR:', avgEAR.toFixed(3),
                  'Previous:', previousEAR.toFixed(3),
                  'Drop:', earDropPercent.toFixed(1) + '%');
              } else if (isClosed) {
                state.state = 'CLOSING';
                state.closedFrames = 1;
                state.openFrames = 0;
                console.log('🔄 Transition: OPEN -> CLOSING, EAR:', avgEAR.toFixed(3), 
                  'Baseline:', state.baselineEAR.toFixed(3), 
                  'Drop:', earDropPercent.toFixed(1) + '%');
              }
            }
            break;
            
          case 'CLOSING':
            if (isClosed || isFastBlinkClosed) {
              state.closedFrames++;
              // Immediately transition to CLOSED for fast blinks
              if (state.closedFrames > MIN_CLOSED_FRAMES || isFastBlinkClosed || rapidDrop) {
                state.state = 'CLOSED';
                setIsBlinking(true);
                console.log('👁️ Eyes CLOSED, EAR:', avgEAR.toFixed(3), 
                  'Baseline:', state.baselineEAR.toFixed(3),
                  'Drop:', earDropPercent.toFixed(1) + '%',
                  'Frames:', state.closedFrames);
              }
            } else {
              // Eyes opened before reaching minimum closed frames
              // For very fast blinks, if EAR dropped significantly, count it immediately
              if (earDropPercent > 30 && state.closedFrames > 0) {
                // Fast blink detected - skip to CLOSED state immediately
                state.state = 'CLOSED';
                setIsBlinking(true);
                console.log('⚡ Fast blink detected (CLOSING->CLOSED), EAR:', avgEAR.toFixed(3),
                  'Drop:', earDropPercent.toFixed(1) + '%');
              } else {
                // Not a significant blink, reset
                state.state = 'OPEN';
                state.closedFrames = 0;
              }
            }
            break;
            
          case 'CLOSED':
            if (!isClosed || isRecovered) {
              state.state = 'OPENING';
              state.openFrames = 1;
              console.log('🔄 Transition: CLOSED -> OPENING, EAR:', avgEAR.toFixed(3),
                'Baseline:', state.baselineEAR.toFixed(3));
            }
            break;
            
          case 'OPENING':
            if (!isClosed || isRecovered) {
              state.openFrames++;
              // For fast blinks, detect immediately if EAR is back to normal range
              // Allow immediate detection for very fast blinks
              const canDetectBlink = state.openFrames > MIN_OPEN_FRAMES || 
                                    isRecovered || 
                                    (earDropRatio >= 0.7 && state.openFrames > 0) ||
                                    (rapidDrop && avgEAR > state.baselineEAR * 0.65);
              
              if (canDetectBlink) {
                // Complete blink detected!
                const newCount = blinkCount + 1;
                console.log('✅✅✅ BLINK DETECTED! Count:', newCount, 
                  'EAR:', avgEAR.toFixed(3),
                  'Baseline:', state.baselineEAR.toFixed(3),
                  'Open frames:', state.openFrames,
                  'Recovery:', (earDropRatio * 100).toFixed(1) + '%');
                setBlinkCount(prev => prev + 1);
                setIsBlinking(true);
                
                // Reset to OPEN state
                state.state = 'OPEN';
                state.closedFrames = 0;
                state.openFrames = 0;
                
                // Reset blinking visual after animation
                setTimeout(() => {
                  setIsBlinking(false);
                }, 300);
              }
            } else {
              // Eyes closed again before completing opening - back to CLOSED
              state.state = 'CLOSED';
              state.openFrames = 0;
            }
            break;
        }
        
        // Update last EAR for next frame comparison
        state.lastEAR = avgEAR;
        
        // Draw landmarks on canvas for visual feedback
        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw eye landmarks - simplified rectangle around eyes
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
    setBlinkCount(0);
    setIsBlinking(false);
    setFaceDetected(false);
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
      setBlinkCount(0);
      setIsBlinking(false);
      setFaceDetected(false);
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
    <div className="min-h-screen bg-[#f5f5f5] p-3 sm:p-4 md:p-5 lg:p-6 font-sans overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-lg shadow-sm mb-4 sm:mb-5 md:mb-6 gap-3 sm:gap-4 lg:gap-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-base sm:text-lg md:text-xl font-semibold text-[#1a1a1a] leading-tight">PT Conduct Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full lg:w-auto">
          <div className="bg-[#f8f9fa] border border-[#e0e0e0] px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-[20px] flex flex-row items-center justify-center gap-1.5 sm:gap-2 md:gap-3 shadow-sm">
            <span className="text-xs sm:text-[13px] font-medium text-[#666] whitespace-nowrap">{formatDate(currentDateTime)}</span>
            <span className="text-sm md:text-base text-[#ddd] font-light">|</span>
            <span className="font-semibold text-xs sm:text-sm text-[#3b82f6] tracking-wide whitespace-nowrap">{formatTime(currentDateTime)}</span>
          </div>
          <div className="flex-1 lg:flex-none min-w-0">
            <select className="w-full lg:w-auto px-2 sm:px-3 md:px-3.5 py-1.5 sm:py-2 border border-[#ddd] rounded-md text-xs sm:text-[13px] bg-white cursor-pointer text-[#333]">
              <option>PT Conduct - A.R. Hakim</option>
            </select>
          </div>
          <div className="flex-1 lg:flex-none min-w-0">
            <input 
              type="email" 
              value="adit_sang_legenda@example.com" 
              readOnly 
              className="w-full lg:w-auto px-2 sm:px-3 md:px-3.5 py-1.5 sm:py-2 border border-[#ddd] rounded-md text-xs sm:text-[13px] bg-white text-[#333] truncate"
            />
          </div>
        </div>
      </nav>

      {/* Member Information Card */}
      <div className="bg-white rounded-xl shadow-md mb-4 sm:mb-5 md:mb-6 p-4 sm:p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
          {/* Member Info */}
          <div className="flex-1 w-full md:w-auto">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Member</label>
                <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 break-words">{member.name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Personal Trainer</label>
                <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 break-words">{member.pt}</p>
              </div>
              {/* Validation Status Badge */}
              <div>
                <span className="inline-block bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                  Belum Validasi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Face Verification Card */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 md:p-6">
        <div className="mb-3 sm:mb-4 md:mb-5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Verifikasi Wajah</label>
          <p className="text-sm text-gray-600">Posisikan wajah Anda di depan kamera</p>
        </div>

        {/* Camera Feed Area */}
        <div className="flex justify-center mb-4 sm:mb-5 md:mb-6">
          <div className="bg-gray-100 rounded-lg overflow-hidden relative w-full max-w-2xl" style={{ aspectRatio: '4/3', minHeight: '250px', maxHeight: '450px' }}>
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
                <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-sm sm:text-base font-medium">Kamera belum diaktifkan</p>
              </div>
            )}
          </div>
        </div>

        {/* Blink Detection Status */}
        {isCameraActive && (
          <div className="mb-4 sm:mb-5 md:mb-6">
            <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                  {currentEAR !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">EAR:</span>
                      <span className={`text-sm font-mono font-semibold ${
                        baselineEAR && currentEAR < (baselineEAR * EAR_DROP_RATIO) ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {currentEAR.toFixed(3)}
                      </span>
                      {baselineEAR && (
                        <span className="text-xs text-gray-400">
                          (baseline: {baselineEAR.toFixed(2)})
                        </span>
                      )}
                    </div>
                  )}
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
            className="flex-1 py-2.5 sm:py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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

export default FaceValidation;
