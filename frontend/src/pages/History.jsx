import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock } from 'lucide-react';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/api/history/daily');
            setHistory(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching history', error);
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Riwayat Absensi Harian</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Menampilkan riwayat *real-time*. Riwayat yang lebih dari 2x24 jam akan otomatis dihapus oleh sistem.
            </p>

            <div className="glass-card">
                <div className="flex items-center gap-2 mb-4">
                    <Clock size={20} color="var(--primary)" />
                    <h3 style={{ margin: 0 }}>Log Absensi Terbaru</h3>
                </div>

                {loading ? (
                    <div>Loading data...</div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nama Santri</th>
                                    <th>Tempat</th>
                                    <th>Waktu Absensi</th>
                                    <th>Jam</th>
                                    <th>Tanggal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h) => {
                                    const d = new Date(h.timestamp);
                                    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                                    const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                    
                                    return (
                                        <tr key={h.id}>
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
                                            <td>{timeStr}</td>
                                            <td>{dateStr}</td>
                                        </tr>
                                    );
                                })}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted">Belum ada riwayat absensi dalam 48 jam terakhir.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
