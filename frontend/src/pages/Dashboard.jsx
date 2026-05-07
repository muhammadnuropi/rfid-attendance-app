import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, CheckCircle, XCircle, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Semua');

    useEffect(() => {
        fetchStats();
        // Auto refresh every minute
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/dashboard/stats');
            setStats(res.data.stats);
            setPlaces(res.data.places);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching stats', error);
            setLoading(false);
        }
    };

    if (loading) return <div>Loading dashboard...</div>;
    if (!stats || !places) return <div>No data available</div>;

    // Prepare chart data
    const chartData = places.map(place => ({
        name: place,
        HadirPagi: stats[place]?.pagi || 0,
        HadirSore: stats[place]?.sore || 0,
        TotalSantri: stats[place]?.total || 0
    }));

    // Calculate totals
    const totalSantri = places.reduce((sum, place) => sum + (stats[place]?.total || 0), 0);
    const totalPagi = places.reduce((sum, place) => sum + (stats[place]?.pagi || 0), 0);
    const totalSore = places.reduce((sum, place) => sum + (stats[place]?.sore || 0), 0);

    // Filter santri for table
    let santriList = [];
    if (filter === 'Semua') {
        places.forEach(p => {
            if (stats[p]?.students) {
                santriList = [...santriList, ...stats[p].students.map(s => ({...s, tempat: p}))];
            }
        });
    } else {
        santriList = (stats[filter]?.students || []).map(s => ({...s, tempat: filter}));
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 style={{ margin: 0 }}>Dashboard Monitoring</h2>
                <Link to="/scan" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                    <ScanLine size={20} />
                    <span>Scan Kartu</span>
                </Link>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="glass-card flex items-center gap-4">
                    <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '12px' }}>
                        <Users size={32} color="var(--primary)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Total Santri</h3>
                        <p style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>{totalSantri}</p>
                    </div>
                </div>
                <div className="glass-card flex items-center gap-4">
                    <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px' }}>
                        <CheckCircle size={32} color="var(--success)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Hadir Makan Pagi</h3>
                        <p style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>{totalPagi}</p>
                    </div>
                </div>
                <div className="glass-card flex items-center gap-4">
                    <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '12px' }}>
                        <CheckCircle size={32} color="var(--warning)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Hadir Makan Sore</h3>
                        <p style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>{totalSore}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="glass-card">
                    <h3>Grafik Kehadiran Berdasarkan Tempat</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" />
                                <YAxis stroke="var(--text-muted)" />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)' }} />
                                <Legend />
                                <Bar dataKey="HadirPagi" name="Hadir Pagi" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="HadirSore" name="Hadir Sore" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 style={{ margin: 0 }}>Status Kehadiran Hari Ini</h3>
                        <select 
                            className="input-control" 
                            style={{ width: 'auto', padding: '8px' }}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="Semua">Semua Tempat</option>
                            {places.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    
                    <div className="table-container" style={{ flex: 1, maxHeight: '300px' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nama Santri</th>
                                    <th>Tempat</th>
                                    <th className="text-center">Pagi</th>
                                    <th className="text-center">Sore</th>
                                </tr>
                            </thead>
                            <tbody>
                                {santriList.map(s => (
                                    <tr key={s.id}>
                                        <td>{s.nama}</td>
                                        <td>{s.tempat}</td>
                                        <td className="text-center">
                                            {s.isPagi ? <CheckCircle size={20} color="var(--success)" /> : <XCircle size={20} color="var(--danger)" />}
                                        </td>
                                        <td className="text-center">
                                            {s.isSore ? <CheckCircle size={20} color="var(--success)" /> : <XCircle size={20} color="var(--danger)" />}
                                        </td>
                                    </tr>
                                ))}
                                {santriList.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center">Belum ada data santri.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
