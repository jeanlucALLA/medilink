// Script de test pour envoyer un email immédiatement via l'Edge Function
// Usage: node test-email-send.js

const fetch = require('node-fetch');

// ⚠️ REMPLACEZ CES VALEURS PAR LES VÔTRES
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

async function testEmailSend() {
  console.log('🧪 Test d\'envoi d\'email via Edge Function...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-delayed-followup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Succès !');
      console.log('📊 Résultats:', JSON.stringify(data, null, 2));
      
      if (data.total === 0) {
        console.log('\n⚠️  Aucun questionnaire à envoyer.');
        console.log('💡 Pour tester, créez un questionnaire et mettez à jour date_envoi_suivi à NOW()');
      } else {
        console.log(`\n📧 ${data.success} email(s) envoyé(s) avec succès`);
        if (data.errors > 0) {
          console.log(`❌ ${data.errors} erreur(s)`);
        }
      }
    } else {
      console.error('❌ Erreur:', data);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'appel:', error.message);
  }
}

// Vérifier que les variables sont configurées
if (SUPABASE_URL.includes('YOUR_PROJECT_REF') || SERVICE_ROLE_KEY.includes('YOUR_SERVICE')) {
  console.error('❌ Veuillez configurer SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  console.log('\nOptions:');
  console.log('1. Modifiez les variables dans ce fichier');
  console.log('2. Utilisez des variables d\'environnement:');
  console.log('   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node test-email-send.js');
  process.exit(1);
}

testEmailSend();



