import { useState, useEffect, useRef } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface FaceCheckingProps {
  onBack: () => void;
}

const FaceChecking = ({ onBack }: FaceCheckingProps) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const isSetupRef = useRef(false);

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
        
        // Draw landmarks on canvas for visual feedback
        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw face landmarks
            const landmarks = results.multiFaceLandmarks[0];
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            
            // Draw face mesh (simplified - just key points)
            ctx.beginPath();
            for (let i = 0; i < landmarks.length; i += 5) {
              const point = landmarks[i];
              const mirroredX = canvas.width - (point.x * canvas.width);
              const y = point.y * canvas.height;
              
              if (i === 0) {
                ctx.moveTo(mirroredX, y);
              } else {
                ctx.lineTo(mirroredX, y);
              }
            }
            ctx.stroke();
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

        {/* Face Detection Status */}
        {isCameraActive && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <div className="flex items-center justify-center gap-3">
                <div className={`w-3 h-3 rounded-full ${faceDetected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {faceDetected ? 'Wajah Terdeteksi' : 'Menunggu Wajah...'}
                </span>
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
