import { useState, useEffect } from 'react';
import notValidationIcon from '../assets/not_validation.svg';
import validationIcon from '../assets/validation.svg';
import totalBookingIcon from '../assets/total_booking.svg';
// import selectDateIcon from '../assets/select_date.svg';
import greenCheckIcon from '../assets/green_check.svg';
import searchIcon from '../assets/search.svg';
import validasiIcon from '../assets/validasi.svg';
import gateCheckIcon from '../assets/gate_check.svg';
import uncheckIcon from '../assets/uncheck.svg';
import FaceValidation from './FaceValidation';

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

interface DashboardProps {
  onLogout?: () => void;
  userEmail?: string;
}

const Dashboard = ({ onLogout, userEmail = 'adit_sang_legenda@example.com' }: DashboardProps) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [gateChecked, setGateChecked] = useState(true);
  const [bookingChecked, setBookingChecked] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailMember, setSelectedDetailMember] = useState<Member | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [showFaceValidation, setShowFaceValidation] = useState(false);
  const [validationMember, setValidationMember] = useState<Member | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return formatDate(date) + ' ' + formatTime(date);
  };

  // Sample data
  const [members] = useState<Member[]>([
    {
      id: 1,
      name: 'Thio Irfan Siswanto',
      pt: 'Moh Rizal',
      start: '2026-01-16T14:00:00',
      end: '14:00',
      gateTime: '2026-01-16T14:00:00',
      gateStatus: true,
      bookingStatus: true,
      faceStatus: false,
    },
    {
      id: 2,
      name: 'Thio Irfan Siswanto',
      pt: 'Moh Rizal',
      start: '2026-01-16T14:00:00',
      end: '14:00',
      gateTime: '2026-01-16T14:00:00',
      gateStatus: true,
      bookingStatus: true,
      faceStatus: false,
    },
    {
      id: 3,
      name: 'Thio Irfan Siswanto',
      pt: 'Moh Rizal',
      start: '2026-01-16T14:00:00',
      end: '14:00',
      gateTime: '2026-01-16T14:00:00',
      gateStatus: true,
      bookingStatus: true,
      faceStatus: false,
    },
    {
      id: 4,
      name: 'Thio Irfan Siswanto',
      pt: 'Moh Rizal',
      start: '2026-01-16T14:00:00',
      end: '14:00',
      gateTime: '2026-01-16T14:00:00',
      gateStatus: true,
      bookingStatus: true,
      faceStatus: false,
    },
  ]);

  const totalBooking = 8450;
  const validated = 125;
  const notValidated = 100;

  const filteredMembers = members.filter((member) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.pt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Show Face Validation page if needed
  if (showFaceValidation && validationMember) {
    return (
      <FaceValidation 
        member={validationMember} 
        onBack={() => {
          setShowFaceValidation(false);
          setValidationMember(null);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-3 sm:p-4 md:p-5 lg:p-6 font-sans overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-lg shadow-sm mb-4 sm:mb-5 md:mb-6 gap-3 sm:gap-4 lg:gap-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-base sm:text-lg md:text-xl font-semibold text-[#1a1a1a] leading-tight">PT Conduct Dashboard</h1>
          <p className="m-0 text-xs sm:text-[13px] text-[#666] leading-tight">PT Conduct - A.R. Hakim</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full lg:w-auto">
          <div className="bg-[#f8f9fa] border border-[#e0e0e0] px-3 sm:px-4 md:px-4 py-2 sm:py-2 rounded-[20px] flex flex-row items-center justify-center gap-2 sm:gap-2 md:gap-3 shadow-sm">
            <span className="text-xs sm:text-[13px] font-medium text-[#666] whitespace-nowrap">{formatDate(currentDateTime)}</span>
            <span className="text-sm md:text-base text-[#ddd] font-light">|</span>
            <span className="font-semibold text-xs sm:text-sm text-[#3b82f6] tracking-wide whitespace-nowrap">{formatTime(currentDateTime)}</span>
          </div>
          <div className="flex-1 lg:flex-none min-w-0">
            <select className="w-full lg:w-auto px-3 sm:px-3 md:px-3.5 py-2 sm:py-2 border border-[#ddd] rounded-md text-xs sm:text-[13px] bg-white cursor-pointer text-[#333]">
              <option>PT Conduct - A.R. Hakim</option>
            </select>
          </div>
          <div className="flex-1 lg:flex-none min-w-0">
            <input 
              type="email" 
              value={userEmail} 
              readOnly 
              className="w-full lg:w-auto px-3 sm:px-3 md:px-3.5 py-2 sm:py-2 border border-[#ddd] rounded-md text-xs sm:text-[13px] bg-white text-[#333] truncate"
            />
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs sm:text-[13px] font-medium transition-colors flex-shrink-0"
              title="Logout"
            >
              Keluar
            </button>
          )}
          <button className="bg-transparent border-none text-xl cursor-pointer p-1.5 text-[#666] flex items-center justify-center w-8 h-8 rounded transition-colors hover:bg-[#f5f5f5] flex-shrink-0">
            <span className="block leading-none">⋯</span>
          </button>
        </div>
      </nav>

      {/* Summary Cards */}
      <div className="bg-white rounded-xl shadow-md mb-4 sm:mb-5 md:mb-6 flex flex-col lg:flex-row items-center p-0 overflow-hidden">
        <div className="flex-1 p-4 sm:p-5 md:p-6 flex items-center gap-3 sm:gap-3 md:gap-4 bg-transparent min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-transparent p-0">
            <img src={totalBookingIcon} alt="Total Booking" className="w-10 h-10 md:w-12 md:h-12 block" />
          </div>
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <p className="m-0 text-2xl md:text-[28px] font-bold text-[#1a1a1a] leading-tight">{totalBooking.toLocaleString('id-ID')}</p>
            <h3 className="m-0 text-xs md:text-[13px] text-[#666] font-medium leading-tight italic">Total Booking</h3>
          </div>
        </div>
        <div className="hidden lg:block w-px h-[50px] md:h-[60px] bg-[#e5e7eb] flex-shrink-0"></div>
        <div className="flex-1 p-4 sm:p-5 md:p-6 flex items-center gap-3 sm:gap-3 md:gap-4 bg-transparent min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-transparent p-0">
            <img src={validationIcon} alt="Validated" className="w-10 h-10 md:w-12 md:h-12 block" />
          </div>
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <p className="m-0 text-2xl md:text-[28px] font-bold text-[#1a1a1a] leading-tight">{validated}</p>
            <h3 className="m-0 text-xs md:text-[13px] text-[#666] font-medium leading-tight italic">Tervalidasi</h3>
          </div>
        </div>
        <div className="hidden lg:block w-px h-[50px] md:h-[60px] bg-[#e5e7eb] flex-shrink-0"></div>
        <div className="flex-1 p-4 sm:p-5 md:p-6 flex items-center gap-3 sm:gap-3 md:gap-4 bg-transparent min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-transparent p-0">
            <img src={notValidationIcon} alt="Not Validated" className="w-10 h-10 md:w-12 md:h-12 block" />
          </div>
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <p className="m-0 text-2xl md:text-[28px] font-bold text-[#1a1a1a] leading-tight">{notValidated}</p>
            <h3 className="m-0 text-xs md:text-[13px] text-[#666] font-medium leading-tight italic">Belum Tervalidasi</h3>
          </div>
        </div>
      </div>

      {/* Data Member Section */}
      <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl shadow-md overflow-hidden">
        <div className="mb-4 sm:mb-5 md:mb-6">
          <h2 className="m-0 mb-1 text-base sm:text-lg md:text-xl font-semibold text-[#1a1a1a]">Data Member</h2>
          <p className="m-0 text-xs sm:text-sm text-[#666]">Daftar member dan status booking</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6 flex-wrap items-stretch lg:items-center">
          <div className="relative flex-1 w-full md:w-auto min-w-0">
            <img src={searchIcon} alt="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Member or PT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 px-3 pl-10 border border-[#ddd] rounded-lg text-sm"
            />
          </div>
          <div className="relative flex items-center w-full md:w-auto min-w-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`w-full md:w-auto py-2.5 sm:py-3 px-3 pr-3 border border-[#ddd] rounded-lg text-sm bg-white appearance-none cursor-pointer [color-scheme:light] ${
                selectedDate ? 'text-[#333]' : 'text-transparent'
              }`}
            />
            {!selectedDate && (
              <span className="absolute left-3 text-sm text-[#959595] pointer-events-none select-none">Select Date</span>
            )}
          </div>
          <div className="flex gap-3 md:gap-5 flex-wrap items-center">
            <label className="flex items-center gap-2 cursor-pointer relative">
              <div className="relative w-[18px] h-[18px]">
                <input
                  type="checkbox"
                  checked={gateChecked}
                  onChange={(e) => setGateChecked(e.target.checked)}
                  className="w-[18px] h-[18px] cursor-pointer accent-[#3b82f6] opacity-0 absolute z-10"
                />
                {gateChecked && (
                  <img src={greenCheckIcon} alt="Checked" className="absolute top-0 left-0 w-[18px] h-[18px] pointer-events-none z-0" />
                )}
                {!gateChecked && (
                  <div className="absolute top-0 left-0 w-[18px] h-[18px] border border-[#ddd] rounded pointer-events-none"></div>
                )}
              </div>
              <span className="text-sm text-[#333]">Gate Checked</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer relative">
              <div className="relative w-[18px] h-[18px]">
                <input
                  type="checkbox"
                  checked={bookingChecked}
                  onChange={(e) => setBookingChecked(e.target.checked)}
                  className="w-[18px] h-[18px] cursor-pointer accent-[#3b82f6] opacity-0 absolute z-10"
                />
                {bookingChecked && (
                  <img src={greenCheckIcon} alt="Checked" className="absolute top-0 left-0 w-[18px] h-[18px] pointer-events-none z-0" />
                )}
                {!bookingChecked && (
                  <div className="absolute top-0 left-0 w-[18px] h-[18px] border border-[#ddd] rounded pointer-events-none"></div>
                )}
              </div>
              <span className="text-sm text-[#333]">Booking Checked</span>
            </label>
            <button 
              onClick={() => setIsSyncModalOpen(true)}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white border-none py-2 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors"
            >
              Sync
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full border-collapse text-xs md:text-sm min-w-[500px] xl:min-w-[800px]" style={{ tableLayout: 'auto' }}>
            <thead className="bg-[#f8f9fa]">
              <tr>
                <th className="p-2 md:p-2.5 lg:p-3 text-center font-semibold text-[#333] border-b-2 border-[#e5e7eb] w-10 md:w-12 text-xs md:text-sm">No</th>
                <th className="p-2 md:p-2.5 lg:p-3 text-left font-semibold text-[#333] border-b-2 border-[#e5e7eb] text-xs md:text-sm" style={{ width: '150px', maxWidth: '150px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>Member</th>
                <th className="p-2 md:p-2.5 lg:p-3 text-left font-semibold text-[#333] border-b-2 border-[#e5e7eb] text-xs md:text-sm" style={{ width: '120px', maxWidth: '120px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>PT</th>
                <th className="p-2 md:p-2.5 lg:p-3 text-left font-semibold text-[#333] border-b-2 border-[#e5e7eb] text-xs md:text-sm" style={{ width: '160px', maxWidth: '160px' }}>Start</th>
                <th className="hidden xl:table-cell p-2 md:p-2.5 lg:p-3 text-left font-semibold text-[#333] border-b-2 border-[#e5e7eb] text-xs md:text-sm w-16">End</th>
                <th className="hidden xl:table-cell p-2 md:p-2.5 lg:p-3 text-left font-semibold text-[#333] border-b-2 border-[#e5e7eb] text-xs md:text-sm" style={{ width: '160px', maxWidth: '160px' }}>Gate Time</th>
                <th className="hidden md:table-cell p-2 md:p-2.5 lg:p-3 text-left font-semibold text-[#333] border-b-2 border-[#e5e7eb] text-xs md:text-sm w-[110px]">Status</th>
                <th className="p-2 md:p-2.5 lg:p-3 text-center font-semibold text-[#333] border-b-2 border-[#e5e7eb] text-xs md:text-sm" style={{ width: '120px', minWidth: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentMembers.length > 0 ? (
                currentMembers.map((member, index) => (
                  <tr key={member.id} className="hover:bg-[#f9fafb]">
                    <td className="p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-center text-xs md:text-sm">{startIndex + index + 1}</td>
                  <td className="p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left text-xs md:text-sm" style={{ width: '150px', maxWidth: '150px', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{member.name}</td>
                  <td className="p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left text-xs md:text-sm" style={{ width: '120px', maxWidth: '120px', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{member.pt}</td>
                  <td className="p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left text-xs" style={{ width: '160px', maxWidth: '160px', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{formatDateTime(member.start)}</td>
                  <td className="hidden xl:table-cell p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left text-xs md:text-sm">{member.end}</td>
                  <td className="hidden xl:table-cell p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left text-xs" style={{ width: '160px', maxWidth: '160px', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{formatDateTime(member.gateTime)}</td>
                  <td className="hidden md:table-cell p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left w-[110px]">
                    <div className="flex flex-col gap-0.5 md:gap-1">
                      <span className="text-[11px] md:text-[12px] lg:text-[13px] flex items-center gap-1">
                        Gate: {member.gateStatus ? (
                          <img src={gateCheckIcon} alt="Checked" className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        ) : (
                          <img src={uncheckIcon} alt="Unchecked" className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        )}
                      </span>
                      <span className="text-[11px] md:text-[12px] lg:text-[13px] flex items-center gap-1">
                        Booking: {member.bookingStatus ? (
                          <img src={gateCheckIcon} alt="Checked" className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        ) : (
                          <img src={uncheckIcon} alt="Unchecked" className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        )}
                      </span>
                      <span className="text-[11px] md:text-[12px] lg:text-[13px] flex items-center gap-1">
                        Face: {member.faceStatus ? (
                          <img src={gateCheckIcon} alt="Checked" className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        ) : (
                          <img src={uncheckIcon} alt="Unchecked" className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-center align-top" style={{ width: '120px', minWidth: '120px' }}>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-1.5 md:gap-2">
                      <button 
                        onClick={() => {
                          setSelectedDetailMember(member);
                          setIsDetailModalOpen(true);
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white border-none py-1 md:py-1.5 lg:py-2 px-2 md:px-3 rounded-md text-[10px] md:text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1 whitespace-nowrap w-full md:w-auto"
                      >
                        Detail
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedMember(member);
                          setIsModalOpen(true);
                        }}
                        className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white border-none py-1 md:py-1.5 lg:py-2 px-2 md:px-3 lg:px-4 rounded-md text-[10px] md:text-xs lg:text-sm font-medium cursor-pointer transition-opacity hover:opacity-90 flex items-center justify-center gap-1 md:gap-1.5 lg:gap-2 whitespace-nowrap w-full md:w-auto"
                      >
                        <img src={validasiIcon} alt="Validasi" className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                        <span className="hidden sm:inline">Validasi</span>
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500 text-sm">
                    Tidak ada data yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredMembers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 sm:mt-6 pt-4 border-t border-[#e5e7eb]">
            <div className="text-sm text-gray-600">
              Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredMembers.length)} dari {filteredMembers.length} data
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-[#ddd] rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 min-w-[40px] border rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
                            : 'border-[#ddd] text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-[#ddd] rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pilih yang akan divalidasi</h3>
                <p className="text-sm text-gray-600 mt-1">Pilih Member atau Personal Trainer</p>
              </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-red-500 hover:bg-red-600 text-white transition-all rounded-full p-2 flex items-center justify-center w-10 h-10 flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Option 1: Member */}
              <button
                onClick={() => {
                  console.log('Validasi Member:', selectedMember.name);
                  setValidationMember(selectedMember);
                  setIsModalOpen(false);
                  setShowFaceValidation(true);
                }}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">Member</p>
                    <p className="text-sm text-gray-500">{selectedMember.name}</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Option 2: Personal Trainer */}
              <button
                onClick={() => {
                  console.log('Validasi Personal Trainer:', selectedMember.pt);
                  setValidationMember(selectedMember);
                  setIsModalOpen(false);
                  setShowFaceValidation(true);
                }}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">Personal Trainer</p>
                    <p className="text-sm text-gray-500">{selectedMember.pt}</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedDetailMember && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsDetailModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">Detail Member</h3>
                  <p className="text-sm text-blue-100 mt-1">Informasi lengkap booking</p>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="bg-red-500 hover:bg-red-600 text-white transition-all rounded-full p-2 flex items-center justify-center w-10 h-10 flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Member Info Card */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{selectedDetailMember.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">Personal Trainer: {selectedDetailMember.pt}</p>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">No</label>
                  <p className="text-base font-semibold text-gray-900 mt-2">{filteredMembers.findIndex(m => m.id === selectedDetailMember.id) + 1}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Member</label>
                  <p className="text-base font-semibold text-gray-900 mt-2 break-words">{selectedDetailMember.name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">PT</label>
                  <p className="text-base font-semibold text-gray-900 mt-2 break-words">{selectedDetailMember.pt}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start</label>
                  <p className="text-sm text-gray-900 mt-2 break-words">{formatDateTime(selectedDetailMember.start)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End</label>
                  <p className="text-sm text-gray-900 mt-2">{selectedDetailMember.end}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gate Time</label>
                  <p className="text-sm text-gray-900 mt-2 break-words">{formatDateTime(selectedDetailMember.gateTime)}</p>
                </div>
              </div>

              {/* Status Section */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${selectedDetailMember.gateStatus ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedDetailMember.gateStatus ? 'bg-green-100' : 'bg-red-100'}`}>
                      {selectedDetailMember.gateStatus ? (
                        <img src={gateCheckIcon} alt="Checked" className="w-5 h-5" />
                      ) : (
                        <img src={uncheckIcon} alt="Unchecked" className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">Gate</span>
                  </div>
                  <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${selectedDetailMember.bookingStatus ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedDetailMember.bookingStatus ? 'bg-green-100' : 'bg-red-100'}`}>
                      {selectedDetailMember.bookingStatus ? (
                        <img src={gateCheckIcon} alt="Checked" className="w-5 h-5" />
                      ) : (
                        <img src={uncheckIcon} alt="Unchecked" className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">Booking</span>
                  </div>
                  <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${selectedDetailMember.faceStatus ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedDetailMember.faceStatus ? 'bg-green-100' : 'bg-red-100'}`}>
                      {selectedDetailMember.faceStatus ? (
                        <img src={gateCheckIcon} alt="Checked" className="w-5 h-5" />
                      ) : (
                        <img src={uncheckIcon} alt="Unchecked" className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">Face</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSelectedMember(selectedDetailMember);
                    setIsDetailModalOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="w-full bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white border-none py-3.5 px-4 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:opacity-90 hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <img src={validasiIcon} alt="Validasi" className="w-4 h-4" />
                  Validasi Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsSyncModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] p-6 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-white leading-tight text-left">Sync Member</h3>
                <p className="text-sm text-blue-100 mt-1 leading-tight text-left">Masukkan Member ID untuk sinkronisasi</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Member ID
                </label>
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="Masukkan Member ID"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsSyncModalOpen(false);
                    setMemberId('');
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (memberId.trim()) {
                      console.log('Sync Member ID:', memberId);
                      // Add your sync logic here
                      setIsSyncModalOpen(false);
                      setMemberId('');
                    }
                  }}
                  disabled={!memberId.trim()}
                  className="flex-1 py-3 px-4 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
