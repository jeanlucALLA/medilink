-- Ajout de la colonne pour stocker l'URL de la facture PDF
ALTER TABLE logs_paiement 
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- Commentaire pour documentation
COMMENT ON COLUMN logs_paiement.invoice_url IS 'Lien direct vers le PDF de la facture Stripe';
