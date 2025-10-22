// /api/teams.js
// Optional endpoint to fetch all teams without logging in

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Fetch all teams (excluding password_hash for security)
        const result = await sql`
            SELECT id, team_name, logo_url, country, province, status, captain_name, whatsapp, email
            FROM teams
            ORDER BY created_at DESC;
        `;

        // Convert snake_case to camelCase
        const teams = result.rows.map(team => ({
            id: team.id,
            teamName: team.team_name,
            logo: team.logo_url,
            country: team.country,
            province: team.province,
            status: team.status,
            captainName: team.captain_name,
            whatsapp: team.whatsapp,
            email: team.email
        }));

        return res.status(200).json({ 
            teams,
            count: teams.length
        });

    } catch (error) {
        console.error('Teams API Error:', error);
        return res.status(500).json({ 
            message: 'Kesalahan internal server.', 
            error: error.message 
        });
    }
}