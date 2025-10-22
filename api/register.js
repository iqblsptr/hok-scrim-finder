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
    // Enable CORS for testing
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
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    try {
        // 1. Ambil Data dari Frontend
        const data = req.body;
        const { teamName, email, password, logoBase64, country, province, whatsapp, captainName, status } = data;

        console.log('Extracted fields:', {
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
                message: 'Data wajib (email/password/nama tim) tidak lengkap.' 
            });
        }

        if (!country || !province || !whatsapp || !captainName) {
            console.log('Validation failed: missing optional but required fields');
            return res.status(400).json({ 
                message: 'Semua field wajib diisi (negara, provinsi, whatsapp, nama kapten).' 
            });
        }

        // 2. Cek Email Sudah Terdaftar
        console.log('Checking if email exists...');
        try {
            const userExists = await sql`SELECT email FROM teams WHERE email = ${email};`;
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
            return res.status(500).json({ 
                message: 'Gagal memeriksa email di database.',
                error: dbError.message 
            });
        }

        // 3. Proses Upload Gambar (Vercel Blob)
        let logoUrl = null;
        if (logoBase64) {
            console.log('Processing logo upload...');
            try {
                // Check if BLOB_READ_WRITE_TOKEN exists
                if (!process.env.BLOB_READ_WRITE_TOKEN) {
                    console.warn('BLOB_READ_WRITE_TOKEN not found, skipping logo upload');
                } else {
                    const [metadata, base64Content] = logoBase64.split(',');
                    const mimeType = metadata.match(/:(.*?);/)?.[1] || 'image/jpeg';
                    const logoBuffer = Buffer.from(base64Content, 'base64');
                    const filename = `teams/${teamName.replace(/\s/g, '-')}-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;

                    console.log('Uploading to Vercel Blob:', filename);
                    const blobResult = await put(filename, logoBuffer, {
                        access: 'public',
                        contentType: mimeType,
                    });
                    logoUrl = blobResult.url;
                    console.log('Logo uploaded successfully:', logoUrl);
                }
            } catch (uploadError) {
                console.error('Logo upload error:', uploadError);
                // Continue without logo if upload fails
                console.log('Continuing registration without logo');
            }
        }

        // 4. Hashing Password
        console.log('Hashing password...');
        let passwordHash;
        try {
            passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            console.log('Password hashed successfully');
        } catch (hashError) {
            console.error('Password hashing error:', hashError);
            return res.status(500).json({ 
                message: 'Gagal mengenkripsi password.',
                error: hashError.message 
            });
        }

        // 5. Simpan Data ke Vercel Postgres
        console.log('Inserting team into database...');
        let result;
        try {
            result = await sql`
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
                ) RETURNING id, team_name, email, logo_url, country, province, status, captain_name, whatsapp;
            `;
            console.log('Database insert successful, rows:', result.rowCount);
        } catch (dbInsertError) {
            console.error('Database insert error:', dbInsertError);
            return res.status(500).json({ 
                message: 'Gagal menyimpan data ke database.',
                error: dbInsertError.message,
                detail: dbInsertError.toString()
            });
        }
        
        const newTeam = result.rows[0];
        console.log('New team created:', newTeam);

        // 6. Convert snake_case ke camelCase untuk frontend
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
        
        // 7. Kirim Respons Sukses
        return res.status(201).json({ 
            message: 'Pendaftaran berhasil.', 
            team: convertedTeam
        });

    } catch (error) {
        console.error('=== Registration API Error ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        return res.status(500).json({ 
            message: 'Kesalahan internal server.', 
            error: error.message,
            errorType: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}   