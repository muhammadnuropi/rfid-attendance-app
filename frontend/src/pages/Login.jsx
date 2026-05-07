import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ScanLine, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const res = await login(username, password);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Top Left Scan Button */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                <Link to="/scan" className="btn btn-outline" style={{ background: 'var(--bg-card)', padding: '8px 16px' }}>
                    <ArrowLeft size={18} />
                    <span>Scan Kartu</span>
                </Link>
            </div>

            <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '16px' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '50%' }}>
                        <ScanLine size={48} color="var(--primary)" />
                    </div>
                </div>
                <h2>Sistem Absensi RFID</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Silakan login untuk melanjutkan</p>
                
                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div className="form-group">
                        <label>Username</label>
                        <input 
                            type="text" 
                            className="input-control" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-input-wrapper">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="input-control" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button 
                                type="button" 
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                        Login
                    </button>
                </form>
            </div>
            </main>

            <footer className="global-footer">
                Pondok Pesantren Fauzan - Garut<br/>
                Copyright &copy; 2026 - Pondok Pesantren Fauzan. All Rights Reserved
            </footer>
        </div>
    );
};

export default Login;
