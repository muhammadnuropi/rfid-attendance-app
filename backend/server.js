require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'super_secret_rfid_key_change_in_production';

// Keamanan: Set HTTP headers dengan Helmet
app.use(helmet());

// Keamanan: Batasi asal permintaan (CORS)
const allowedOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : 'http://localhost:5173';
app.use(cors({
    origin: [allowedOrigin, allowedOrigin + "/"],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Keamanan: Rate Limiting umum untuk semua API
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100, // Batas 100 request per IP
    message: { error: 'Terlalu banyak permintaan dari IP ini, coba lagi setelah 15 menit' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Keamanan: Rate Limiting ketat khusus untuk endpoint login & scan
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 20, // Batas 20 request per IP (misal untuk brute force login)
    message: { error: 'Terlalu banyak percobaan, coba lagi setelah 15 menit' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware for auth
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const requireSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ error: 'Akses ditolak: Membutuhkan hak akses superadmin' });
    }
};

// Start server
initDB().then(pool => {

    // Auth & Profile Routes
    app.post('/api/login', strictLimiter, async (req, res) => {
        const { username, password } = req.body;
        try {
            const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
            const user = users[0];

            if (user && await bcrypt.compare(password, user.password)) {
                if (user.is_active === 0) {
                    return res.status(403).json({ error: 'Akun ini telah dinonaktifkan' });
                }
                const token = jwt.sign({ id: user.id, username: user.username, role: user.role, profile_photo: user.profile_photo }, SECRET_KEY, { expiresIn: '8h' });
                res.json({ token, username: user.username, role: user.role, profile_photo: user.profile_photo });
            } else {
                res.status(401).json({ error: 'Username atau password salah' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/admin/change-password', authenticateToken, async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        try {
            const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
            const user = users[0];

            if (user && await bcrypt.compare(oldPassword, user.password)) {
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
                res.json({ message: 'Password berhasil diubah' });
            } else {
                res.status(400).json({ error: 'Password lama salah' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/admin/add', authenticateToken, requireSuperAdmin, async (req, res) => {
        const { username, password } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, 'admin']);
            res.status(201).json({ message: 'Admin baru berhasil ditambahkan' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'Username sudah digunakan' });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    });

    app.get('/api/admin/users', authenticateToken, requireSuperAdmin, async (req, res) => {
        try {
            const [users] = await pool.query('SELECT id, username, role, is_active FROM users ORDER BY id ASC');
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/admin/users/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
        const { password, is_active } = req.body;
        const userId = req.params.id;
        try {
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.query('UPDATE users SET password = ?, is_active = ? WHERE id = ?', [hashedPassword, is_active, userId]);
            } else {
                await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, userId]);
            }
            res.json({ message: 'Akun berhasil diperbarui' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.delete('/api/admin/users/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
        try {
            await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
            res.json({ message: 'Akun berhasil dihapus' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/admin/profile', authenticateToken, async (req, res) => {
        const { username, profile_photo } = req.body;
        try {
            const [existing] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username sudah digunakan' });
            }

            await pool.query('UPDATE users SET username = ?, profile_photo = ? WHERE id = ?', [username, profile_photo, req.user.id]);

            const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
            const user = users[0];
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role, profile_photo: user.profile_photo }, SECRET_KEY, { expiresIn: '8h' });

            res.json({ message: 'Profil berhasil diperbarui', token, user: { username: user.username, role: user.role, profile_photo: user.profile_photo } });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Places Routes
    app.get('/api/places', authenticateToken, async (req, res) => {
        try {
            const [places] = await pool.query('SELECT * FROM places');
            res.json(places);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/places', authenticateToken, async (req, res) => {
        const { name } = req.body;
        try {
            const [result] = await pool.query('INSERT INTO places (name) VALUES (?)', [name]);
            res.status(201).json({ id: result.insertId, name });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'Nama tempat sudah ada' });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    });

    app.put('/api/places/:id', authenticateToken, async (req, res) => {
        const { name } = req.body;
        try {
            await pool.query('UPDATE places SET name = ? WHERE id = ?', [name, req.params.id]);
            res.json({ message: 'Data berhasil diperbarui' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.delete('/api/places/:id', authenticateToken, async (req, res) => {
        try {
            await pool.query('DELETE FROM places WHERE id = ?', [req.params.id]);
            res.json({ message: 'Data berhasil dihapus' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Santri Routes
    app.get('/api/santri', authenticateToken, async (req, res) => {
        try {
            const [santri] = await pool.query(`
                SELECT s.*, p.name as tempat_pengambilan 
                FROM santri s 
                LEFT JOIN places p ON s.place_id = p.id
            `);
            res.json(santri);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/santri', authenticateToken, async (req, res) => {
        const { rfid, nama, place_id } = req.body;
        try {
            const [result] = await pool.query(
                'INSERT INTO santri (rfid, nama, place_id) VALUES (?, ?, ?)',
                [rfid, nama, place_id]
            );
            res.status(201).json({ id: result.insertId, rfid, nama, place_id });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'RFID sudah terdaftar' });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    });

    app.put('/api/santri/:id', authenticateToken, async (req, res) => {
        const { rfid, nama, place_id } = req.body;
        try {
            await pool.query(
                'UPDATE santri SET rfid = ?, nama = ?, place_id = ? WHERE id = ?',
                [rfid, nama, place_id, req.params.id]
            );
            res.json({ message: 'Data berhasil diperbarui' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.delete('/api/santri/:id', authenticateToken, async (req, res) => {
        try {
            await pool.query('DELETE FROM santri WHERE id = ?', [req.params.id]);
            res.json({ message: 'Data berhasil dihapus' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Clean up old history (> 48h)
    const cleanupHistory = async () => {
        try {
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            await pool.query('DELETE FROM attendance WHERE timestamp < ?', [fortyEightHoursAgo]);
        } catch (error) {
            console.error('Failed to cleanup history', error);
        }
    };

    // History Routes
    app.get('/api/history/recent', async (req, res) => {
        // Public route for last 5 scans
        try {
            const [history] = await pool.query(`
                SELECT a.id, a.time_slot, a.timestamp, s.nama, p.name as tempat
                FROM attendance a
                JOIN santri s ON a.santri_id = s.id
                JOIN places p ON s.place_id = p.id
                ORDER BY a.timestamp DESC
                LIMIT 5
            `);
            res.json(history);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/history/daily', authenticateToken, async (req, res) => {
        try {
            await cleanupHistory(); // Auto cleanup before fetching

            const [history] = await pool.query(`
                SELECT a.id, a.date, a.time_slot, a.timestamp, s.nama, p.name as tempat
                FROM attendance a
                JOIN santri s ON a.santri_id = s.id
                JOIN places p ON s.place_id = p.id
                ORDER BY a.timestamp DESC
            `);

            res.json(history);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Attendance Function
    const processAttendance = async (santri, placeName, reqDate) => {
        const now = new Date();
        // Adjust for timezone if needed, simple local string for now
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - offset)).toISOString().slice(0, -1);
        const dateStr = localISOTime.split('T')[0];

        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeVal = hours + minutes / 60;

        let timeSlot = '';
        if (timeVal >= 6 && timeVal <= 14.5) {
            timeSlot = 'Pagi';
        } else if (timeVal >= 15 && timeVal <= 23.99) { // 23:59
            timeSlot = 'Sore';
        } else {
            return { status: 400, message: 'Di luar jadwal absensi (Pagi: 06:00-14:30, Sore: 15:00-23:59)' };
        }

        // Check if already scanned
        const [existing] = await pool.query(
            'SELECT * FROM attendance WHERE santri_id = ? AND date = ? AND time_slot = ?',
            [santri.id, dateStr, timeSlot]
        );

        if (existing.length > 0) {
            return { status: 400, message: `Sudah melakukan absensi ${timeSlot} hari ini` };
        }

        await pool.query(
            'INSERT INTO attendance (santri_id, date, time_slot, timestamp) VALUES (?, ?, ?, ?)',
            [santri.id, dateStr, timeSlot, new Date()]
        );

        return {
            status: 200,
            message: `Absensi Makan ${timeSlot} berhasil\nuntuk ${santri.nama} - ${placeName}`,
            timeSlot,
            santri: santri.nama
        };
    };

    // Attendance Route (RFID Scan - Public)
    app.post('/api/attendance/scan', strictLimiter, async (req, res) => {
        const { rfid } = req.body;
        try {
            const [rows] = await pool.query(`
                SELECT s.*, p.name as placeName 
                FROM santri s 
                LEFT JOIN places p ON s.place_id = p.id 
                WHERE s.rfid = ?
            `, [rfid]);

            const santri = rows[0];

            if (!santri) {
                return res.status(404).json({ error: 'RFID tidak terdaftar' });
            }

            const result = await processAttendance(santri, santri.placeName);
            if (result.status === 200) {
                res.json(result);
            } else {
                res.status(result.status).json({ error: result.message });
            }

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Manual Attendance
    app.post('/api/attendance/manual', authenticateToken, async (req, res) => {
        const { santri_id, timeSlot } = req.body;

        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - offset)).toISOString().slice(0, -1);
        const dateStr = localISOTime.split('T')[0];

        try {
            const [rows] = await pool.query(`
                SELECT s.*, p.name as placeName 
                FROM santri s 
                LEFT JOIN places p ON s.place_id = p.id 
                WHERE s.id = ?
            `, [santri_id]);
            const santri = rows[0];

            if (!santri) return res.status(404).json({ error: 'Santri tidak ditemukan' });

            const slot = timeSlot || 'Pagi';

            const [existing] = await pool.query(
                'SELECT * FROM attendance WHERE santri_id = ? AND date = ? AND time_slot = ?',
                [santri.id, dateStr, slot]
            );

            if (existing.length > 0) {
                return res.status(400).json({ error: `Sudah melakukan absensi ${slot} hari ini` });
            }

            await pool.query(
                'INSERT INTO attendance (santri_id, date, time_slot, timestamp) VALUES (?, ?, ?, ?)',
                [santri.id, dateStr, slot, new Date()]
            );

            res.json({ message: `Absensi manual ${slot} berhasil untuk ${santri.nama}` });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Dashboard Stats
    app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - offset)).toISOString().slice(0, -1);
        const dateStr = localISOTime.split('T')[0];

        try {
            const [places] = await pool.query('SELECT * FROM places');
            const [santriData] = await pool.query('SELECT * FROM santri');
            const [attendanceData] = await pool.query('SELECT * FROM attendance WHERE date = ?', [dateStr]);

            const stats = {};

            places.forEach(p => {
                stats[p.name] = { total: 0, pagi: 0, sore: 0, students: [] };
            });

            santriData.forEach(s => {
                const place = places.find(p => p.id === s.place_id)?.name || 'Unknown';
                if (!stats[place]) stats[place] = { total: 0, pagi: 0, sore: 0, students: [] };
                stats[place].total++;

                const studentAtt = attendanceData.filter(a => a.santri_id === s.id);
                const isPagi = studentAtt.some(a => a.time_slot === 'Pagi');
                const isSore = studentAtt.some(a => a.time_slot === 'Sore');

                if (isPagi) stats[place].pagi++;
                if (isSore) stats[place].sore++;

                stats[place].students.push({
                    id: s.id,
                    nama: s.nama,
                    rfid: s.rfid,
                    isPagi,
                    isSore
                });
            });

            res.json({ stats, places: places.map(p => p.name) });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Recap Report
    app.get('/api/dashboard/recap', authenticateToken, async (req, res) => {
        const { month, year, placeName } = req.query; // e.g. 05, 2026
        const prefixDate = `${year}-${month.padStart(2, '0')}`; // YYYY-MM

        try {
            let santriQuery = `
                SELECT s.*, p.name as tempat_pengambilan 
                FROM santri s 
                LEFT JOIN places p ON s.place_id = p.id
            `;
            let santriParams = [];

            if (placeName && placeName !== 'Semua') {
                santriQuery += ' WHERE p.name = ?';
                santriParams.push(placeName);
            }

            const [santriData] = await pool.query(santriQuery, santriParams);
            const [attendanceData] = await pool.query('SELECT * FROM attendance WHERE date LIKE ?', [`${prefixDate}%`]);

            const recap = santriData.map(s => {
                const studentAtts = attendanceData.filter(a => a.santri_id === s.id);
                const dailyStats = {};

                const daysInMonth = new Date(year, month, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    const dayStr = `${prefixDate}-${i.toString().padStart(2, '0')}`;
                    const dayAtts = studentAtts.filter(a => a.date === dayStr);
                    const isPagi = dayAtts.some(a => a.time_slot === 'Pagi');
                    const isSore = dayAtts.some(a => a.time_slot === 'Sore');

                    let percentage = 0;
                    if (isPagi && isSore) percentage = 100;
                    else if (isPagi || isSore) percentage = 50;

                    dailyStats[i] = { percentage, isPagi, isSore };
                }

                const totalPercentages = Object.values(dailyStats).reduce((sum, day) => sum + day.percentage, 0);
                const monthlyAverage = totalPercentages / Object.keys(dailyStats).length;

                return {
                    id: s.id,
                    nama: s.nama,
                    tempat_pengambilan: s.tempat_pengambilan,
                    dailyStats,
                    monthlyAverage: monthlyAverage.toFixed(2)
                };
            });

            res.json(recap);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize database:", err);
});
