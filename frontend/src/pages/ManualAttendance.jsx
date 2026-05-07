import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle } from 'lucide-react';

const ManualAttendance = () => {
    const [places, setPlaces] = useState([]);
    const [santri, setSantri] = useState([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState('');
    const [selectedSantriId, setSelectedSantriId] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [placesRes, santriRes] = await Promise.all([
                axios.get('/api/places'),
                axios.get('/api/santri')
            ]);
            setPlaces(placesRes.data);
            setSantri(santriRes.data);
        } catch (error) {
            showAlert('error', 'Gagal memuat data');
        }
    };

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSantriId || !selectedTimeSlot) {
            showAlert('error', 'Pilih santri dan waktu absensi terlebih dahulu');
            return;
        }

        try {
            const res = await axios.post('/api/attendance/manual', { 
                santri_id: selectedSantriId, 
                timeSlot: selectedTimeSlot 
            });
            showAlert('success', res.data.message);
            // Reset selection after success
            setSelectedSantriId('');
            setSelectedTimeSlot('');
        } catch (error) {
            showAlert('error', error.response?.data?.error || 'Gagal memproses absensi manual');
        }
    };

    // Filter santri based on selected place
    const filteredSantri = selectedPlaceId 
        ? santri.filter(s => s.place_id === parseInt(selectedPlaceId))
        : [];

    return (
        <div>
            <h2>Absensi Manual</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Gunakan fitur ini jika kartu santri hilang atau rusak.
            </p>

            {alert && (
                <div className={`alert alert-${alert.type}`}>
                    {alert.message}
                </div>
            )}

            <div className="glass-card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit}>
                    
                    {/* Langkah 1: Pilih Tempat */}
                    <div className="form-group">
                        <label>1. Pilih Tempat Pengambilan</label>
                        <select 
                            className="input-control" 
                            value={selectedPlaceId}
                            onChange={(e) => {
                                setSelectedPlaceId(e.target.value);
                                setSelectedSantriId(''); // Reset santri when place changes
                            }}
                            required
                        >
                            <option value="">-- Pilih Tempat --</option>
                            {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Langkah 2: Pilih Santri */}
                    <div className="form-group" style={{ opacity: selectedPlaceId ? 1 : 0.5 }}>
                        <label>2. Pilih Santri</label>
                        <select 
                            className="input-control" 
                            value={selectedSantriId}
                            onChange={(e) => setSelectedSantriId(e.target.value)}
                            required
                            disabled={!selectedPlaceId}
                        >
                            <option value="">-- Pilih Santri --</option>
                            {filteredSantri.map(s => (
                                <option key={s.id} value={s.id}>{s.nama}</option>
                            ))}
                        </select>
                        {selectedPlaceId && filteredSantri.length === 0 && (
                            <small style={{ color: 'var(--warning)', marginTop: '4px', display: 'block' }}>
                                Tidak ada santri terdaftar di tempat ini.
                            </small>
                        )}
                    </div>

                    {/* Langkah 3: Pilih Waktu */}
                    <div className="form-group" style={{ opacity: selectedSantriId ? 1 : 0.5 }}>
                        <label>3. Pilih Waktu Absensi</label>
                        <div className="flex gap-4">
                            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: selectedSantriId ? 'pointer' : 'not-allowed' }}>
                                <input 
                                    type="radio" 
                                    name="timeSlot" 
                                    value="Pagi" 
                                    checked={selectedTimeSlot === 'Pagi'}
                                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                    disabled={!selectedSantriId}
                                />
                                Makan Pagi
                            </label>
                            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: selectedSantriId ? 'pointer' : 'not-allowed' }}>
                                <input 
                                    type="radio" 
                                    name="timeSlot" 
                                    value="Sore" 
                                    checked={selectedTimeSlot === 'Sore'}
                                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                    disabled={!selectedSantriId}
                                />
                                Makan Sore
                            </label>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary w-100 flex items-center justify-center gap-2" 
                        style={{ marginTop: '1rem', padding: '12px' }}
                        disabled={!selectedPlaceId || !selectedSantriId || !selectedTimeSlot}
                    >
                        <CheckCircle size={20} />
                        Simpan Absensi Manual
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ManualAttendance;
