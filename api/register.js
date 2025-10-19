// /api/register.js

import { sql } from '@vercel/postgres';
import { put } from '@vercel/blob';
import bcrypt from 'bcrypt';
// Gunakan 'dotenv' hanya di lingkungan lokal jika perlu
// import 'dotenv/config'; 

// Wajib: Konfigurasi tingkat keamanan hashing password
const SALT_ROUNDS = 10; 

// Konfigurasi ini memungkinkan Vercel untuk mem-parsing request body (diperlukan untuk upload file)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Batas ukuran file (sesuaikan dengan batas 10MB di frontend jika perlu)
    },
  },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // 1. Ambil Data dari Frontend (dari JSON body)
        const data = req.body;
        const { teamName, email, password, logoBase64, ...restOfData } = data;

        if (!email || !password || !teamName) {
            return res.status(400).json({ message: 'Data wajib (email/password/nama tim) tidak lengkap.' });
        }

        // 2. Cek Email Sudah Terdaftar (di database)
        const userExists = await sql`SELECT email FROM teams WHERE email = ${email};`;
        if (userExists.rowCount > 0) {
            return res.status(409).json({ message: 'Email sudah terdaftar.', code: 'emailAlreadyExists' });
        }

        // --- 3. Proses Upload Gambar (Vercel Blob) ---
        let logoUrl = null;
        if (logoBase64) {
            // Mengambil tipe MIME dan konten base64
            const [metadata, base64Content] = logoBase64.split(',');
            const mimeType = metadata.match(/:(.*?);/)?.[1] || 'image/jpeg';
            const logoBuffer = Buffer.from(base64Content, 'base64');
            const filename = `${teamName.replace(/\s/g, '-')}-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;

            // Unggah file ke Vercel Blob
            const blobResult = await put(filename, logoBuffer, {
                access: 'public', // Agar gambar dapat diakses publik
                contentType: mimeType,
            });
            logoUrl = blobResult.url;
        }

        // --- 4. Hashing Password (Keamanan Wajib) ---
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // 5. Simpan Data ke Vercel Postgres
        // CATATAN: Pastikan Anda telah membuat tabel 'teams' dengan kolom yang sesuai!
        const result = await sql`
            INSERT INTO teams (
                team_name, email, password_hash, logo_url, country, province, whatsapp, status, created_at, captain_name
            ) VALUES (
                ${teamName}, ${email}, ${passwordHash}, ${logoUrl}, ${restOfData.country}, 
                ${restOfData.province}, ${restOfData.whatsapp}, ${restOfData.status}, NOW(), ${restOfData.captainName}
            ) RETURNING id, team_name, email, logo_url, country, province, status, captain_name;
        `;
        
        const newTeam = result.rows[0];

        // 6. Kirim Respons Sukses
        return res.status(201).json({ 
            message: 'Pendaftaran berhasil.', 
            team: newTeam
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ message: 'Kesalahan internal server.', error: error.message });
    }
}