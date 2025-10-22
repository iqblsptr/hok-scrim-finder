// /api/register.js

import { sql } from '@vercel/postgres';
import { put } from '@vercel/blob';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    console.log('=== Registration Request Started ===');

    try {
        // Check database connection
        console.log('Checking database connection...');
        console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
        
        if (!process.env.POSTGRES_URL) {
            console.error('POSTGRES_URL environment variable is not set!');
            return res.status(500).json({ 
                message: 'Database not configured. Please contact administrator.',
                error: 'POSTGRES_URL not found in environment variables'
            });
        }

        // Test database connection
        try {
            await sql`SELECT 1 as test`;
            console.log('Database connection OK');
        } catch (connError) {
            console.error('Database connection failed:', connError);
            return res.status(500).json({ 
                message: 'Tidak dapat terhubung ke database.',
                error: connError.message,
                hint: 'Periksa konfigurasi database di Vercel Dashboard'
            });
        }

        // 1. Ambil Data dari Frontend
        const data = req.body;
        const { teamName, email, password, logoBase64, country, province, whatsapp, captainName, status } = data;

        console.log('Request data:', {
            teamName,
            email,
            hasPassword: !!password,
            hasLogo: !!logoBase64,
            country,
            province,
            whatsapp,
            captainName,
            status
        });

        // Validasi input
        if (!email || !password || !teamName) {
            console.log('Validation failed: missing required fields');
            return res.status(400).json({ 
                message: 'Email, password, dan nama tim wajib diisi.' 
            });
        }

        if (!country || !province || !whatsapp || !captainName) {
            console.log('Validation failed: missing fields');
            return res.status(400).json({ 
                message: 'Semua field wajib diisi.' 
            });
        }

        // 2. Cek Email Sudah Terdaftar
        console.log('Checking if email exists...');
        try {
            const userExists = await sql`
                SELECT email FROM teams WHERE email = ${email}
            `;
            console.log('Email check result:', userExists.rowCount);
            
            if (userExists.rowCount > 0) {
                console.log('Email already exists');
                return res.status(409).json({ 
                    message: 'Email sudah terdaftar.', 
                    code: 'emailAlreadyExists' 
                });
            }
        } catch (dbError) {
            console.error('Database check error:', dbError);
            console.error('Error details:', {
                name: dbError.name,
                message: dbError.message,
                code: dbError.code
            });
            return res.status(500).json({ 
                message: 'Gagal memeriksa email di database.',
                error: dbError.message,
                errorCode: dbError.code,
                hint: 'Pastikan tabel "teams" sudah dibuat di database'
            });
        }

        // 3. Proses Upload Gambar (Optional)
        let logoUrl = null;
        if (logoBase64 && process.env.BLOB_READ_WRITE_TOKEN) {
            console.log('Processing logo upload...');
            try {
                const [metadata, base64Content] = logoBase64.split(',');
                const mimeType = metadata.match(/:(.*?);/)?.[1] || 'image/jpeg';
                const logoBuffer = Buffer.from(base64Content, 'base64');
                const filename = `teams/${teamName.replace(/\s/g, '-')}-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;

                const blobResult = await put(filename, logoBuffer, {
                    access: 'public',
                    contentType: mimeType,
                });
                logoUrl = blobResult.url;
                console.log('Logo uploaded:', logoUrl);
            } catch (uploadError) {
                console.error('Logo upload error (continuing):', uploadError.message);
            }
        } else {
            console.log('Skipping logo upload (no token or no image)');
        }

        // 4. Hashing Password
        console.log('Hashing password...');
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        console.log('Password hashed');

        // 5. Simpan Data ke Database
        console.log('Inserting team into database...');
        const result = await sql`
            INSERT INTO teams (
                team_name, email, password_hash, logo_url, country, province, 
                whatsapp, status, created_at, captain_name
            ) VALUES (
                ${teamName}, 
                ${email}, 
                ${passwordHash}, 
                ${logoUrl}, 
                ${country}, 
                ${province}, 
                ${whatsapp}, 
                ${status || 'available'}, 
                NOW(), 
                ${captainName}
            ) RETURNING id, team_name, email, logo_url, country, province, status, captain_name, whatsapp
        `;
        
        console.log('Insert successful');
        const newTeam = result.rows[0];

        // 6. Convert untuk frontend
        const convertedTeam = {
            id: newTeam.id,
            teamName: newTeam.team_name,
            logo: newTeam.logo_url,
            country: newTeam.country,
            province: newTeam.province,
            status: newTeam.status,
            captainName: newTeam.captain_name,
            whatsapp: newTeam.whatsapp,
            email: newTeam.email
        };

        console.log('=== Registration Successful ===');
        
        return res.status(201).json({ 
            message: 'Pendaftaran berhasil.', 
            team: convertedTeam
        });

    } catch (error) {
        console.error('=== Registration Error ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        return res.status(500).json({ 
            message: 'Kesalahan internal server.', 
            error: error.message,
            errorType: error.constructor.name
        });
    }
}