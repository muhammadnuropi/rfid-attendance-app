import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Download } from 'lucide-react';

const Recap = () => {
    const [recapData, setRecapData] = useState([]);
    const [places, setPlaces] = useState([]);
    
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear().toString();

    const [filter, setFilter] = useState({ month: currentMonth, year: currentYear, placeName: 'Semua' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPlaces();
        fetchRecap();
    }, [filter]);

    const fetchPlaces = async () => {
        try {
            const res = await axios.get('/api/places');
            setPlaces(res.data);
        } catch (error) {
            console.error('Error fetching places', error);
        }
    };

    const fetchRecap = async () => {
        setLoading(true);
        try {
            const { month, year, placeName } = filter;
            const res = await axios.get(`/api/dashboard/recap?month=${month}&year=${year}&placeName=${placeName}`);
            setRecapData(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching recap', error);
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };

    // Determine days in selected month
    const daysInMonth = new Date(parseInt(filter.year), parseInt(filter.month), 0).getDate();
    const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2>Rekapitulasi Bulanan</h2>
                <button className="btn btn-outline flex items-center gap-2" onClick={handlePrint}>
                    <Download size={18} /> Export / Print
                </button>
            </div>

            <div className="glass-card mb-4 print-hide">
                <div className="flex gap-4 items-end">
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label>Tempat Pengambilan</label>
                        <select name="placeName" className="input-control" value={filter.placeName} onChange={handleFilterChange}>
                            <option value="Semua">Semua Tempat</option>
                            {places.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label>Bulan</label>
                        <select name="month" className="input-control" value={filter.month} onChange={handleFilterChange}>
                            <option value="01">Januari</option>
                            <option value="02">Februari</option>
                            <option value="03">Maret</option>
                            <option value="04">April</option>
                            <option value="05">Mei</option>
                            <option value="06">Juni</option>
                            <option value="07">Juli</option>
                            <option value="08">Agustus</option>
                            <option value="09">September</option>
                            <option value="10">Oktober</option>
                            <option value="11">November</option>
                            <option value="12">Desember</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label>Tahun</label>
                        <select name="year" className="input-control" value={filter.year} onChange={handleFilterChange}>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '20px 0' }}>
                {loading ? (
                    <div className="text-center p-4">Loading data...</div>
                ) : (
                    <div style={{ overflowX: 'auto', padding: '0 20px' }}>
                        <table style={{ minWidth: '1500px' }}>
                            <thead>
                                <tr>
                                    <th rowSpan="2" style={{ position: 'sticky', left: 0, background: 'var(--bg-dark)', zIndex: 2 }}>No</th>
                                    <th rowSpan="2" style={{ position: 'sticky', left: '40px', background: 'var(--bg-dark)', zIndex: 2 }}>Nama Santri</th>
                                    <th rowSpan="2">Tempat</th>
                                    <th colSpan={daysInMonth} className="text-center">Tanggal</th>
                                    <th rowSpan="2" className="text-center">% Hadir</th>
                                </tr>
                                <tr>
                                    {daysArray.map(day => (
                                        <th key={day} className="text-center" style={{ minWidth: '35px', padding: '8px 4px' }}>{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recapData.map((s, index) => (
                                    <tr key={s.id}>
                                        <td style={{ position: 'sticky', left: 0, background: 'var(--bg-dark)', zIndex: 1 }}>{index + 1}</td>
                                        <td style={{ position: 'sticky', left: '40px', background: 'var(--bg-dark)', zIndex: 1 }}>{s.nama}</td>
                                        <td>{s.tempat_pengambilan}</td>
                                        {daysArray.map(day => {
                                            const stat = s.dailyStats[day];
                                            let bg = 'transparent';
                                            if (stat.percentage === 100) bg = 'rgba(16, 185, 129, 0.2)'; // Green
                                            else if (stat.percentage === 50) bg = 'rgba(245, 158, 11, 0.2)'; // Yellow
                                            else if (stat.percentage === 0) bg = 'rgba(239, 68, 68, 0.1)'; // Red/Empty

                                            return (
                                                <td key={day} className="text-center" style={{ background: bg, padding: '4px' }}>
                                                    {stat.percentage === 100 ? '✓✓' : stat.percentage === 50 ? (stat.isPagi ? 'P' : 'S') : '-'}
                                                </td>
                                            );
                                        })}
                                        <td className="text-center font-bold">
                                            <span style={{ 
                                                color: s.monthlyAverage >= 80 ? 'var(--success)' : (s.monthlyAverage >= 50 ? 'var(--warning)' : 'var(--danger)')
                                            }}>
                                                {s.monthlyAverage}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {recapData.length === 0 && (
                                    <tr>
                                        <td colSpan={daysInMonth + 4} className="text-center">Belum ada data absensi pada bulan ini.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <div style={{ padding: '20px 20px 0' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>Keterangan:</strong> ✓✓ (Hadir Pagi & Sore) | P (Hanya Pagi) | S (Hanya Sore) | - (Tidak Hadir)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Recap;
