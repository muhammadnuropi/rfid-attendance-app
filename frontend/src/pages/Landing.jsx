import React from 'react';
import { Link } from 'react-router-dom';
import { ScanLine } from 'lucide-react';

const Landing = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <div className="glass-card text-center" style={{ maxWidth: '500px', width: '100%' }}>
                    
                    <div className="scan-animation">
                        <ScanLine size={48} color="var(--primary)" />
                        <div className="scan-line"></div>
                    </div>

                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary)', lineHeight: 1.2 }}>Sistem Absensi Makan</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>Pondok Pesantren Fauzan</p>
                    
                    <Link to="/scan" className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '15px 30px', display: 'inline-flex', width: '100%' }}>
                        Mulai Scan Kartu
                    </Link>
                </div>
            </main>
            
            <footer className="global-footer">
                Pondok Pesantren Fauzan - Garut<br/>
                Copyright &copy; 2026 - Pondok Pesantren Fauzan. All Rights Reserved
            </footer>
        </div>
    );
};

export default Landing;
