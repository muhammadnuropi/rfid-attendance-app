import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const loginTime = localStorage.getItem('loginTime');
        const role = localStorage.getItem('role') || 'admin';
        const profile_photo = localStorage.getItem('profile_photo') || '';

        if (token && username && loginTime) {
            const now = new Date().getTime();
            const threeHours = 3 * 60 * 60 * 1000;

            if (now - parseInt(loginTime) < threeHours) {
                setUser({ username, token, role, profile_photo });
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const res = await axios.post('/api/login', { username, password });
            const { token, username: userUsername, role, profile_photo } = res.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('username', userUsername);
            localStorage.setItem('role', role);
            if (profile_photo) {
                localStorage.setItem('profile_photo', profile_photo);
            } else {
                localStorage.removeItem('profile_photo');
            }
            localStorage.setItem('loginTime', new Date().getTime().toString());
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser({ username: userUsername, token, role, profile_photo });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.error || 'Login failed' };
        }
    };

    const updateUserProfile = (newUsername, newPhoto) => {
        setUser(prev => {
            const updated = { ...prev, username: newUsername };
            if (newPhoto !== undefined) updated.profile_photo = newPhoto;
            
            localStorage.setItem('username', newUsername);
            if (newPhoto) {
                localStorage.setItem('profile_photo', newPhoto);
            } else if (newPhoto === '') {
                localStorage.removeItem('profile_photo');
            }
            return updated;
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('role');
        localStorage.removeItem('profile_photo');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    if (loading) {
        return <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUserProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
