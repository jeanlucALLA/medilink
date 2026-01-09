console.log('Initialisation Supabase...')

import { createClient, SupabaseClient } from '@supabase/supabase-js'

console.log('📦 Import de createClient réussi')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

console.log('🔑 Variables d\'environnement:')
console.log('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `✓ (${supabaseUrl.substring(0, 30)}...)` : '✗ Manquante')
console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `✓ (${supabaseAnonKey.substring(0, 20)}...)` : '✗ Manquante')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erreur: Variables d\'environnement Supabase manquantes')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗')
}

// Vérification que l'URL est bien chargée
if (typeof window !== 'undefined') {
  console.log('🌐 Environnement client détecté')
  console.log('Supabase URL chargée:', supabaseUrl ? '✓' : '✗')
}

let supabase: SupabaseClient
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.log('✅ Client Supabase créé avec succès')
} catch (error: any) {
  console.error('❌ Erreur lors de la création du client Supabase:', error)
  console.error('Message:', error?.message)
  console.error('Stack:', error?.stack)

  // Créer un client vide pour éviter les erreurs
  supabase = createClient('', '')
  console.warn('⚠️ Client Supabase créé avec des valeurs vides')
}

export { supabase }
