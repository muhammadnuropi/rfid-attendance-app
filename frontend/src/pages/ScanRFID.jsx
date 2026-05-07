import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ScanLine, CheckCircle, XCircle, LogIn, Clock } from 'lucide-react';

const ScanRFID = () => {
    const [rfid, setRfid] = useState('');
    const [status, setStatus] = useState(null); // { type: 'success'|'error', message: '' }
    const [recentHistory, setRecentHistory] = useState([]);
    const inputRef = useRef(null);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/api/history/recent');
            setRecentHistory(res.data);
        } catch (error) {
            console.error("Gagal mengambil riwayat", error);
        }
    };

    useEffect(() => {
        fetchHistory();
        
        const focusInput = (e) => {
            // Only force focus if we're not clicking on a link/button
            if (e && e.target && (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button'))) {
                return;
            }
            if (inputRef.current) {
                inputRef.current.focus();
            }
        };
        
        focusInput();
        document.addEventListener('click', focusInput);
        return () => document.removeEventListener('click', focusInput);
    }, []);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!rfid) return;

        try {
            const res = await axios.post('/api/attendance/scan', { rfid });
            setStatus({
                type: 'success',
                message: res.data.message
            });
            fetchHistory(); // Refresh history immediately after successful scan
            
            setTimeout(() => setStatus(null), 4000);
        } catch (error) {
            setStatus({
                type: 'error',
                message: error.response?.data?.error || 'Gagal memproses absensi'
            });
            setTimeout(() => setStatus(null), 4000);
        }
        
        setRfid('');
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Public Header */}
            <header style={{ 
                padding: '1rem 2rem', 
                background: 'var(--bg-dark)', 
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                        width: '40px', height: '40px', 
                        background: 'linear-gradient(135deg, var(--primary), #818cf8)',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ScanLine color="white" size={24} />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-light)' }}>Sistem Absensi Makan</h1>
                </div>
                <Link to="/login" className="btn btn-primary flex items-center gap-2" style={{ padding: '8px 20px' }}>
                    <LogIn size={18} />
                    <span>Login</span>
                </Link>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '16px' }}>
                <div className="glass-card" style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
                    
                    <div className="scan-animation">
                        <ScanLine size={48} color="var(--primary)" />
                        <div className="scan-line"></div>
                    </div>

                    <h2 style={{ marginBottom: '8px' }}>Siap Memindai Kartu</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                        Silakan tempelkan kartu RFID pada reader.
                    </p>

                    <form onSubmit={handleScan}>
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={rfid}
                            onChange={(e) => setRfid(e.target.value)}
                            style={{ position: 'absolute', opacity: 0, left: '-9999px' }}
                            autoFocus
                        />
                    </form>

                    {status && (
                        <div style={{ 
                            marginTop: '20px', 
                            padding: '20px', 
                            borderRadius: '12px',
                            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                            animation: 'slideIn 0.3s ease-out'
                        }}>
                            {status.type === 'success' ? (
                                <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '16px' }} />
                            ) : (
                                <XCircle size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
                            )}
                            <h3 style={{ 
                                color: status.type === 'success' ? 'var(--success)' : 'var(--danger)', 
                                margin: 0, 
                                fontSize: '1.2rem',
                                whiteSpace: 'pre-line', // Important for \n in message
                                lineHeight: '1.5'
                            }}>
                                {status.message}
                            </h3>
                        </div>
                    )}
                </div>

                <div className="glass-card" style={{ width: '100%', maxWidth: '600px' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                        <Clock size={20} color="var(--text-muted)" />
                        <h3 style={{ margin: 0 }}>5 Riwayat Terakhir</h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Waktu</th>
                                    <th>Nama Santri</th>
                                    <th>Tempat</th>
                                    <th>Sesi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentHistory.map((h, i) => {
                                    const d = new Date(h.timestamp);
                                    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <tr key={i}>
                                            <td>{timeStr}</td>
                                            <td style={{ fontWeight: '500' }}>{h.nama}</td>
                                            <td>{h.tempat}</td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.85rem',
                                                    background: h.time_slot === 'Pagi' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: h.time_slot === 'Pagi' ? 'var(--primary)' : 'var(--warning)'
                                                }}>
                                                    {h.time_slot}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {recentHistory.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted">Belum ada riwayat hari ini</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            
            <footer className="global-footer">
                Pondok Pesantren Fauzan - Garut<br/>
                Copyright &copy; 2026 - Pondok Pesantren Fauzan. All Rights Reserved
            </footer>
        </div>
    );
};

export default ScanRFID;
