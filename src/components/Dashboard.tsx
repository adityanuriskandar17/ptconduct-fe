import { useState, useEffect } from 'react';
import './Dashboard.css';

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

const Dashboard = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [gateChecked, setGateChecked] = useState(true);
  const [bookingChecked, setBookingChecked] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

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

  return (
    <div className="dashboard">
      {/* Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="nav-left">
          <h1 className="dashboard-title">PT Conduct Dashboard</h1>
          <p className="dashboard-subtitle">PT Conduct - A.R. Hakim</p>
        </div>
        <div className="nav-right">
          <div className="date-time-pill">
            <span className="date-text">{formatDate(currentDateTime)}</span>
            <span className="separator">|</span>
            <span className="time-text">{formatTime(currentDateTime)}</span>
          </div>
          <div className="user-dropdown">
            <select className="user-select">
              <option>PT Conduct - A.R. Hakim</option>
            </select>
          </div>
          <div className="email-field">
            <input 
              type="email" 
              value="adit_sang_legenda@example.com" 
              readOnly 
              className="email-input"
            />
          </div>
          <button className="menu-button">
            <span className="three-dots">⋯</span>
          </button>
        </div>
      </nav>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon members-icon">👥</div>
          <div className="card-content">
            <h3 className="card-label">Total Booking</h3>
            <p className="card-value">{totalBooking.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="summary-card validated">
          <div className="card-icon validated-icon">✓</div>
          <div className="card-content">
            <h3 className="card-label">Tervalidasi</h3>
            <p className="card-value">{validated}</p>
          </div>
        </div>
        <div className="summary-card not-validated">
          <div className="card-icon not-validated-icon">✗</div>
          <div className="card-content">
            <h3 className="card-label">Belum Tervalidasi</h3>
            <p className="card-value">{notValidated}</p>
          </div>
        </div>
      </div>

      {/* Data Member Section */}
      <div className="data-member-section">
        <div className="section-header">
          <h2 className="section-title">Data Member</h2>
          <p className="section-subtitle">Daftar member dan status booking</p>
        </div>

        <div className="filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search Member or PT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="date-selector">
            <span className="calendar-icon">📅</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={gateChecked}
                onChange={(e) => setGateChecked(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-text">Gate Checked</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={bookingChecked}
                onChange={(e) => setBookingChecked(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-text">Booking Checked</span>
            </label>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Member</th>
                <th>PT</th>
                <th>Start</th>
                <th>End</th>
                <th>Gate Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => (
                <tr key={member.id}>
                  <td>{index + 1}</td>
                  <td>{member.name}</td>
                  <td>{member.pt}</td>
                  <td>{formatDateTime(member.start)}</td>
                  <td>{member.end}</td>
                  <td>{formatDateTime(member.gateTime)}</td>
                  <td>
                    <div className="status-group">
                      <span className="status-item">
                        Gate: {member.gateStatus ? '✓' : '✗'}
                      </span>
                      <span className="status-item">
                        Booking: {member.bookingStatus ? '✓' : '✗'}
                      </span>
                      <span className="status-item">
                        Face: {member.faceStatus ? '✓' : '✗'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button className="validate-button">Validasi</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
