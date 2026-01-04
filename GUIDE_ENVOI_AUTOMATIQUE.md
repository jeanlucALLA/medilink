# Guide : Automatisation de l'envoi des questionnaires

Ce guide explique comment configurer l'envoi automatique des questionnaires avec Supabase Edge Functions et Resend.

## 📋 Vue d'ensemble

Le système fonctionne en 3 étapes :
1. **Création du questionnaire** : Le praticien crée un questionnaire avec un délai d'envoi (`send_after_days`)
2. **Sauvegarde dans Supabase** : Le questionnaire est enregistré avec `status = 'programmé'` et `send_after_days = X`
3. **Envoi automatique** : Une Edge Function scanne quotidiennement et envoie les emails via Resend

## 🔧 Configuration

### 1. Fonction de sauvegarde (déjà implémentée)

La fonction `app/api/questionnaire/route.ts` enregistre déjà `send_after_days` dans Supabase :

```typescript
send_after_days: sendDelayDays || null, // Délai en jours choisi par le praticien
```

### 2. Edge Function Supabase

**Fichier créé** : `supabase/functions/send-scheduled-questionnaires/index.ts`

**Logique de la fonction** :
- Récupère tous les questionnaires avec `status = 'programmé'` et `patient_email IS NOT NULL`
- Pour chaque questionnaire, calcule : `date_envoi = created_at + send_after_days`
- Si `date_envoi <= aujourd'hui`, envoie l'email via Resend
- Met à jour le statut à `'envoyé'` après envoi réussi

**Variables d'environnement nécessaires** :
- `RESEND_API_KEY` : Votre clé API Resend
- `SUPABASE_URL` : URL de votre projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role (automatique)
- `NEXT_PUBLIC_APP_URL` : URL de votre application (ex: https://medi-link.fr)

### 3. Configuration Resend

1. Créez un compte sur [Resend.com](https://resend.com)
2. Générez une clé API
3. Ajoutez-la dans Supabase :
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### 4. Déploiement de l'Edge Function

```bash
# Depuis la racine du projet
supabase functions deploy send-scheduled-questionnaires
```

### 5. Configuration du Cron Job (pg_cron)

Exécutez le script SQL `supabase-scheduled-questionnaires-cron.sql` dans l'éditeur SQL de Supabase.

**Important** : Remplacez `[VOTRE_PROJET]` par l'URL de votre projet Supabase.

Le cron job s'exécutera **tous les jours à 8h00 UTC**.

## 📊 Structure de la table `questionnaires`

La table doit contenir ces colonnes :

```sql
CREATE TABLE questionnaires (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  pathologie TEXT,
  questions JSONB,
  patient_email TEXT,
  status TEXT DEFAULT 'non programmé', -- 'programmé' ou 'envoyé'
  send_after_days INTEGER, -- Nombre de jours après création
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔍 Comment ça fonctionne

### Exemple concret :

1. **Jour 0** : Le praticien crée un questionnaire avec `send_after_days = 14`
   - Le questionnaire est enregistré avec `status = 'programmé'`
   - `created_at = 2024-01-01 10:00:00`

2. **Jour 1-13** : La fonction scanne mais ne trouve rien à envoyer
   - `created_at + 14 jours = 2024-01-15`
   - Aujourd'hui = 2024-01-14 → Pas encore le moment

3. **Jour 14** : La fonction scanne et trouve le questionnaire
   - `created_at + 14 jours = 2024-01-15`
   - Aujourd'hui = 2024-01-15 → ✅ Envoi de l'email
   - Statut mis à jour à `'envoyé'`

## 🧪 Test manuel

Pour tester la fonction manuellement :

```bash
curl -X POST https://[VOTRE_PROJET].supabase.co/functions/v1/send-scheduled-questionnaires \
  -H "Authorization: Bearer [VOTRE_SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"
```

## 📝 Logs et monitoring

La fonction logge :
- Le nombre de questionnaires trouvés
- Les emails envoyés avec succès
- Les erreurs éventuelles
- Les IDs des questionnaires traités

Consultez les logs dans Supabase Dashboard > Edge Functions > Logs.

## ⚠️ Points d'attention

1. **Fuseau horaire** : Le cron job s'exécute en UTC. Ajustez l'heure si nécessaire.
2. **Rate limiting Resend** : Vérifiez les limites de votre plan Resend (gratuit = 100 emails/jour).
3. **Erreurs** : Si un email échoue, le questionnaire reste en `'programmé'` et sera réessayé le lendemain.
4. **Sécurité** : La fonction vérifie l'autorisation via `SUPABASE_SERVICE_ROLE_KEY`.

## 🚀 Prochaines étapes

1. Déployer la fonction : `supabase functions deploy send-scheduled-questionnaires`
2. Configurer les secrets : `supabase secrets set RESEND_API_KEY=...`
3. Exécuter le script SQL pour créer le cron job
4. Tester avec un questionnaire de test (délai court, ex: 1 jour)
5. Vérifier les logs et les emails reçus



