# Edge Function : Envoi d'emails programmés

Cette fonction Edge Supabase envoie automatiquement les emails aux patients lorsque la date d'envoi programmée est atteinte.

## Configuration requise

### Variables d'environnement (Secrets Supabase)

Configurez les secrets suivants dans votre projet Supabase (Settings > Edge Functions > Secrets) :

1. **RESEND_API_KEY** : Votre clé API Resend
   - Obtenez-la sur https://resend.com/api-keys
   - Format : `re_xxxxxxxxxxxxx`

2. **SUPABASE_SERVICE_ROLE_KEY** : Clé de service Supabase (pour accès admin)
   - Trouvez-la dans Settings > API > service_role key
   - ⚠️ Ne jamais exposer cette clé côté client

3. **SERVICE_KEY** (optionnel) : Clé de sécurité pour protéger l'appel de la fonction
   - Générez une clé aléatoire sécurisée
   - Utilisez-la dans le cron job pour authentifier l'appel

4. **NEXT_PUBLIC_APP_URL** : URL de votre application
   - Exemple : `https://votre-domaine.com` ou `http://localhost:3001` pour le dev

### Domaine email Resend

Assurez-vous d'avoir configuré et vérifié un domaine dans Resend pour pouvoir envoyer des emails depuis `noreply@medilink.fr` (ou votre domaine).

## Déploiement

```bash
# Depuis la racine du projet
supabase functions deploy send-delayed-email
```

## Test manuel

```bash
curl -X POST https://[votre-projet].supabase.co/functions/v1/send-delayed-email \
  -H "Authorization: Bearer [SERVICE_KEY]" \
  -H "Content-Type: application/json"
```

## Fonctionnement

1. La fonction scanne la table `questionnaires` pour trouver les questionnaires avec :
   - `status = 'programmé'`
   - `patient_email` renseigné
   - `send_after_days` renseigné
   - `created_at + send_after_days <= maintenant`

2. Pour chaque questionnaire trouvé :
   - Récupère les informations du praticien
   - Génère un email HTML professionnel
   - Envoie l'email via Resend
   - Met à jour le `status` en 'envoyé'

3. Retourne un rapport avec le nombre d'emails envoyés et les erreurs éventuelles.



