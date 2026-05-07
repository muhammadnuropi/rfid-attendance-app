import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, ListChecks, CalendarDays, LogOut, MapPin, Clock, User, ChevronDown, Menu } from 'lucide-react';

const Layout = () => {
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        // Close sidebar on route change
        setIsSidebarOpen(false);
    }, [location]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-container">
            <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
            <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h1 style={{ fontSize: '1.2rem' }}>Sistem Absensi Makan</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                        Pondok Pesantren Fauzan
                    </p>
                </div>
                <div className="nav-links">
                    <NavLink to="/dashboard" end className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </NavLink>
                    <NavLink to="/dashboard/master-data" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                        <Users size={20} />
                        Master Santri
                    </NavLink>
                    <NavLink to="/dashboard/master-places" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                        <MapPin size={20} />
                        Tempat Pengambilan
                    </NavLink>
                    <NavLink to="/dashboard/manual-attendance" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                        <ListChecks size={20} />
                        Absensi Manual
                    </NavLink>
                    <NavLink to="/dashboard/history" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                        <Clock size={20} />
                        Riwayat Harian
                    </NavLink>
                    <NavLink to="/dashboard/recap" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                        <CalendarDays size={20} />
                        Rekap Bulanan
                    </NavLink>
                    <NavLink to="/dashboard/profile" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                        <User size={20} />
                        Manajemen Akun
                    </NavLink>
                </div>
            </div>
            <div className="main-content" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                {/* Top Bar */}
                <div className="top-bar">
                    <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                    <div className="profile-wrapper" ref={dropdownRef}>
                        <div className="profile-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            {user?.profile_photo ? (
                                <img src={user.profile_photo} alt="Profile" className="avatar" />
                            ) : (
                                <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)' }}>
                                    <User size={20} color="white" />
                                </div>
                            )}
                            <div className="profile-info">
                                <span className="profile-name">{user?.username}</span>
                                <span className="profile-role">{user?.role}</span>
                            </div>
                            <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                        
                        {isDropdownOpen && (
                            <div className="dropdown-menu">
                                <Link to="/dashboard/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                                    <User size={18} />
                                    <span>Manajemen Akun</span>
                                </Link>
                                <button onClick={handleLogout} className="dropdown-item danger">
                                    <LogOut size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ flex: 1, padding: '32px' }}>
                    <Outlet />
                </div>
                
                <footer className="global-footer">
                    Pondok Pesantren Fauzan - Garut<br/>
                    Copyright &copy; 2026 - Pondok Pesantren Fauzan. All Rights Reserved
                </footer>
            </div>
        </div>
    );
};

export default Layout;
