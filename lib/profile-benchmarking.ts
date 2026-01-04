/**
 * Fonctions utilitaires pour le benchmarking des profils
 * Utilise les fonctions SQL définies dans supabase-profiles-benchmarking-enhancement.sql
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  BenchmarkData,
  BenchmarkQueryParams,
  PractitionerBenchmark,
  Profile,
  ProfileUpdateData,
} from '@/types/profile'

/**
 * Récupère les données de benchmark selon les critères fournis
 */
export async function getBenchmarkAverage(
  supabase: SupabaseClient,
  params: BenchmarkQueryParams
): Promise<BenchmarkData[]> {
  try {
    const { data, error } = await supabase.rpc('get_benchmark_average', {
      p_specialty_id: params.specialty_id || null,
      p_region_code: params.region_code || null,
      p_department_code: params.department_code || null,
      p_specialty_group: params.specialty_group || null,
      p_practice_type: params.practice_type || null,
      p_sector: params.sector || null,
    })

    if (error) {
      console.error('[Benchmarking] Erreur get_benchmark_average:', error)
      throw error
    }

    return (data || []) as BenchmarkData[]
  } catch (err: any) {
    console.error('[Benchmarking] Erreur lors de la récupération du benchmark:', err)
    throw err
  }
}

/**
 * Récupère le benchmark d'un praticien spécifique
 */
export async function getPractitionerBenchmark(
  supabase: SupabaseClient,
  userId: string
): Promise<PractitionerBenchmark | null> {
  try {
    const { data, error } = await supabase.rpc('get_practitioner_benchmark', {
      p_user_id: userId,
    })

    if (error) {
      console.error('[Benchmarking] Erreur get_practitioner_benchmark:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return null
    }

    return data[0] as PractitionerBenchmark
  } catch (err: any) {
    console.error('[Benchmarking] Erreur lors de la récupération du benchmark praticien:', err)
    throw err
  }
}

/**
 * Met à jour un profil avec les nouvelles colonnes de benchmarking
 */
export async function updateProfileWithBenchmarking(
  supabase: SupabaseClient,
  userId: string,
  updateData: ProfileUpdateData
): Promise<{ error: any }> {
  try {
    // Préparer les données en s'assurant que les valeurs null sont bien gérées
    const cleanData: any = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    // Supprimer les clés avec des valeurs undefined
    Object.keys(cleanData).forEach((key) => {
      if (cleanData[key] === undefined) {
        delete cleanData[key]
      }
    })

    const { error } = await supabase
      .from('profiles')
      .update(cleanData)
      .eq('id', userId)

    if (error) {
      console.error('[Profile] Erreur lors de la mise à jour:', error)
      return { error }
    }

    return { error: null }
  } catch (err: any) {
    console.error('[Profile] Erreur exception lors de la mise à jour:', err)
    return { error: err }
  }
}

/**
 * Récupère un profil complet avec toutes les colonnes de benchmarking
 */
export async function getProfileWithBenchmarking(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        id,
        nom_complet,
        email,
        cabinet,
        adresse_cabinet,
        code_postal,
        zip_code,
        city,
        department_code,
        specialty_id,
        specialty_group,
        region_code,
        city_zip_code,
        practice_type,
        sector,
        is_optam,
        created_at,
        updated_at
        `
      )
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profil non trouvé
        return null
      }
      console.error('[Profile] Erreur lors de la récupération:', error)
      throw error
    }

    return data as Profile
  } catch (err: any) {
    console.error('[Profile] Erreur exception lors de la récupération:', err)
    throw err
  }
}

/**
 * Calcule automatiquement le region_code depuis le department_code
 * (fonction utilitaire côté client, le trigger SQL fait déjà cela automatiquement)
 */
export function calculateRegionCodeFromDepartment(departmentCode: string | null): string | null {
  if (!departmentCode) return null

  const dept = departmentCode.trim()

  // Mapping simplifié des départements vers les régions
  const regionMap: Record<string, string> = {
    // Île-de-France
    '75': '11', '77': '11', '78': '11', '91': '11', '92': '11', '93': '11', '94': '11', '95': '11',
    // Auvergne-Rhône-Alpes
    '01': '84', '03': '84', '07': '84', '15': '84', '26': '84', '38': '84', '42': '84', '43': '84', '63': '84', '69': '84', '73': '84', '74': '84',
    // Bourgogne-Franche-Comté
    '21': '27', '25': '27', '39': '27', '58': '27', '70': '27', '71': '27', '89': '27', '90': '27',
    // Bretagne
    '22': '53', '29': '53', '35': '53', '56': '53',
    // Centre-Val de Loire
    '18': '24', '28': '24', '36': '24', '37': '24', '41': '24', '45': '24',
    // Grand Est
    '08': '44', '10': '44', '51': '44', '52': '44', '54': '44', '55': '44', '57': '44', '67': '44', '68': '44', '88': '44',
    // Occitanie
    '11': '76', '30': '76', '34': '76', '48': '76', '66': '76',
    // Normandie
    '14': '28', '27': '28', '50': '28', '61': '28', '76': '28',
    // Hauts-de-France
    '02': '32', '59': '32', '60': '32', '62': '32', '80': '32',
    // Nouvelle-Aquitaine
    '16': '75', '17': '75', '19': '75', '23': '75', '24': '75', '33': '75', '40': '75', '47': '75', '64': '75', '79': '75', '86': '75', '87': '75',
    // Pays de la Loire
    '44': '52', '49': '52', '53': '52', '72': '52', '85': '52',
    // Provence-Alpes-Côte d'Azur
    '04': '93', '05': '93', '06': '93', '13': '93', '83': '93', '84': '93',
    // Corse
    '2A': '94', '2B': '94',
  }

  return regionMap[dept] || null
}


