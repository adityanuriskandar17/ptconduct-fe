import { useState, useEffect, useRef } from 'react';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const handleActivateCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      handleStopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-3 sm:p-4 md:p-5 lg:p-6 font-sans overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-lg shadow-sm mb-4 sm:mb-5 md:mb-6 gap-3 sm:gap-4 lg:gap-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-base sm:text-lg md:text-xl font-semibold text-[#1a1a1a] leading-tight">PT Conduct Dashboard</h1>
          <p className="m-0 text-xs sm:text-[13px] text-[#666] leading-tight">PT Conduct - A.R. Hakim</p>
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
          <button className="bg-transparent border-none text-xl cursor-pointer p-1.5 text-[#666] flex items-center justify-center w-8 h-8 rounded transition-colors hover:bg-[#f5f5f5] flex-shrink-0">
            <span className="block leading-none">⋯</span>
          </button>
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
          {isCameraActive && videoRef.current ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-sm sm:text-base font-medium">Kamera belum diaktifkan</p>
            </div>
          )}
          </div>
        </div>

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
