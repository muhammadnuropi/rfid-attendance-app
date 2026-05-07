import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, Trash2 } from 'lucide-react';

const MasterPlaces = () => {
    const [places, setPlaces] = useState([]);
    const [formData, setFormData] = useState({ id: null, name: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        fetchPlaces();
    }, []);

    const fetchPlaces = async () => {
        try {
            const res = await axios.get('/api/places');
            setPlaces(res.data);
        } catch (error) {
            showAlert('error', 'Gagal memuat data tempat');
        }
    };

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`/api/places/${formData.id}`, { name: formData.name });
                showAlert('success', 'Data berhasil diperbarui');
            } else {
                await axios.post('/api/places', { name: formData.name });
                showAlert('success', 'Data berhasil ditambahkan');
            }
            fetchPlaces();
            setFormData({ id: null, name: '' });
            setIsEditing(false);
        } catch (error) {
            showAlert('error', error.response?.data?.error || 'Terjadi kesalahan');
        }
    };

    const handleEdit = (place) => {
        setFormData(place);
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus data ini? Semua santri di tempat ini juga akan terhapus riwayatnya (Cascade). Lanjutkan?')) {
            try {
                await axios.delete(`/api/places/${id}`);
                showAlert('success', 'Data berhasil dihapus');
                fetchPlaces();
            } catch (error) {
                showAlert('error', 'Gagal menghapus data');
            }
        }
    };

    return (
        <div>
            <h2>Master Tempat Pengambilan</h2>
            
            {alert && (
                <div className={`alert alert-${alert.type}`}>
                    {alert.message}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4" style={{ gridTemplateColumns: '1fr 2fr' }}>
                <div className="glass-card" style={{ alignSelf: 'start' }}>
                    <h3>{isEditing ? 'Edit Tempat' : 'Tambah Tempat'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nama Tempat</label>
                            <input 
                                type="text" 
                                className="input-control" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="Contoh: Dapur Umum"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-4">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {isEditing ? 'Simpan' : 'Tambah'}
                            </button>
                            {isEditing && (
                                <button type="button" className="btn btn-danger" onClick={() => {
                                    setFormData({ id: null, name: '' });
                                    setIsEditing(false);
                                }}>
                                    Batal
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="glass-card">
                    <h3>Daftar Tempat</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nama Tempat</th>
                                    <th className="text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {places.map((p, index) => (
                                    <tr key={p.id}>
                                        <td>{index + 1}</td>
                                        <td>{p.name}</td>
                                        <td className="text-center flex items-center justify-center gap-4">
                                            <button 
                                                onClick={() => handleEdit(p)}
                                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(p.id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {places.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="text-center">Belum ada data tempat.</td>
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

export default MasterPlaces;
