import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
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
import FaceChecking from './FaceChecking';

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
  faceBookingMember?: number; // face_booking_member value (0 or 1)
  club?: string; // Optional club field for client-side filtering
}

interface Club {
  id: number;
  name: string;
}

interface DashboardProps {
  onLogout?: () => void;
  userEmail?: string;
  authToken?: string;
}

const Dashboard = ({ onLogout, userEmail = 'adit_sang_legenda@example.com', authToken = '' }: DashboardProps) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [gateChecked, setGateChecked] = useState(false);
  const [bookingChecked, setBookingChecked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPtQuery, setSearchPtQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailMember, setSelectedDetailMember] = useState<Member | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetchingBookings, setIsFetchingBookings] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<string>('');
  const [isSyncingToAPI, setIsSyncingToAPI] = useState(false);
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [showFaceValidation, setShowFaceValidation] = useState(false);
  const [validationMember, setValidationMember] = useState<Member | null>(null);
  const [showFaceChecking, setShowFaceChecking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [totalBooking, setTotalBooking] = useState(8450);
  const [validated, setValidated] = useState(125);
  const [notValidated, setNotValidated] = useState(100);
  const [searchDebounce, setSearchDebounce] = useState('');
  const [searchPtDebounce, setSearchPtDebounce] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

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

  // Fetch clubs from API
  const fetchClubs = async () => {
    if (!authToken) {
      console.warn('No auth token available for fetching clubs');
      return;
    }

    setIsLoadingClubs(true);
    try {
      const apiUrl = import.meta.env.VITE_API_PTCONDUCT || 'http://127.0.0.1:8088';
      const response = await fetch(`${apiUrl}/api/ptconduct/clubs`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different possible response structures
      let clubsData: Club[] = [];
      if (Array.isArray(data)) {
        clubsData = data.map((item: any) => ({
          id: item.id || item.club_id || 0,
          name: item.name || item.nama || item.club_name || String(item),
        }));
      } else if (data.ok && Array.isArray(data.data)) {
        clubsData = data.data.map((item: any) => ({
          id: item.id || item.club_id || 0,
          name: item.name || item.nama || item.club_name || String(item),
        }));
      } else if (data.clubs && Array.isArray(data.clubs)) {
        clubsData = data.clubs.map((item: any) => ({
          id: item.id || item.club_id || 0,
          name: item.name || item.nama || item.club_name || String(item),
        }));
      }

      console.log('=== CLUBS FETCHED ===');
      console.log('Total clubs:', clubsData.length);
      console.log('Club names:', clubsData.map(c => c.name));
      
      setClubs(clubsData);
      
      // Set "All Club" as default if no club is selected
      if (!selectedClub) {
        console.log('Setting default to: All Club');
        setSelectedClub('All Club');
        // Note: fetchDashboardData will be triggered by useEffect when selectedClub changes
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setIsLoadingClubs(false);
    }
  };

  // Fetch dashboard data from API with filters
  const fetchDashboardData = async () => {
    if (!authToken) {
      console.warn('No auth token available');
      return;
    }

    setIsLoadingData(true);
    setErrorMessage(''); // Clear previous error
    try {
      const apiUrl = import.meta.env.VITE_API_PTCONDUCT || 'http://127.0.0.1:8088';
      
      // Build query parameters manually to ensure proper encoding (%20 instead of +)
      const queryParams: string[] = [];
      
      // Filter by club (only if selectedClub is set and not "All Club")
      if (selectedClub && selectedClub !== 'All Club') {
        // Use encodeURIComponent to ensure spaces are encoded as %20, not +
        queryParams.push(`club=${encodeURIComponent(selectedClub)}`);
        console.log('Fetching dashboard data with club filter:', selectedClub);
      } else {
        console.log('Fetching dashboard data without club filter (All Club)');
      }
      
      // Filter by date
      if (selectedDate) {
        queryParams.push(`start_date=${encodeURIComponent(selectedDate)}`);
      }
      
      // Filter by member name (from search query with debounce)
      if (searchDebounce.trim()) {
        queryParams.push(`nama_member=${encodeURIComponent(searchDebounce.trim())}`);
      }
      
      // Filter by PT name (from PT search query with debounce)
      if (searchPtDebounce.trim()) {
        const ptFilter = searchPtDebounce.trim();
        queryParams.push(`nama_pt=${encodeURIComponent(ptFilter)}`);
        console.log('PT Filter - Original:', ptFilter);
        console.log('PT Filter - Encoded:', encodeURIComponent(ptFilter));
      }
      
      // Filter by gate status
      if (gateChecked) {
        queryParams.push('gate=1');
      }
      
      // Filter by booking status
      if (bookingChecked) {
        queryParams.push('booking=1');
      }
      
      const queryString = queryParams.join('&');
      const dashboardEndpoint = `${apiUrl}/api/ptconduct/dashboard${queryString ? `?${queryString}` : ''}`;
      
      console.log('=== FETCHING DASHBOARD DATA ===');
      console.log('API Endpoint:', `${apiUrl}/api/ptconduct/dashboard`);
      console.log('Full API URL:', dashboardEndpoint);
      console.log('Query string:', queryString);
      console.log('Authorization Header:', `Bearer ${authToken.substring(0, 20)}...`);
      console.log('Selected club for filter:', selectedClub);
      console.log('Available clubs list:', clubs.map(c => ({ id: c.id, name: c.name })));
      console.log('Is selected club in available clubs?', clubs.some(c => c.name === selectedClub));

      const response = await fetch(dashboardEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.error('=== 404 ERROR ===');
          console.error('Club not found:', selectedClub);
          console.error('Available clubs:', clubs.map(c => c.name));
          console.error('Request URL:', dashboardEndpoint);
          console.error('Is selected club in available clubs?', clubs.some(c => c.name === selectedClub));
          throw new Error(`Club "${selectedClub}" tidak ditemukan di server. Status: ${response.status}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('=== API RESPONSE ===');
      console.log('Response club:', data.club);
      console.log('Response statistics:', data.statistics);
      console.log('Data count:', data.data?.length || 0);
      
      // Map API response to Member interface based on actual API structure
      // Response structure: { ok: true, data: [...], club: "Stride - Cibinong", count: 1, role_id: 1, statistics: {...} }
      if (data.ok && Array.isArray(data.data) && data.data.length > 0) {
        const mappedMembers: Member[] = data.data.map((item: any, index: number) => ({
          id: item.id || index + 1,
          name: item.nama_member || '',
          pt: item.nama_pt || '',
          start: item.start_time || '',
          end: item.end_time || '',
          gateTime: item.gate_time || '',
          // gateStatus: true if gate === 1, false if gate === 0
          gateStatus: item.gate === 1,
          // bookingStatus: true if booking === 1, false if booking === 0
          bookingStatus: item.booking === 1,
          // faceStatus: true if both face_booking_member === 1 AND face_booking_pt === 1
          faceStatus: item.face_booking_member === 1 && item.face_booking_pt === 1,
          // Store face_booking_member value
          faceBookingMember: item.face_booking_member || 0,
          // Store club info
          club: item.club || data.club || '',
        }));
        
        setMembers(mappedMembers);
        
        // Use statistics from API response if available (more accurate, already filtered by club)
        if (data.statistics) {
          console.log('Using statistics from API:', data.statistics);
          setTotalBooking(data.statistics.total_booking || 0);
          setValidated(data.statistics.tervalidasi || 0);
          setNotValidated(data.statistics.belum_tervalidasi || 0);
        } else {
          console.log('Statistics not available in API response, calculating from data');
          // Fallback: Calculate from mapped data if statistics not available
          const validatedCount = mappedMembers.filter(m => m.faceStatus).length;
          const notValidatedCount = mappedMembers.filter(m => !m.faceStatus).length;
          setTotalBooking(mappedMembers.length);
          setValidated(validatedCount);
          setNotValidated(notValidatedCount);
        }
      } else if (data.ok && Array.isArray(data.data) && data.data.length === 0) {
        // Empty data
        setMembers([]);
        // Use statistics from API if available, otherwise set to 0
        if (data.statistics) {
          setTotalBooking(data.statistics.total_booking || 0);
          setValidated(data.statistics.tervalidasi || 0);
          setNotValidated(data.statistics.belum_tervalidasi || 0);
        } else {
          setTotalBooking(0);
          setValidated(0);
          setNotValidated(0);
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data';
      setErrorMessage(errorMsg);
      
      // Clear data on error to avoid showing stale data
      setMembers([]);
      setTotalBooking(0);
      setValidated(0);
      setNotValidated(0);
      
      // Clear error message after 5 seconds
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce PT search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchPtDebounce(searchPtQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchPtQuery]);

  // Fetch clubs when component mounts or token changes
  useEffect(() => {
    if (authToken) {
      fetchClubs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  // Fetch data when component mounts, token changes, or filters change
  useEffect(() => {
    if (!authToken) return;
    
    // Always fetch when filters change, including club change
    console.log('=== FETCH DASHBOARD DATA TRIGGERED ===');
    console.log('Selected club:', selectedClub);
    console.log('Selected date:', selectedDate);
    console.log('Search query (member):', searchDebounce);
    console.log('Search query (PT):', searchPtDebounce);
    console.log('Gate checked:', gateChecked);
    console.log('Booking checked:', bookingChecked);
    
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, selectedDate, searchDebounce, searchPtDebounce, gateChecked, bookingChecked, selectedClub]);

  // Filtering is now done on the backend via API
  // No need for client-side filtering since API handles it
  const filteredMembers = members;

  // Pagination calculations
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchDebounce, searchPtDebounce, selectedDate, gateChecked, bookingChecked, selectedClub]);

  // Function to handle sync with member ID (button biru)
  const handleSyncWithMemberId = async () => {
    if (!memberId.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please enter Member ID',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsFetchingBookings(true);
    try {
      // Step 1: Login to get token
      const loginResponse = await fetch('https://services.ftlhorizon.com/api/gymmaster/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: memberId.trim()
        })
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || `Login failed! status: ${loginResponse.status}`);
      }

      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
      
      // Try different possible token field names and structures
      let token = null;
      
      // Check various possible structures
      if (typeof loginData === 'string') {
        // If response is directly a token string
        token = loginData;
      } else if (loginData.data?.token) {
        // Most likely: token is inside data object
        token = loginData.data.token;
      } else if (loginData.data && typeof loginData.data === 'string') {
        // If data itself is the token
        token = loginData.data;
      } else if (loginData.token) {
        token = loginData.token;
      } else if (loginData.access_token) {
        token = loginData.access_token;
      } else if (loginData.accessToken) {
        token = loginData.accessToken;
      } else if (loginData.result?.token) {
        token = loginData.result.token;
      } else if (loginData.response?.token) {
        token = loginData.response.token;
      } else if (loginData.data && typeof loginData.data === 'object') {
        // If data is an object, try to find token inside it
        const dataObj = loginData.data;
        token = dataObj.token || dataObj.access_token || dataObj.accessToken || 
                dataObj.session_token || dataObj.sessionToken || dataObj.auth_token || dataObj.authToken;
      }
      
      if (!token) {
        console.error('Login response structure:', loginData);
        Swal.fire({
          icon: 'error',
          title: 'Token Not Found',
          html: `
            <p>Token tidak ditemukan dalam response login.</p>
            <p style="margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280;">Status: ${loginData.status ? 'Success' : 'Failed'}</p>
            <p style="font-size: 0.875rem; color: #6b7280;">Message: ${loginData.message || 'N/A'}</p>
            <details style="margin-top: 1rem; text-align: left;">
              <summary style="cursor: pointer; font-weight: bold; color: #3b82f6;">Lihat Response Lengkap</summary>
              <pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-top: 0.5rem; font-size: 0.75rem; max-height: 300px; overflow-y: auto;">${JSON.stringify(loginData, null, 2)}</pre>
            </details>
          `,
          confirmButtonColor: '#ef4444',
          width: '600px',
        });
        return;
      }
      
      console.log('Token extracted:', token.substring(0, 50) + '...');

      // Step 2: Fetch past bookings using token
      const bookingsResponse = await fetch(`https://services.ftlhorizon.com/api/gymmaster/booking/pastbookings?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!bookingsResponse.ok) {
        const errorData = await bookingsResponse.json().catch(() => ({ message: 'Failed to fetch bookings' }));
        throw new Error(errorData.message || `Failed to fetch bookings! status: ${bookingsResponse.status}`);
      }

      const bookingsData = await bookingsResponse.json();
      
      // Step 3: Fetch member profile using token
      const profileResponse = await fetch(`https://services.ftlhorizon.com/api/gymmaster/member/profile?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      let profileData = null;
      if (profileResponse.ok) {
        profileData = await profileResponse.json();
        console.log('Member profile response:', profileData);
      } else {
        console.warn('Failed to fetch member profile:', profileResponse.status);
      }
      
      // Store booking data and member profile, then show modal
      setBookingData(bookingsData);
      setMemberProfile(profileData);
      setCurrentMemberId(memberId.trim());
      setIsSyncModalOpen(false);
      setShowBookingModal(true);
      setMemberId('');
      
    } catch (error) {
      console.error('Error syncing with member ID:', error);
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat sync';
      Swal.fire({
        icon: 'error',
        title: 'Sync Gagal',
        text: errorMsg,
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsFetchingBookings(false);
    }
  };

  // Function to sync booking data to ptconduct API
  const handleSyncToAPI = async () => {
    if (!authToken) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No auth token available',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    if (!bookingData) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'No booking data to sync',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsSyncingToAPI(true);
    try {
      // Get member name from profile (FULLNAME is the correct field for nama_member)
      // Check various possible structures for full_name
      let memberName = 'N/A';
      if (memberProfile) {
        // Try different possible paths for full_name
        memberName = memberProfile?.data?.FULLNAME || 
                    memberProfile?.data?.full_name || 
                    memberProfile?.data?.fullname ||
                    memberProfile?.FULLNAME ||
                    memberProfile?.full_name ||
                    memberProfile?.fullname ||
                    memberProfile?.data?.name || 
                    memberProfile?.name || 
                    'N/A';
      }
      
      const memberEmail = memberProfile?.data?.email || memberProfile?.email || '';
      
      console.log('=== MEMBER PROFILE DEBUG ===');
      console.log('Full memberProfile object:', memberProfile);
      console.log('memberProfile.data:', memberProfile?.data);
      console.log('memberProfile.data.FULLNAME:', memberProfile?.data?.FULLNAME);
      console.log('memberProfile.data.full_name:', memberProfile?.data?.full_name);
      console.log('Extracted memberName:', memberName);
      
      // Extract bookings array from bookingData
      let bookingsArray = null;
      if (Array.isArray(bookingData)) {
        bookingsArray = bookingData;
      } else if (bookingData?.result && Array.isArray(bookingData.result)) {
        bookingsArray = bookingData.result;
      } else if (bookingData?.data && Array.isArray(bookingData.data)) {
        bookingsArray = bookingData.data;
      } else if (bookingData?.bookings && Array.isArray(bookingData.bookings)) {
        bookingsArray = bookingData.bookings;
      }

      // Validate memberName before mapping
      if (!memberName || memberName === 'N/A') {
        Swal.fire({
          icon: 'error',
          title: 'Member Name Not Found',
          html: `
            <p>Nama member tidak ditemukan dari profile.</p>
            <p style="margin-top: 0.5rem; font-size: 0.875rem;">Member Profile:</p>
            <pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-top: 0.5rem; font-size: 0.75rem; max-height: 200px; overflow-y: auto;">${JSON.stringify(memberProfile, null, 2)}</pre>
          `,
          confirmButtonColor: '#ef4444',
          width: '600px',
        });
        setIsSyncingToAPI(false);
        return;
      }

      // Map bookings to include correct nama_member and keep name field (for nama_pt)
      // IMPORTANT: 
      // - Field "name" in booking data is the PT/trainer name (keep it for backend)
      // - Field "nama_member" must be added from member profile (FULLNAME)
      // - Backend will use "name" for nama_pt and "nama_member" for nama_member
      const mappedBookings = (bookingsArray || []).map((booking: any) => {
        // Field "name" in booking data is the PT/trainer name - keep it as is
        const ptName = booking.name || booking.location || booking.trainer_name || booking.trainer || booking.trainerName || 'N/A';
        
        console.log(`=== BOOKING ${booking.id} MAPPING ===`);
        console.log('Original booking.name (PT name):', booking.name);
        console.log('Member name (from profile FULLNAME):', memberName);
        console.log('Will add nama_member:', memberName);
        console.log('Will keep name (for nama_pt):', booking.name);
        
        // Create new booking object with nama_member added
        // Keep all original fields including "name" (which is PT name)
        // Add nama_member from profile
        const mappedBooking = {
          ...booking,
          // CRITICAL: nama_member from profile (FULLNAME) - this is the MEMBER's full name
          // Backend will use this field for nama_member column in database
          nama_member: memberName, // From member profile FULLNAME
          // Field "name" is kept as is - backend will use this for nama_pt column
        };
        
        // Validate that nama_member is not null/empty and different from name (PT name)
        if (!mappedBooking.nama_member || mappedBooking.nama_member === 'N/A') {
          console.error(`❌ ERROR: Booking ${booking.id} has invalid nama_member!`);
          console.error('  nama_member:', mappedBooking.nama_member);
          console.error('  memberName from profile:', memberName);
        }
        
        if (mappedBooking.nama_member === mappedBooking.name) {
          console.error(`❌ ERROR: Booking ${booking.id} has sama nama_member dan name (PT name)!`);
          console.error('  nama_member:', mappedBooking.nama_member);
          console.error('  name (PT):', mappedBooking.name);
          console.error('  memberName from profile:', memberName);
        } else {
          console.log(`✅ Booking ${booking.id} mapping correct:`);
          console.log(`   nama_member: "${mappedBooking.nama_member}" (from profile)`);
          console.log(`   name (PT): "${mappedBooking.name}" (from booking data)`);
        }
        
        return mappedBooking;
      });

      // Verify all bookings have nama_member before sending
      const invalidBookings = mappedBookings.filter((b: any) => !b.nama_member || b.nama_member === 'N/A');
      if (invalidBookings.length > 0) {
        console.error('❌ Some bookings have invalid nama_member:', invalidBookings);
        Swal.fire({
          icon: 'error',
          title: 'Invalid Data',
          text: `${invalidBookings.length} booking(s) tidak memiliki nama_member yang valid. Pastikan member profile sudah di-fetch dengan benar.`,
          confirmButtonColor: '#ef4444',
        });
        setIsSyncingToAPI(false);
        return;
      }

      // Prepare sync payload with correct member and PT names
      // IMPORTANT FOR BACKEND: 
      // - Use 'nama_member' field from each booking object in 'result' array (this is from member profile FULLNAME)
      // - Use 'nama_pt' field from each booking object in 'result' array (this is from booking.name/location)
      // - DO NOT use 'name' field from booking data for nama_member (it's the PT name, not member name)
      // - Field 'nama_member' is REQUIRED and must NOT be NULL
      const syncPayload = {
        error: bookingData.error || null,
        result: mappedBookings.map((b: any) => ({
          ...b,
          // Ensure nama_member is explicitly set and not null
          nama_member: b.nama_member || memberName, // Fallback to memberName if somehow missing
        })),
        member_name: memberName, // This is the member's full name from profile (FULLNAME)
        member_email: memberEmail,
        member_id: currentMemberId,
      };

      console.log('=== SYNC PAYLOAD DEBUG ===');
      console.log('Member name (from profile FULLNAME):', memberName);
      console.log('Number of bookings:', mappedBookings.length);
      console.log('First booking details:');
      console.log('  - id:', mappedBookings[0]?.id);
      console.log('  - nama_member:', mappedBookings[0]?.nama_member, '(from profile)');
      console.log('  - nama_pt:', mappedBookings[0]?.nama_pt, '(from booking data)');
      console.log('  - original booking.name:', mappedBookings[0]?.original_booking_name, '(PT name, should NOT be used for nama_member)');
      console.log('Are nama_member and nama_pt different?', mappedBookings[0]?.nama_member !== mappedBookings[0]?.nama_pt);
      
      // Verify all bookings have correct nama_member
      let hasError = false;
      mappedBookings.forEach((booking: any, index: number) => {
        if (booking.nama_member === booking.nama_pt) {
          console.error(`❌ ERROR: Booking ${index} (ID: ${booking.id}) has sama nama_member dan nama_pt: "${booking.nama_member}"`);
          hasError = true;
        }
        if (booking.nama_member === booking.original_booking_name) {
          console.error(`❌ ERROR: Booking ${index} (ID: ${booking.id}) nama_member sama dengan original booking.name!`);
          console.error('  This means backend might be using wrong field!');
          hasError = true;
        }
      });
      
      if (hasError) {
        console.error('⚠️ WARNING: Some bookings have incorrect mapping! Check the payload before sending.');
      } else {
        console.log('✅ All bookings have correct mapping!');
      }
      
      console.log('Full sync payload (first 2 bookings):', JSON.stringify({
        ...syncPayload,
        result: syncPayload.result.slice(0, 2) // Show only first 2 for readability
      }, null, 2));

      const apiUrl = import.meta.env.VITE_API_PTCONDUCT || 'http://127.0.0.1:8088';
      const response = await fetch(`${apiUrl}/api/ptconduct/sync-gymmaster`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Sync to API response:', data);
      
      // Refresh dashboard data after successful sync
      if (authToken) {
        await fetchDashboardData();
      }
      
      // Show success alert
      Swal.fire({
        icon: 'success',
        title: 'Sync Berhasil!',
        text: 'Data booking berhasil di-sync ke sistem',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'OK',
      });
    } catch (error) {
      console.error('Error syncing to API:', error);
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat sync';
      Swal.fire({
        icon: 'error',
        title: 'Sync Gagal',
        text: errorMsg,
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsSyncingToAPI(false);
    }
  };

  // Function to handle sync API call (button hijau)
  const handleSyncAPI = async () => {
    if (!authToken) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No auth token available',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    setIsSyncing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_PTCONDUCT || 'http://127.0.0.1:8088';
      const response = await fetch(`${apiUrl}/api/ptconduct/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Sync API response:', data);
      
      // Refresh dashboard data after successful sync
      if (authToken) {
        await fetchDashboardData();
      }
      
      // Show success alert with inserted count
      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Sync Berhasil!',
          html: `
            <div style="text-align: left; margin-top: 1rem;">
              <p style="margin: 0.5rem 0;"><strong>Inserted:</strong> ${data.inserted || 0}</p>
              <p style="margin: 0.5rem 0;"><strong>Skipped:</strong> ${data.skipped || 0}</p>
              <p style="margin: 0.5rem 0;"><strong>Total Processed:</strong> ${data.total_processed || 0}</p>
            </div>
          `,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'OK',
        });
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      const errorMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat sync';
      Swal.fire({
        icon: 'error',
        title: 'Sync Gagal',
        text: errorMsg,
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Show Face Checking page if needed
  if (showFaceChecking) {
    return (
      <FaceChecking 
        onBack={() => {
          setShowFaceChecking(false);
        }}
        authToken={authToken}
      />
    );
  }

  // Show Face Validation page if needed
  if (showFaceValidation && validationMember) {
    return (
      <FaceValidation 
        member={validationMember} 
        onBack={() => {
          setShowFaceValidation(false);
          setValidationMember(null);
          // Refresh dashboard data when going back
          if (authToken) {
            fetchDashboardData();
          }
        }}
        authToken={authToken}
        userEmail={userEmail}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-3 sm:p-4 md:p-5 lg:p-6 font-sans overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-lg shadow-sm mb-4 sm:mb-5 md:mb-6 gap-3 sm:gap-4 md:gap-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 text-base sm:text-lg md:text-xl font-semibold text-[#1a1a1a] leading-tight">PT Conduct Dashboard</h1>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="bg-[#f8f9fa] border border-[#e0e0e0] px-3 sm:px-4 md:px-4 py-2 sm:py-2 rounded-[20px] flex flex-row items-center justify-center gap-2 sm:gap-2 md:gap-3 shadow-sm flex-shrink-0">
            <span className="text-xs sm:text-[13px] font-medium text-[#666] whitespace-nowrap">{formatDate(currentDateTime)}</span>
            <span className="text-sm md:text-base text-[#ddd] font-light">|</span>
            <span className="font-semibold text-xs sm:text-sm text-[#3b82f6] tracking-wide whitespace-nowrap">{formatTime(currentDateTime)}</span>
          </div>
          <div className="w-full md:w-auto md:min-w-[180px]">
            <select 
              value={selectedClub}
              onChange={(e) => {
                const newClub = e.target.value;
                console.log('=== CLUB CHANGED ===');
                console.log('Previous club:', selectedClub);
                console.log('New club:', newClub);
                setSelectedClub(newClub);
                // Reset to page 1 when club changes
                setCurrentPage(1);
                // Force immediate fetch (though useEffect should handle this)
                if (authToken) {
                  console.log('Triggering immediate fetch after club change');
                }
              }}
              disabled={isLoadingClubs || clubs.length === 0}
              className="w-full md:w-auto md:min-w-[180px] px-3 sm:px-3 md:px-3.5 py-2 sm:py-2 border border-[#ddd] rounded-md text-xs sm:text-[13px] bg-white cursor-pointer text-[#333] disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {isLoadingClubs ? (
                <option>Memuat club...</option>
              ) : clubs.length === 0 ? (
                <option>Tidak ada club</option>
              ) : (
                <>
                  <option value="All Club">All Club</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.name}>
                      {club.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="w-full md:w-auto md:min-w-[200px]">
            <input 
              type="email" 
              value={userEmail} 
              readOnly 
              className="w-full md:w-auto md:min-w-[200px] px-3 sm:px-3 md:px-3.5 py-2 sm:py-2 border border-[#ddd] rounded-md text-xs sm:text-[13px] bg-white text-[#333] truncate"
            />
          </div>
          <div className="flex flex-row gap-2 md:gap-3">
            <button 
              onClick={() => setShowFaceChecking(true)}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-[13px] font-semibold transition-all duration-300 flex-shrink-0 whitespace-nowrap shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
              title="Face Checking"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Face Checking
            </button>
            {onLogout && (
              <button 
                onClick={onLogout}
                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs sm:text-[13px] font-semibold transition-all duration-300 flex-shrink-0 whitespace-nowrap shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Error Message */}
      {errorMessage && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

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
              placeholder="Search Member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 px-3 pl-10 border border-[#ddd] rounded-lg text-sm"
            />
          </div>
          <div className="relative flex-1 w-full md:w-auto min-w-0">
            <img src={searchIcon} alt="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search PT..."
              value={searchPtQuery}
              onChange={(e) => setSearchPtQuery(e.target.value)}
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
              className="bg-blue-600 hover:bg-blue-700 text-white border-none py-2.5 px-5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync
            </button>
            <button 
              onClick={handleSyncAPI}
              disabled={isSyncing}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white border-none py-2.5 px-5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none flex items-center gap-2"
            >
              {isSyncing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingData && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6] mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Memuat data...</p>
            </div>
          </div>
        )}

        {/* Data Table */}
        {!isLoadingData && (
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
                  <td className="p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left text-xs md:text-sm" style={{ width: '150px', maxWidth: '150px', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{member.name}</span>
                      {member.faceBookingMember === 1 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] md:text-[11px] font-semibold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 shadow-sm">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Validated</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left text-xs md:text-sm" style={{ width: '120px', maxWidth: '120px', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{member.pt}</td>
                  <td className="p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left text-xs" style={{ width: '160px', maxWidth: '160px', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{formatDateTime(member.start)}</td>
                  <td className="hidden xl:table-cell p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left text-xs md:text-sm">{member.end}</td>
                  <td className="hidden xl:table-cell p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left text-xs" style={{ width: '160px', maxWidth: '160px', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{formatDateTime(member.gateTime)}</td>
                  <td className="hidden md:table-cell p-2 md:p-2.5 lg:p-3 border-b border-[#e5e7eb] text-[#333] text-left w-[110px]">
                    <div className="flex flex-col gap-0.5 md:gap-1">
                      <span className="text-[11px] md:text-[12px] lg:text-[13px] flex items-center gap-1">
                        Gate: {member.gateStatus && member.gateTime ? (
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
                        className="bg-slate-600 hover:bg-slate-700 text-white border-none py-1.5 md:py-2 lg:py-2.5 px-3 md:px-4 rounded-lg text-[10px] md:text-xs font-semibold cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5 whitespace-nowrap w-full md:w-auto"
                      >
                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Detail
                      </button>
                      {member.gateStatus && member.gateTime && member.bookingStatus && (
                        <button 
                          onClick={() => {
                            setSelectedMember(member);
                            setIsModalOpen(true);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white border-none py-1.5 md:py-2 lg:py-2.5 px-3 md:px-4 lg:px-5 rounded-lg text-[10px] md:text-xs lg:text-sm font-semibold cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap w-full md:w-auto"
                        >
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="hidden sm:inline">Validation</span>
                        </button>
                      )}
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
        )}

        {/* Pagination */}
        {!isLoadingData && filteredMembers.length > 0 && (
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
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Club</label>
                  <p className="text-base font-semibold text-gray-900 mt-2 break-words">{selectedDetailMember.club || 'N/A'}</p>
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
                  <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${selectedDetailMember.gateStatus && selectedDetailMember.gateTime ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedDetailMember.gateStatus && selectedDetailMember.gateTime ? 'bg-green-100' : 'bg-red-100'}`}>
                      {selectedDetailMember.gateStatus && selectedDetailMember.gateTime ? (
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
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-none py-3.5 px-4 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Validation Member
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
                  onClick={handleSyncWithMemberId}
                  disabled={!memberId.trim() || isFetchingBookings}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isFetchingBookings ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Fetching...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Data Modal */}
      {showBookingModal && bookingData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBookingModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white">Booking Data</h3>
                  <p className="text-sm text-blue-100 mt-1">Member ID: {currentMemberId || 'N/A'}</p>
                  {memberProfile && (
                    <button
                      onClick={() => setShowMemberProfile(!showMemberProfile)}
                      className="mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {showMemberProfile ? 'Sembunyikan' : 'Tampilkan'} Profil Member
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingData(null);
                    setMemberProfile(null);
                    setShowMemberProfile(false);
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Member Profile Section */}
              {showMemberProfile && memberProfile && (
                <div className="mb-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200 shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {(() => {
                        const name = memberProfile?.data?.FULLNAME || 
                                    memberProfile?.data?.full_name || 
                                    memberProfile?.data?.fullname ||
                                    memberProfile?.FULLNAME ||
                                    memberProfile?.full_name ||
                                    memberProfile?.data?.name || 
                                    memberProfile?.name || 
                                    'M';
                        return name.charAt(0).toUpperCase();
                      })()}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900">
                        {memberProfile?.data?.FULLNAME || 
                         memberProfile?.data?.full_name || 
                         memberProfile?.data?.fullname ||
                         memberProfile?.FULLNAME ||
                         memberProfile?.full_name ||
                         memberProfile?.data?.name || 
                         memberProfile?.name || 
                         'N/A'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {memberProfile?.data?.email || memberProfile?.email || 'Email tidak tersedia'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {Object.entries(memberProfile?.data || memberProfile || {}).map(([key, value]: [string, any]) => {
                      // Skip internal fields
                      if (key === 'name' || key === 'email' || key === 'full_name' || 
                          (typeof value === 'object' && value !== null && !Array.isArray(value))) {
                        return null;
                      }
                      return (
                        <div key={key} className="bg-white/70 rounded-lg p-3 border border-purple-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-medium text-gray-900 break-words">
                            {typeof value === 'object' && value !== null 
                              ? JSON.stringify(value)
                              : String(value || 'N/A')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(() => {
                // Handle different response structures
                let bookingsArray = null;
                
                if (Array.isArray(bookingData)) {
                  // If response is directly an array
                  bookingsArray = bookingData;
                } else if (bookingData?.result && Array.isArray(bookingData.result)) {
                  // If response has result field with array
                  bookingsArray = bookingData.result;
                } else if (bookingData?.data && Array.isArray(bookingData.data)) {
                  // If response has data field with array
                  bookingsArray = bookingData.data;
                } else if (bookingData?.bookings && Array.isArray(bookingData.bookings)) {
                  // If response has bookings field with array
                  bookingsArray = bookingData.bookings;
                }
                
                return (
                  <>
                    {bookingsArray && bookingsArray.length > 0 ? (
                      <div className="space-y-4">
                        {bookingsArray.map((booking: any, index: number) => (
                          <div key={index} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.entries(booking).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex flex-col">
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    {key.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 break-words">
                                    {typeof value === 'object' && value !== null 
                                      ? JSON.stringify(value, null, 2)
                                      : String(value || 'N/A')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No booking data found</p>
                        <p className="text-gray-400 text-sm mt-2">The response is empty or not in expected format</p>
                      </div>
                    )}
                    
                    {/* Raw JSON View (Collapsible) */}
                    <details className="mt-6">
                      <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors mb-2">
                        View Raw JSON
                      </summary>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
                        {JSON.stringify(bookingData, null, 2)}
                      </pre>
                    </details>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center gap-3">
              <button
                onClick={handleSyncToAPI}
                disabled={isSyncingToAPI || !bookingData}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              >
                {isSyncingToAPI ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync to API
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingData(null);
                }}
                className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
