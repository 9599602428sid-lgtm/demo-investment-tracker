const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'db.ckyjbocvgjyqvwfbqlkc.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Siddhantsuri@2004',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase!');
    
    const sql = fs.readFileSync('./supabase-setup.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ All tables created and dummy data seeded!');
    
    // Verify
    const res = await client.query('SELECT type, COUNT(*) as count FROM public.investments GROUP BY type ORDER BY type');
    console.log('\nInvestment counts by type:');
    res.rows.forEach(r => console.log(`  ${r.type}: ${r.count}`));
    
    const total = await client.query('SELECT COUNT(*) as total FROM public.investments');
    console.log(`\nTotal investments: ${total.rows[0].total}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
