'use client'

import { useState } from 'react'

export default function TestSupabase() {
  const [loading, setLoading] = useState(false)

  const testSupabase = async () => {
    setLoading(true)
    
    try {
      // Vérifier les variables d'environnement
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        alert('ERREUR: Variables d\'environnement manquantes\n\n' +
              `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}\n` +
              `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✓' : '✗'}`)
        setLoading(false)
        return
      }

      console.log('🔍 Test de connexion Supabase...')
      console.log('URL:', supabaseUrl)
      console.log('Key:', supabaseKey ? 'Présente' : 'Manquante')

      // Import dynamique de Supabase
      const { supabase } = await import('@/lib/supabase')
      
      // Test 1: Vérifier l'authentification (getUser)
      console.log('📋 Test 1: Vérification de l\'authentification...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Erreur auth:', authError)
        alert(`ERREUR AUTHENTIFICATION:\n\n${authError.message}\n\nCode: ${authError.status || 'N/A'}`)
        setLoading(false)
        return
      }

      console.log('✅ Utilisateur:', user ? `Connecté (${user.id})` : 'Non connecté')

      // Test 2: Tenter de lire la table profiles
      console.log('📋 Test 2: Lecture de la table profiles...')
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)

      if (profilesError) {
        console.error('❌ Erreur profiles:', profilesError)
        alert(`ERREUR LECTURE PROFILES:\n\n${profilesError.message}\n\nCode: ${profilesError.code || 'N/A'}\n\nDétails: ${profilesError.details || 'N/A'}`)
        setLoading(false)
        return
      }

      // Succès
      console.log('✅ Succès! Données récupérées:', profilesData)
      const successMessage = `SUCCÈS!\n\n` +
        `Utilisateur: ${user ? `Connecté (${user.email || user.id})` : 'Non connecté'}\n\n` +
        `Profiles trouvés: ${profilesData?.length || 0}\n\n` +
        `Données: ${JSON.stringify(profilesData, null, 2)}`
      
      alert(successMessage)
      
    } catch (err: any) {
      console.error('❌ Erreur complète:', err)
      const errorMessage = `ERREUR INATTENDUE:\n\n${err.message || err.toString()}\n\n` +
        `Type: ${err.constructor.name}\n\n` +
        `Stack: ${err.stack ? err.stack.substring(0, 200) : 'N/A'}`
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Test de Connexion Supabase
        </h1>
        
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Variables d&apos;environnement:</strong>
            </p>
            <p className="text-xs text-gray-500">
              NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Présente' : '✗ Manquante'}
            </p>
            <p className="text-xs text-gray-500">
              NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Présente' : '✗ Manquante'}
            </p>
          </div>
        </div>

        <button
          onClick={testSupabase}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Test en cours...' : 'Tester Supabase'}
        </button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Ouvrez la console (F12) pour voir les logs détaillés
        </p>
      </div>
    </div>
  )
}


