# Guide : Envoi automatique avec purge RGPD

Ce guide explique le fonctionnement de l'Edge Function `send-delayed-emails` qui purge immédiatement les données nominatives après envoi.

## 🔒 Conformité RGPD

### Principe de purge immédiate

Dès que l'email est envoyé avec succès (status 200 de Resend), la fonction effectue **3 actions atomiques** :

1. ✅ Change le statut à `'sent'`
2. ✅ **Remplace `patient_email` par `'PURGED'`** (suppression des données nominatives)
3. ✅ Enregistre la date d'envoi dans `sent_at`

### Pourquoi cette approche ?

- **Conformité RGPD** : Les données nominatives ne sont conservées que le temps strictement nécessaire
- **Minimisation des données** : L'email est supprimé dès que l'envoi est confirmé
- **Traçabilité** : Le statut `'sent'` et `sent_at` permettent de suivre les envois sans conserver l'email

### Gestion des erreurs

⚠️ **Important** : Si l'envoi échoue, l'email n'est **PAS** purgé pour permettre une nouvelle tentative le lendemain.

## 📋 Workflow complet

### 1. Création du questionnaire

```typescript
// Dans app/api/questionnaire/route.ts
status: isScheduled ? 'pending' : 'non programmé',
send_after_days: sendDelayDays || null,
patient_email: patientEmail || null,
```

### 2. Scan quotidien (8h00 UTC)

La fonction `send-delayed-emails` :
- Récupère les questionnaires avec `status = 'pending'`
- Filtre ceux dont `created_at + send_after_days <= aujourd'hui`
- Envoie les emails via Resend

### 3. Après envoi réussi

```sql
UPDATE questionnaires
SET 
  status = 'sent',
  patient_email = 'PURGED',  -- ⚠️ Purge immédiate
  sent_at = NOW()
WHERE id = ?
```

### 4. État final

```json
{
  "id": "uuid",
  "status": "sent",
  "patient_email": "PURGED",  // Plus de donnée nominative
  "sent_at": "2024-01-15T08:00:00Z",
  "send_after_days": 14,
  "created_at": "2024-01-01T10:00:00Z"
}
```

## 🚀 Déploiement

### 1. Mettre à jour la table

Exécutez `supabase-questionnaires-table-update.sql` dans l'éditeur SQL de Supabase.

### 2. Déployer la fonction

```bash
supabase functions deploy send-delayed-emails
```

### 3. Configurer les secrets

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 4. Configurer le cron job

Exécutez `supabase-delayed-emails-cron.sql` dans l'éditeur SQL de Supabase.

## 🧪 Test

### Test manuel

```bash
curl -X POST https://[VOTRE_PROJET].supabase.co/functions/v1/send-delayed-emails \
  -H "Authorization: Bearer [VOTRE_SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"
```

### Vérifier la purge

```sql
-- Avant envoi
SELECT id, status, patient_email, sent_at 
FROM questionnaires 
WHERE status = 'pending';

-- Après envoi (devrait montrer 'PURGED')
SELECT id, status, patient_email, sent_at 
FROM questionnaires 
WHERE status = 'sent';
```

## 📊 Logs

La fonction logge :
- `[Send Delayed] Email envoyé avec succès (ID: ...)`
- `[Send Delayed] Questionnaire X mis à jour : statut='sent', email='PURGED'`

Consultez les logs dans Supabase Dashboard > Edge Functions > Logs.

## ⚠️ Points d'attention

1. **Statut initial** : Les questionnaires doivent être créés avec `status = 'pending'` (pas `'programmé'`)
2. **Colonne sent_at** : Doit exister dans la table (ajoutée via le script SQL)
3. **Valeur 'PURGED'** : Utilisée comme marqueur, ne pas confondre avec un email réel
4. **Erreurs** : En cas d'erreur, l'email reste pour nouvelle tentative

## 🔍 Requêtes utiles

### Compter les questionnaires en attente

```sql
SELECT COUNT(*) 
FROM questionnaires 
WHERE status = 'pending' 
  AND patient_email IS NOT NULL;
```

### Voir les envois du jour

```sql
SELECT id, pathologie, sent_at 
FROM questionnaires 
WHERE status = 'sent' 
  AND DATE(sent_at) = CURRENT_DATE;
```

### Vérifier les purges

```sql
SELECT COUNT(*) 
FROM questionnaires 
WHERE patient_email = 'PURGED';
```



