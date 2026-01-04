# Configuration de Resend pour l'Edge Function send-delayed-followup

## 1. Configuration des Variables d'Environnement dans Supabase

### Via Supabase CLI (Recommandé)

```bash
# Installer Supabase CLI si ce n'est pas déjà fait
npm install -g supabase

# Se connecter à votre projet
supabase login

# Lier votre projet local à votre projet Supabase
supabase link --project-ref YOUR_PROJECT_REF

# Configurer la clé API Resend
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Configurer la clé service role (si nécessaire)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Configurer l'URL de l'application
supabase secrets set NEXT_PUBLIC_APP_URL=https://medi-link.fr
```

### Via l'Interface Supabase

1. Allez dans votre projet Supabase → **Settings** → **Edge Functions**
2. Cliquez sur **Secrets**
3. Ajoutez les secrets suivants :
   - `RESEND_API_KEY` : Votre clé API Resend (commence par `re_`)
   - `SUPABASE_SERVICE_ROLE_KEY` : Votre clé service role (optionnel, déjà disponible)
   - `NEXT_PUBLIC_APP_URL` : L'URL de votre application (ex: `https://medi-link.fr`)

### Vérification

L'Edge Function utilise bien `Deno.env.get('RESEND_API_KEY')` pour récupérer la clé API.

## 2. Obtenir votre clé API Resend

1. Créez un compte sur [resend.com](https://resend.com)
2. Allez dans **API Keys**
3. Créez une nouvelle clé API
4. Copiez la clé (elle commence par `re_`)
5. Configurez-la dans Supabase comme indiqué ci-dessus

## 3. Vérifier votre domaine dans Resend

Pour envoyer des emails depuis votre domaine :

1. Allez dans **Domains** dans Resend
2. Ajoutez votre domaine (ex: `medilink.fr`)
3. Suivez les instructions pour configurer les enregistrements DNS
4. Une fois vérifié, vous pourrez utiliser `noreply@medilink.fr` comme adresse d'expéditeur

**Note** : En attendant la vérification du domaine, vous pouvez utiliser l'adresse par défaut de Resend pour les tests.

## 4. Test d'envoi immédiat

### Option 1 : Via l'interface Supabase

1. Allez dans **Edge Functions** → `send-delayed-followup`
2. Cliquez sur **Invoke function**
3. Le body peut être vide : `{}`
4. Vérifiez les logs pour voir les résultats

### Option 2 : Via curl

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-delayed-followup' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Option 3 : Script de test Node.js

Créez un fichier `test-email-send.js` :

```javascript
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY';

async function testEmailSend() {
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
    console.log('Résultat:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erreur:', error);
  }
}

testEmailSend();
```

Exécutez : `node test-email-send.js`

### Option 4 : Forcer l'envoi d'un questionnaire spécifique

Pour tester avec un questionnaire spécifique (sans attendre 14 jours), modifiez temporairement la date dans la base de données :

```sql
-- Mettre à jour date_envoi_suivi à maintenant pour un questionnaire de test
UPDATE questionnaires 
SET date_envoi_suivi = NOW() 
WHERE id = 'VOTRE_QUESTIONNAIRE_ID';
```

Puis appelez l'Edge Function normalement.

## 5. Vérification des logs

Les logs de l'Edge Function sont disponibles dans :
- **Supabase Dashboard** → **Edge Functions** → `send-delayed-followup` → **Logs**

Vous y verrez :
- Les questionnaires trouvés
- Les emails envoyés avec succès
- Les erreurs éventuelles

## 6. Dépannage

### L'email n'est pas envoyé

1. Vérifiez que `RESEND_API_KEY` est bien configuré dans les secrets
2. Vérifiez les logs de l'Edge Function pour les erreurs Resend
3. Vérifiez que le domaine est vérifié dans Resend (si vous utilisez un domaine personnalisé)
4. Vérifiez que `date_envoi_suivi` est bien rempli et <= maintenant

### Erreur "Unauthorized"

- Vérifiez que vous utilisez bien la `SERVICE_ROLE_KEY` dans l'en-tête Authorization
- Vérifiez que la clé est correcte

### Erreur "RESEND_API_KEY not configured"

- Vérifiez que le secret est bien configuré dans Supabase
- Redéployez l'Edge Function après avoir ajouté le secret

## 7. Structure de l'email

L'email envoyé contient :
- **Header** : Logo/text "Medi.Link"
- **Corps** : Message agnostique invitant à remplir le suivi
- **Bouton** : "Répondre au questionnaire" (bleu clair)
- **Footer** : Mention automatique Medi.Link

Le lien pointe vers : `https://medi-link.fr/questionnaire/[id]`



