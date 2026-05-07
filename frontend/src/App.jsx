import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';

import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MasterData from './pages/MasterData';
import MasterPlaces from './pages/MasterPlaces';
import ScanRFID from './pages/ScanRFID';
import ManualAttendance from './pages/ManualAttendance';
import Recap from './pages/Recap';
import History from './pages/History';
import Profile from './pages/Profile';

const PrivateRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/scan" element={<ScanRFID />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="master-data" element={<MasterData />} />
                <Route path="master-places" element={<MasterPlaces />} />
                <Route path="manual-attendance" element={<ManualAttendance />} />
                <Route path="recap" element={<Recap />} />
                <Route path="history" element={<History />} />
                <Route path="profile" element={<Profile />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
};

export default App;
