const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

let pool;

async function initDB() {
    if (pool) return pool;

    try {
        // Create pool without database first to create database if not exists
        const initPool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
        });

        const dbName = process.env.DB_NAME || 'rfid_attendance';
        try {
            await initPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
            console.log(`Database verification/creation successful for: ${dbName}`);
        } catch (e) {
            console.log('Database already exists or no permission to create. Proceeding...');
        }
        await initPool.end();

        // Connect to the specific database
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName,
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
        });

        // Initialize Tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('superadmin', 'admin') DEFAULT 'admin',
                is_active BOOLEAN DEFAULT TRUE,
                profile_photo LONGTEXT
            )
        `);

        // Migration for existing tables
        try { await pool.query('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE'); } catch(e) {}
        try { await pool.query('ALTER TABLE users ADD COLUMN profile_photo LONGTEXT'); } catch(e) {}


        await pool.query(`
            CREATE TABLE IF NOT EXISTS places (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS santri (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rfid VARCHAR(255) UNIQUE NOT NULL,
                nama VARCHAR(255) NOT NULL,
                place_id INT NOT NULL,
                FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                santri_id INT NOT NULL,
                date DATE NOT NULL,
                time_slot ENUM('Pagi', 'Sore') NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE
            )
        `);

        // Seeders: Default Superadmin
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', ['admin']);
        if (users.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'superadmin']);
            console.log('Default superadmin created: admin / admin123');
        }

        // Seeders: Default Places
        const [places] = await pool.query('SELECT * FROM places');
        if (places.length === 0) {
            const defaultPlaces = ['Keamanan', 'Kesehatan', 'Kantor', 'Mang Zaki'];
            for (const p of defaultPlaces) {
                await pool.query('INSERT INTO places (name) VALUES (?)', [p]);
            }
            console.log('Default places created.');
        }

        return pool;
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

module.exports = { initDB };
