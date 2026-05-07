import React, { useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, KeyRound, Image as ImageIcon, Trash2, Edit, Shield, CheckCircle, XCircle, Camera } from 'lucide-react';

const Profile = () => {
    const { user, updateUserProfile } = useContext(AuthContext);
    
    // Self Profile Forms
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [profileForm, setProfileForm] = useState({ username: user?.username || '', profile_photo: user?.profile_photo || '' });
    const fileInputRef = useRef(null);

    // Superadmin Forms & Data
    const [admins, setAdmins] = useState([]);
    const [adminForm, setAdminForm] = useState({ username: '', password: '' });
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [editForm, setEditForm] = useState({ password: '', is_active: 1 });

    const [alert, setAlert] = useState(null);

    // Camera states
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const showAlert = (type, message) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3000);
    };

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            // Delay slightly to ensure video element is rendered
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 100);
        } catch (err) {
            showAlert('error', 'Gagal mengakses kamera: ' + err.message);
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            const size = Math.min(video.videoWidth, video.videoHeight);
            canvas.width = size;
            canvas.height = size;
            
            const ctx = canvas.getContext('2d');
            // Mirror image for drawing
            ctx.translate(size, 0);
            ctx.scale(-1, 1);
            
            const startX = (video.videoWidth - size) / 2;
            const startY = (video.videoHeight - size) / 2;
            
            ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setProfileForm({ ...profileForm, profile_photo: dataUrl });
            stopCamera();
        }
    };

    const handleDeletePhoto = () => {
        setProfileForm({ ...profileForm, profile_photo: '' });
    };

    useEffect(() => {
        if (user?.role === 'superadmin') {
            fetchAdmins();
        }
    }, [user]);

    const fetchAdmins = async () => {
        try {
            const res = await axios.get('/api/admin/users');
            setAdmins(res.data);
        } catch (error) {
            console.error('Failed to fetch admins', error);
        }
    };

    // Self: Change Profile
    const handleProfileChange = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put('/api/admin/profile', profileForm);
            updateUserProfile(res.data.user.username, res.data.user.profile_photo);
            showAlert('success', res.data.message);
        } catch (error) {
            showAlert('error', error.response?.data?.error || 'Gagal memperbarui profil');
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showAlert('error', 'Ukuran foto maksimal 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileForm({ ...profileForm, profile_photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    // Self: Change Password
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showAlert('error', 'Password baru dan konfirmasi tidak cocok');
            return;
        }

        try {
            const res = await axios.post('/api/admin/change-password', {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            });
            showAlert('success', res.data.message);
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            showAlert('error', error.response?.data?.error || 'Gagal mengubah password');
        }
    };

    // Superadmin: Add Admin
    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/admin/add', adminForm);
            showAlert('success', res.data.message);
            setAdminForm({ username: '', password: '' });
            fetchAdmins();
        } catch (error) {
            showAlert('error', error.response?.data?.error || 'Gagal menambahkan admin');
        }
    };

    // Superadmin: Edit Admin
    const handleUpdateAdmin = async (e) => {
        e.preventDefault();
        try {
            const payload = { is_active: editForm.is_active };
            if (editForm.password) {
                payload.password = editForm.password;
            }
            const res = await axios.put(`/api/admin/users/${editingAdmin.id}`, payload);
            showAlert('success', res.data.message);
            setEditingAdmin(null);
            setEditForm({ password: '', is_active: 1 });
            fetchAdmins();
        } catch (error) {
            showAlert('error', error.response?.data?.error || 'Gagal memperbarui admin');
        }
    };

    // Superadmin: Delete Admin
    const handleDeleteAdmin = async (id) => {
        if (!window.confirm('Yakin ingin menghapus akun admin ini?')) return;
        try {
            const res = await axios.delete(`/api/admin/users/${id}`);
            showAlert('success', res.data.message);
            fetchAdmins();
        } catch (error) {
            showAlert('error', error.response?.data?.error || 'Gagal menghapus admin');
        }
    };

    return (
        <div>
            <h2>Manajemen Akun</h2>

            {alert && (
                <div className={`alert alert-${alert.type}`}>
                    {alert.message}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Edit Profile Self */}
                <div className="glass-card">
                    <div className="flex items-center gap-2 mb-4">
                        <ImageIcon size={24} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>Profil Saya</h3>
                    </div>
                    <form onSubmit={handleProfileChange}>
                        <div className="flex items-center gap-4 mb-4">
                            {profileForm.profile_photo ? (
                                <img src={profileForm.profile_photo} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ImageIcon size={24} color="var(--text-muted)" />
                                </div>
                            )}
                            <div>
                                <div className="flex gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
                                    <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => fileInputRef.current?.click()}>
                                        Pilih File
                                    </button>
                                    <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={startCamera}>
                                        <Camera size={16} /> Kamera
                                    </button>
                                    {profileForm.profile_photo && (
                                        <button type="button" className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={handleDeletePhoto}>
                                            <Trash2 size={16} /> Hapus
                                        </button>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Username</label>
                            <input 
                                type="text" 
                                className="input-control" 
                                value={profileForm.username}
                                onChange={e => setProfileForm({...profileForm, username: e.target.value})}
                                required 
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Simpan Profil</button>
                    </form>
                </div>

                {/* Edit Password Self */}
                <div className="glass-card">
                    <div className="flex items-center gap-2 mb-4">
                        <KeyRound size={24} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>Ubah Password</h3>
                    </div>
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <label>Password Lama</label>
                            <input 
                                type="password" 
                                className="input-control" 
                                value={passwordForm.oldPassword}
                                onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Password Baru</label>
                            <input 
                                type="password" 
                                className="input-control" 
                                value={passwordForm.newPassword}
                                onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label>Konfirmasi Password Baru</label>
                            <input 
                                type="password" 
                                className="input-control" 
                                value={passwordForm.confirmPassword}
                                onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                required 
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Simpan Password</button>
                    </form>
                </div>
            </div>

            {/* SUPERADMIN AREA */}
            {user?.role === 'superadmin' && (
                <div>
                    <h2 className="flex items-center gap-2 mb-4">
                        <Shield size={28} color="var(--warning)" />
                        Area Superadmin
                    </h2>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="glass-card" style={{ gridColumn: 'span 1', alignSelf: 'start' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <UserPlus size={24} color="var(--success)" />
                                <h3 style={{ margin: 0 }}>Tambah Admin</h3>
                            </div>
                            <form onSubmit={handleAddAdmin}>
                                <div className="form-group">
                                    <label>Username Baru</label>
                                    <input 
                                        type="text" 
                                        className="input-control" 
                                        value={adminForm.username}
                                        onChange={e => setAdminForm({...adminForm, username: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password Default</label>
                                    <input 
                                        type="password" 
                                        className="input-control" 
                                        value={adminForm.password}
                                        onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                                        required 
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100" style={{ background: 'var(--success)' }}>
                                    Buat Akun Admin
                                </button>
                            </form>
                        </div>

                        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                            <h3 style={{ margin: 0, marginBottom: '16px' }}>Daftar Admin</h3>
                            
                            {editingAdmin && (
                                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--primary)' }}>
                                    <h4 style={{ marginBottom: '12px', color: 'var(--primary)' }}>Edit Admin: {editingAdmin.username}</h4>
                                    <form onSubmit={handleUpdateAdmin} className="flex gap-4 items-end">
                                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                            <label>Reset Password (kosongkan jika tidak diubah)</label>
                                            <input 
                                                type="password" 
                                                className="input-control" 
                                                value={editForm.password}
                                                onChange={e => setEditForm({...editForm, password: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label>Status</label>
                                            <select 
                                                className="input-control"
                                                value={editForm.is_active}
                                                onChange={e => setEditForm({...editForm, is_active: parseInt(e.target.value)})}
                                            >
                                                <option value={1}>Aktif</option>
                                                <option value={0}>Nonaktif</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="btn btn-primary">Simpan</button>
                                        <button type="button" className="btn btn-outline" onClick={() => setEditingAdmin(null)}>Batal</button>
                                    </form>
                                </div>
                            )}

                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th className="text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {admins.map(admin => (
                                            <tr key={admin.id}>
                                                <td>{admin.username} {admin.id === user.id && '(Anda)'}</td>
                                                <td>
                                                    <span className={`badge ${admin.role === 'superadmin' ? 'badge-warning' : 'badge-success'}`}>
                                                        {admin.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    {admin.is_active ? (
                                                        <span className="flex items-center gap-1" style={{ color: 'var(--success)' }}>
                                                            <CheckCircle size={16} /> Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1" style={{ color: 'var(--danger)' }}>
                                                            <XCircle size={16} /> Nonaktif
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    {admin.id !== user.id && admin.role !== 'superadmin' && (
                                                        <div className="flex justify-center gap-2">
                                                            <button 
                                                                className="btn btn-outline" 
                                                                style={{ padding: '6px' }}
                                                                title="Edit"
                                                                onClick={() => {
                                                                    setEditingAdmin(admin);
                                                                    setEditForm({ password: '', is_active: admin.is_active });
                                                                }}
                                                            >
                                                                <Edit size={16} color="var(--primary)" />
                                                            </button>
                                                            <button 
                                                                className="btn btn-outline" 
                                                                style={{ padding: '6px' }}
                                                                title="Hapus"
                                                                onClick={() => handleDeleteAdmin(admin.id)}
                                                            >
                                                                <Trash2 size={16} color="var(--danger)" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Modal */}
            {isCameraOpen && (
                <div className="camera-modal-overlay">
                    <div className="camera-modal">
                        <div className="flex justify-between items-center w-100 mb-2">
                            <h3 style={{ margin: 0 }}>Ambil Foto</h3>
                            <button className="btn btn-outline" style={{ padding: '4px', border: 'none' }} onClick={stopCamera}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
                        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        <button className="btn btn-primary w-100" onClick={capturePhoto}>
                            <Camera size={20} /> Ambil Gambar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
