/**
 * Types TypeScript pour la table profiles enrichie
 * Correspond au schéma défini dans supabase-profiles-benchmarking-enhancement.sql
 */

// Type ENUM pour le type de pratique
export type PracticeType = 'LIBERAL' | 'HOPITAL' | 'CLINIQUE'

// Type pour le secteur de conventionnement
export type Sector = 1 | 2 | 3

// Interface complète du profil enrichi
export interface Profile {
  // Champs de base (existants)
  id: string
  nom_complet: string | null
  email: string | null
  cabinet: string | null
  adresse_cabinet: string | null
  specialite?: string | null // Ancien champ, à migrer vers specialty_id
  rpps?: string | null
  code_postal?: string | null
  zip_code?: string | null
  city?: string | null
  department_code?: string | null
  created_at?: string
  updated_at?: string

  // Nouveaux champs pour le benchmarking
  specialty_id: string | null
  specialty_group: string | null
  region_code: string | null
  city_zip_code: string | null
  practice_type: PracticeType | null
  sector: Sector | null
  is_optam: boolean | null
}

// Interface pour les données de benchmark
export interface BenchmarkData {
  specialty_id: string | null
  specialty_group: string | null
  region_code: string | null
  department_code: string | null
  practice_type: PracticeType | null
  sector: Sector | null
  average_score: number
  total_responses: number
  practitioner_count: number
}

// Interface pour le benchmark d'un praticien
export interface PractitionerBenchmark {
  practitioner_score: number | null
  regional_average: number | null
  specialty_average: number | null
  regional_specialty_average: number | null
  percentile_rank: number | null
  total_practitioners: number | null
}

// Interface pour les paramètres de recherche de benchmark
export interface BenchmarkQueryParams {
  specialty_id?: string | null
  region_code?: string | null
  department_code?: string | null
  specialty_group?: string | null
  practice_type?: PracticeType | null
  sector?: Sector | null
}

// Interface pour la création/mise à jour d'un profil
export interface ProfileUpdateData {
  nom_complet?: string | null
  email?: string | null
  cabinet?: string | null
  adresse_cabinet?: string | null
  code_postal?: string | null
  zip_code?: string | null
  city?: string | null
  department_code?: string | null
  specialty_id?: string | null
  specialty_group?: string | null
  region_code?: string | null
  city_zip_code?: string | null
  practice_type?: PracticeType | null
  sector?: Sector | null
  is_optam?: boolean | null
}

// Mapping des codes région vers noms de régions
export const REGION_NAMES: Record<string, string> = {
  '11': 'Île-de-France',
  '84': 'Auvergne-Rhône-Alpes',
  '27': 'Bourgogne-Franche-Comté',
  '53': 'Bretagne',
  '24': 'Centre-Val de Loire',
  '44': 'Grand Est',
  '76': 'Occitanie',
  '28': 'Normandie',
  '32': 'Hauts-de-France',
  '75': 'Nouvelle-Aquitaine',
  '52': 'Pays de la Loire',
  '93': 'Provence-Alpes-Côte d\'Azur',
  '94': 'Corse',
}

// Mapping des secteurs vers leurs libellés
export const SECTOR_LABELS: Record<Sector, string> = {
  1: 'Secteur 1',
  2: 'Secteur 2',
  3: 'Non conventionné',
}

// Mapping des types de pratique vers leurs libellés
export const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  LIBERAL: 'Libéral',
  HOPITAL: 'Hôpital',
  CLINIQUE: 'Clinique',
}


