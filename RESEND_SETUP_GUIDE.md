# Guide de Configuration Resend pour Medi.Link

## 📧 Configuration de l'API Resend

### 1. Créer un compte Resend

1. Allez sur [https://resend.com](https://resend.com)
2. Créez un compte gratuit (100 emails/jour en version gratuite)
3. Vérifiez votre email

### 2. Obtenir votre clé API

1. Connectez-vous à votre dashboard Resend
2. Allez dans **API Keys** (dans le menu de gauche)
3. Cliquez sur **Create API Key**
4. Donnez un nom à votre clé (ex: "Medi.Link Production")
5. Copiez la clé API (elle ne sera affichée qu'une seule fois !)

### 3. Configurer le domaine d'envoi (Optionnel mais recommandé)

Pour un envoi professionnel, vous devez vérifier votre domaine :

1. Allez dans **Domains** dans votre dashboard
2. Cliquez sur **Add Domain**
3. Suivez les instructions pour ajouter vos enregistrements DNS
4. Une fois vérifié, vous pourrez envoyer depuis `noreply@votredomaine.com`

**Note :** Sans domaine vérifié, vous pouvez utiliser l'email par défaut de Resend (ex: `onboarding@resend.dev`)

### 4. Configurer les variables d'environnement

Ajoutez votre clé API dans le fichier `.env.local` à la racine du projet :

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Medi.Link <noreply@medilink.app>
```

**Important :**
- Remplacez `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` par votre vraie clé API
- Pour `EMAIL_FROM`, utilisez soit :
  - Un domaine vérifié : `Medi.Link <noreply@votredomaine.com>`
  - L'email par défaut de Resend : `Medi.Link <onboarding@resend.dev>`

### 5. Vérifier la configuration

1. Allez dans **Dashboard > Paramètres** de votre application
2. Dans la section **Test d'Email de Suivi**
3. Entrez votre adresse email
4. Cliquez sur **Envoyer un email de test**
5. Vérifiez votre boîte de réception

### 6. Limites et quotas

**Plan Gratuit :**
- 100 emails/jour
- 3 000 emails/mois
- Support communautaire

**Plan Pro (à partir de $20/mois) :**
- 50 000 emails/mois
- Support prioritaire
- Domaines personnalisés illimités

### 7. Dépannage

**Erreur : "RESEND_API_KEY non configurée"**
- Vérifiez que la variable est bien dans `.env.local`
- Redémarrez le serveur de développement (`npm run dev`)

**Erreur : "Invalid API key"**
- Vérifiez que la clé API est correcte
- Assurez-vous qu'il n'y a pas d'espaces avant/après la clé

**Les emails n'arrivent pas**
- Vérifiez votre dossier spam
- Vérifiez les logs dans le dashboard Resend
- Assurez-vous que votre domaine est vérifié (si vous utilisez un domaine personnalisé)

### 8. Sécurité

⚠️ **Important :**
- Ne commitez JAMAIS votre clé API dans Git
- Ajoutez `.env.local` dans votre `.gitignore`
- Utilisez des clés différentes pour développement et production
- Régénérez votre clé si elle est compromise

### 9. Documentation

- [Documentation Resend](https://resend.com/docs)
- [API Reference](https://resend.com/docs/api-reference)
- [Best Practices](https://resend.com/docs/best-practices)


