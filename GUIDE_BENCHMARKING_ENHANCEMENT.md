# Guide d'Enrichissement de la Table Profiles pour le Benchmarking

## 📋 Vue d'ensemble

Ce guide explique comment enrichir la table `profiles` pour permettre un benchmarking régional et par spécialité médicale précis. Les modifications incluent l'ajout de colonnes pour la géolocalisation, la spécialité, le type de pratique et le secteur de conventionnement.

## 🚀 Installation

### Étape 1: Exécuter la migration SQL

1. Connectez-vous à votre projet Supabase
2. Ouvrez l'éditeur SQL
3. Exécutez le fichier `supabase-profiles-benchmarking-enhancement.sql`

```sql
-- Le script va :
-- 1. Créer le type ENUM practice_type_enum
-- 2. Ajouter les nouvelles colonnes
-- 3. Créer les index optimisés
-- 4. Créer les fonctions de benchmarking
-- 5. Créer le trigger pour mettre à jour automatiquement region_code
```

### Étape 2: Vérifier la migration

```sql
-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Vérifier que les index ont été créés
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles';
```

## 📊 Nouvelles Colonnes Ajoutées

### Colonnes de Spécialité
- **`specialty_id`** (TEXT) : Identifiant de la spécialité médicale
- **`specialty_group`** (TEXT) : Groupe de spécialités pour le clustering

### Colonnes Géographiques
- **`region_code`** (TEXT) : Code de la région administrative (ex: "11" pour Île-de-France)
- **`city_zip_code`** (TEXT) : Code postal complet avec ville

### Colonnes de Pratique
- **`practice_type`** (ENUM) : Type de structure (`LIBERAL`, `HOPITAL`, `CLINIQUE`)
- **`sector`** (INTEGER) : Secteur de conventionnement (1, 2, ou 3)
- **`is_optam`** (BOOLEAN) : Indique si le praticien a signé un contrat OPTAM

## 🔍 Index Créés

Les index suivants ont été créés pour optimiser les requêtes de benchmarking :

1. **`profiles_specialty_region_idx`** : Index composite sur `(specialty_id, region_code)`
2. **`profiles_specialty_group_dept_idx`** : Index composite sur `(specialty_group, department_code)`
3. **`profiles_region_code_idx`** : Index sur `region_code`
4. **`profiles_specialty_id_idx`** : Index sur `specialty_id`
5. **`profiles_practice_type_idx`** : Index sur `practice_type`
6. **`profiles_sector_practice_idx`** : Index composite sur `(sector, practice_type)`
7. **`profiles_is_optam_idx`** : Index sur `is_optam`

## 🛠️ Fonctions SQL Disponibles

### 1. `get_benchmark_average()`

Calcule la moyenne de score de satisfaction selon plusieurs critères.

**Paramètres :**
- `p_specialty_id` (TEXT, optionnel)
- `p_region_code` (TEXT, optionnel)
- `p_department_code` (TEXT, optionnel)
- `p_specialty_group` (TEXT, optionnel)
- `p_practice_type` (practice_type_enum, optionnel)
- `p_sector` (INTEGER, optionnel)

**Exemple d'utilisation :**

```sql
SELECT * FROM get_benchmark_average(
  p_specialty_id := 'PODOLOGIE',
  p_region_code := '11',
  p_practice_type := 'LIBERAL',
  p_sector := 1
);
```

### 2. `get_practitioner_benchmark()`

Compare les performances d'un praticien avec les moyennes régionales et par spécialité.

**Paramètres :**
- `p_user_id` (UUID) : ID du praticien

**Exemple d'utilisation :**

```sql
SELECT * FROM get_practitioner_benchmark('user-uuid-here');
```

## 💻 Utilisation dans le Code TypeScript

### Importer les types

```typescript
import type { Profile, BenchmarkData, PractitionerBenchmark } from '@/types/profile'
import { getBenchmarkAverage, getPractitionerBenchmark } from '@/lib/profile-benchmarking'
```

### Exemple : Récupérer un benchmark

```typescript
import { supabase } from '@/lib/supabase'

// Récupérer le benchmark pour une région et spécialité
const benchmark = await getBenchmarkAverage(supabase, {
  region_code: '11',
  specialty_id: 'PODOLOGIE',
  practice_type: 'LIBERAL',
  sector: 1
})

console.log('Score moyen:', benchmark[0]?.average_score)
console.log('Nombre de praticiens:', benchmark[0]?.practitioner_count)
```

### Exemple : Benchmark d'un praticien

```typescript
const practitionerBenchmark = await getPractitionerBenchmark(
  supabase,
  userId
)

if (practitionerBenchmark) {
  console.log('Score du praticien:', practitionerBenchmark.practitioner_score)
  console.log('Moyenne régionale:', practitionerBenchmark.regional_average)
  console.log('Moyenne spécialité:', practitionerBenchmark.specialty_average)
  console.log('Rang percentile:', practitionerBenchmark.percentile_rank)
}
```

### Exemple : Mettre à jour un profil

```typescript
import { updateProfileWithBenchmarking } from '@/lib/profile-benchmarking'

await updateProfileWithBenchmarking(supabase, userId, {
  specialty_id: 'PODOLOGIE',
  specialty_group: 'Spécialités médicales',
  practice_type: 'LIBERAL',
  sector: 1,
  is_optam: false,
  region_code: '11',
  city_zip_code: '75001 Paris'
})
```

## 🔄 Mise à Jour Automatique de `region_code`

Un trigger SQL a été créé pour mettre à jour automatiquement `region_code` lorsque `department_code` est modifié. Le mapping est basé sur les codes départementaux français.

**Mapping simplifié :**
- Départements 75, 77, 78, 91, 92, 93, 94, 95 → Région 11 (Île-de-France)
- Départements 01, 03, 07, 15, 26, 38, 42, 43, 63, 69, 73, 74 → Région 84 (Auvergne-Rhône-Alpes)
- ... (voir le fichier SQL pour le mapping complet)

## 📝 Exemples de Requêtes SQL

Consultez le fichier `EXAMPLES_BENCHMARKING_QUERIES.sql` pour des exemples détaillés de requêtes, notamment :

- Tarif moyen par spécialité dans une région
- Top 10 des praticiens par région et spécialité
- Comparaison des secteurs par région
- Analyse par type de pratique
- Distribution géographique des praticiens

## ⚠️ Notes Importantes

1. **Migration des données existantes** : Le script migre automatiquement la colonne `specialite` vers `specialty_id` si elle existe.

2. **Performance** : Les index créés optimisent les requêtes de benchmarking. Pour les requêtes complexes, utilisez `EXPLAIN ANALYZE` pour vérifier les performances.

3. **Sécurité** : Les fonctions SQL utilisent `SECURITY DEFINER` pour s'exécuter avec les privilèges du propriétaire. Assurez-vous que les politiques RLS sont correctement configurées.

4. **Validation** : Validez toujours les données avant de les insérer, notamment pour `sector` (doit être 1, 2 ou 3) et `practice_type` (doit être une valeur de l'ENUM).

## 🔧 Maintenance

### Mettre à jour le mapping région/département

Si vous devez modifier le mapping région/département, éditez la fonction `update_region_code_from_department()` dans le fichier SQL.

### Ajouter de nouvelles spécialités

Pour ajouter de nouvelles spécialités, mettez à jour la table `specialties` (si vous en avez une) ou utilisez directement les valeurs TEXT dans `specialty_id`.

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Fichier de migration SQL](./supabase-profiles-benchmarking-enhancement.sql)
- [Exemples de requêtes](./EXAMPLES_BENCHMARKING_QUERIES.sql)


