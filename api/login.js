// /api/login.js

import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { email, password } = req.body;

        // 1. Ambil Hash Password dan Data Tim dari Database
        const userResult = await sql`
            SELECT id, email, password_hash, team_name, logo_url, country, province, status, captain_name, whatsapp 
            FROM teams 
            WHERE email = ${email};
        `;

        if (userResult.rowCount === 0) {
            return res.status(401).json({ message: 'Email tidak ditemukan.' });
        }

        const team = userResult.rows[0];
        
        // 2. Verifikasi Password (dengan bcrypt)
        const passwordMatch = await bcrypt.compare(password, team.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Password salah.' });
        }
        
        // 3. Ambil Semua Tim Tersedia untuk tampilan 'Cari Lawan'
        const allTeamsResult = await sql`
            SELECT id, team_name, logo_url, country, province, status, captain_name, whatsapp, email
            FROM teams;
        `;

        // Hapus password hash sebelum mengirim data ke frontend
        delete team.password_hash; 

        // 4. Kirim Respons Sukses
        return res.status(200).json({ 
            message: 'Login berhasil.', 
            team: team,
            allTeams: allTeamsResult.rows
        });

    } catch (error) {
        console.error('Login API Error:', error);
        return res.status(500).json({ message: 'Kesalahan internal server.', error: error.message });
    }
}