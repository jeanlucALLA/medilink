const TOKEN = 'sbp_2fac144e3694e9cdcc5f8e0f9e91116f1ad6aa97';
const PROJECT = 'aqzdhyctnxxxaeuasmmn';
const url = `https://api.supabase.com/v1/projects/${PROJECT}/database/query`;

async function query(sql) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql })
    });
    return res.json();
}

async function run() {
    // Step 1: Mark all overdue scheduled questionnaires as expired
    // These are questionnaires where send date has passed but status is still pending/programmé/en_attente
    console.log('Step 1: Marking overdue scheduled questionnaires as expiré...');
    const mark = await query(`
    UPDATE questionnaires 
    SET status = 'expiré', statut = 'expiré'
    WHERE status IN ('programmé', 'en_attente', 'pending')
    AND patient_email IS NOT NULL
    AND send_after_days IS NOT NULL
    AND (created_at::date + send_after_days * interval '1 day')::date < CURRENT_DATE - interval '3 days'
    RETURNING id, patient_email, created_at::date as created, send_after_days
  `);
    console.log('Marked as expiré:', Array.isArray(mark) ? mark.length : JSON.stringify(mark, null, 2));

    // Step 2: Sync statut = status for ALL records where they differ
    console.log('\nStep 2: Syncing statut column to match status for all records...');
    const sync = await query(`
    UPDATE questionnaires 
    SET statut = status
    WHERE statut != status
    RETURNING id
  `);
    console.log('Synced rows:', Array.isArray(sync) ? sync.length : JSON.stringify(sync, null, 2));

    // Step 3: Final verification
    console.log('\nStep 3: Final state:');
    const verify = await query("SELECT statut, status, COUNT(*) as total FROM questionnaires GROUP BY statut, status ORDER BY total DESC");
    if (Array.isArray(verify)) {
        verify.forEach(r => console.log(`  statut='${r.statut}' | status='${r.status}' | count=${r.total}`));
        console.log('\nTotal:', verify.reduce((s, r) => s + parseInt(r.total), 0));
    } else {
        console.log(JSON.stringify(verify, null, 2));
    }
}

run().catch(console.error);
