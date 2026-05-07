import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2 } from 'lucide-react';

const MasterData = () => {
    const [santri, setSantri] = useState([]);
    const [places, setPlaces] = useState([]);
    const [formData, setFormData] = useState({ id: null, rfid: '', nama: '', place_id: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [alert, setAlert] = useState(null);
    const rfidInputRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [santriRes, placesRes] = await Promise.all([
                axios.get('/api/santri'),
                axios.get('/api/places')
            ]);
            setSantri(santriRes.data);
            setPlaces(placesRes.data);
            
            if (placesRes.data.length > 0 && !isEditing) {
                setFormData(prev => ({ ...prev, place_id: placesRes.data[0].id }));
            }
        } catch (error) {
            showAlert('error', 'Gagal memuat data');
        }
    };

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3000);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`/api/santri/${formData.id}`, formData);
                showAlert('success', 'Data berhasil diperbarui');
            } else {
                await axios.post('/api/santri', formData);
                showAlert('success', 'Data berhasil ditambahkan');
            }
            fetchData();
            resetForm();
        } catch (error) {
            showAlert('error', error.response?.data?.error || 'Terjadi kesalahan');
        }
    };

    const handleEdit = (s) => {
        setFormData({ id: s.id, rfid: s.rfid, nama: s.nama, place_id: s.place_id });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus data santri ini?')) {
            try {
                await axios.delete(`/api/santri/${id}`);
                showAlert('success', 'Data berhasil dihapus');
                fetchData();
            } catch (error) {
                showAlert('error', 'Gagal menghapus data');
            }
        }
    };

    const resetForm = () => {
        setFormData({ id: null, rfid: '', nama: '', place_id: places.length > 0 ? places[0].id : '' });
        setIsEditing(false);
        if (rfidInputRef.current) rfidInputRef.current.focus();
    };

    return (
        <div>
            <h2>Master Data Santri</h2>
            
            {alert && (
                <div className={`alert alert-${alert.type}`}>
                    {alert.message}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: '1fr 2fr' }}>
                <div className="glass-card" style={{ alignSelf: 'start' }}>
                    <h3>{isEditing ? 'Edit Data' : 'Tambah Data'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>No. RFID Card</label>
                            <input 
                                type="text" 
                                name="rfid"
                                className="input-control" 
                                value={formData.rfid}
                                onChange={handleInputChange}
                                ref={rfidInputRef}
                                autoFocus
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Nama Lengkap</label>
                            <input 
                                type="text" 
                                name="nama"
                                className="input-control" 
                                value={formData.nama}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Tempat Pengambilan</label>
                            <select 
                                name="place_id"
                                className="input-control" 
                                value={formData.place_id}
                                onChange={handleInputChange}
                                required
                            >
                                {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {isEditing ? 'Simpan Perubahan' : 'Tambah Santri'}
                            </button>
                            {isEditing && (
                                <button type="button" className="btn btn-danger" onClick={resetForm}>
                                    Batal
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="glass-card">
                    <h3>Daftar Santri</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>No. RFID</th>
                                    <th>Nama</th>
                                    <th>Tempat Pengambilan</th>
                                    <th className="text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {santri.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontFamily: 'monospace' }}>{s.rfid}</td>
                                        <td>{s.nama}</td>
                                        <td>{s.tempat_pengambilan}</td>
                                        <td className="text-center flex items-center justify-center gap-4">
                                            <button 
                                                onClick={() => handleEdit(s)}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(s.id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {santri.length === 0 && (
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

export default MasterData;
