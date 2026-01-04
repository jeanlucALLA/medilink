// Fonction pour géocoder un code postal français via l'API Gouv.fr
// Documentation : https://geo.api.gouv.fr/adresse

interface GeocodingResult {
  city: string
  departmentCode: string
  zipCode: string
}

export async function geocodePostalCode(postalCode: string): Promise<GeocodingResult | null> {
  try {
    // Nettoyer le code postal (enlever les espaces)
    const cleanPostalCode = postalCode.trim().replace(/\s+/g, '')
    
    // Validation basique : code postal français doit être 5 chiffres
    if (!/^\d{5}$/.test(cleanPostalCode)) {
      console.error('[Geocoding] Code postal invalide:', cleanPostalCode)
      return null
    }

    // Appel à l'API Gouv.fr pour récupérer les informations de la commune
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${cleanPostalCode}&fields=nom,code,codeDepartement,codeRegion&limit=1`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('[Geocoding] Erreur API Gouv.fr:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      console.error('[Geocoding] Aucune commune trouvée pour le code postal:', cleanPostalCode)
      return null
    }

    const commune = data[0]

    return {
      city: commune.nom || '',
      departmentCode: commune.codeDepartement || cleanPostalCode.substring(0, 2),
      zipCode: cleanPostalCode,
    }
  } catch (error: any) {
    console.error('[Geocoding] Erreur lors du géocodage:', error)
    return null
  }
}

// Fonction pour extraire le code département depuis un code postal
export function extractDepartmentCode(postalCode: string): string | null {
  const cleanPostalCode = postalCode.trim().replace(/\s+/g, '')
  
  // Code postal français : 5 chiffres, les 2 premiers = département
  if (/^\d{5}$/.test(cleanPostalCode)) {
    return cleanPostalCode.substring(0, 2)
  }
  
  return null
}


