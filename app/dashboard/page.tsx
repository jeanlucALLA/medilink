import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [showRetry, setShowRetry] = useState(false)

  // ... (maintain other state variables)

  // ... (useEffect for mounting)

  // Timer for retry button
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setShowRetry(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [loading])

  // Vérifier si le code postal est manquant
  useEffect(() => {
    const checkLocation = async () => {
      try {
        if (!isMountedRef.current) return
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('zip_code, code_postal, department_code')
            .eq('id', user.id)
            .single()

          const hasPostalCode = profile?.zip_code || profile?.code_postal
          if (!hasPostalCode && isMountedRef.current) {
            setShowLocationBanner(true)
          } else if (hasPostalCode && isMountedRef.current) {
            setShowLocationBanner(false)
          }
        }
      } catch (err) {
        console.error('[Dashboard] Erreur vérification localisation:', err)
      }
    }
    if (isMountedRef.current) {
      checkLocation()
    }
  }, [])

  // Charger les alertes critiques
  const loadCriticalAlerts = async () => {
    try {
      if (isMountedRef.current) setLoadingAlerts(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        if (isMountedRef.current) setCriticalAlerts([])
        return
      }

      const { data: alertsData, error: alertsError } = await supabase
        .from('responses')
        .select('id, questionnaire_id, pathologie, score_total, submitted_at, patient_email')
        .eq('user_id', user.id)
        .lte('score_total', 2)
        .order('submitted_at', { ascending: false })
        .limit(50)

      if (alertsError) throw alertsError

      if (alertsData && isMountedRef.current) {
        setCriticalAlerts(alertsData)
      }
    } catch (err: any) {
      console.error('[Dashboard] Erreur chargement alertes:', err?.message)
      if (isMountedRef.current) setCriticalAlerts([])
    } finally {
      if (isMountedRef.current) setLoadingAlerts(false)
    }
  }

  // Charger les actes médicaux
  const loadMedicalActs = async () => {
    try {
      if (isMountedRef.current) setLoadingMedicalActs(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        // ... (reset state logic)
        return
      }

      const { data, error } = await supabase
        .from('medical_acts')
        .select('id, act_name, patient_name, act_date, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        if (error.code !== '42P01') console.error('[Dashboard] Erreur chargement actes:', error.message)
        // ... (reset state logic)
        return
      }

      // ... (stats calculation logic)

    } catch (err: any) {
      console.error('[Dashboard] Erreur chargement actes:', err?.message)
      // ... (reset state logic)
    } finally {
      if (isMountedRef.current) setLoadingMedicalActs(false)
    }
  }

  // Charger les questionnaires
  const loadQuestionnaires = async () => {
    try {
      if (isMountedRef.current) setLoadingQuestionnaires(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        if (isMountedRef.current) setQuestionnaires([])
        return
      }

      const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code !== '42P01') console.error('[Dashboard] Erreur chargement questionnaires:', error.message)
        if (isMountedRef.current) setQuestionnaires([])
        return
      }

      if (data && isMountedRef.current) setQuestionnaires(data)
    } catch (err: any) {
      console.error('[Dashboard] Erreur chargement questionnaires:', err?.message)
      if (isMountedRef.current) setQuestionnaires([])
    } finally {
      if (isMountedRef.current) setLoadingQuestionnaires(false)
    }
  }

  // ... (helper functions: hasCriticalAlert)

  useEffect(() => {
    let authStateSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null

    const checkAuthAndLoadProfile = async () => {
      if (!isMountedRef.current) return

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          if (isMountedRef.current) {
            setLoading(false)
            router.push('/login')
          }
          return
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          if (isMountedRef.current) {
            setLoading(false)
            router.push('/login')
          }
          return
        }

        if (isMountedRef.current && user.id) {
          setUserId(user.id)
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('nom_complet, cabinet, adresse_cabinet, email, specialite, zip_code, department_code')
          .eq('id', user.id)
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // Profile missing
            if (isMountedRef.current) {
              setProfileIncomplete(true)
              setProfile(null)
            }
          } else {
            console.error('[Dashboard] Erreur profil:', profileError)
            if (isMountedRef.current) {
              setProfileIncomplete(true)
              setProfile(null)
            }
          }
        } else if (profileData) {
          if (isMountedRef.current) {
            setProfile(profileData)
            setProfileIncomplete(false)
          }
        }

        // Always stop loading and fetch data
        if (isMountedRef.current) {
          setLoading(false)
          setError(null)
          loadQuestionnaires()
          loadCriticalAlerts()
          loadMedicalActs()
          loadQuestionnaireSettings()
        }

      } catch (err: any) {
        console.error('[Dashboard] Erreur chargement:', err)
        if (isMountedRef.current) {
          setLoading(false)
          // Attempt to load anyway
          loadQuestionnaires()
        }
      }
    }

    const setupAuthListener = async () => {
      authStateSubscription = supabase.auth.onAuthStateChange((event: string, session: any) => {
        if (!isMountedRef.current) return
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkAuthAndLoadProfile()
        } else if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      })
    }

    setupAuthListener()
    checkAuthAndLoadProfile()

    return () => {
      isMountedRef.current = false
      if (authStateSubscription?.data?.subscription) {
        authStateSubscription.data.subscription.unsubscribe()
      }
    }
  }, [router])

  // ... (rest of logic)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 flex-col">
        <div className="text-center mb-6">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-1">Chargement...</div>
          <div className="text-sm text-gray-500">Vérification de l&apos;authentification</div>
        </div>
        {showRetry && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cliquer ici si le chargement est bloqué
          </button>
        )}
      </div>
    )
  }

  if (error) {
    // ...


    const displayName = (profile?.nom_complet || profile?.specialite || 'Professionnel').replace(/^Dr\.?\s*/i, '')

    return (
      <div className="space-y-6">
        {/* Bandeau de localisation manquante */}
        {isMountedRef.current && showLocationBanner && (
          <div className="bg-blue-50 border-l-4 border-primary rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm text-gray-700">
                <span className="font-medium">Complétez votre localisation</span> pour activer le Benchmark Régional dans Analytics.
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="ml-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Configurer
            </Link>
          </div>
        )}
        {/* Message d'avertissement si le profil est incomplet */}
        {profileIncomplete && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Veuillez compléter votre profil dans les paramètres pour profiter de toutes les fonctionnalités.
                </p>
                <Link
                  href="/dashboard/settings"
                  className="mt-2 inline-flex items-center text-sm font-medium text-yellow-700 hover:text-yellow-900 underline"
                >
                  Accéder aux paramètres →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Badge Leader Régional en haut de page */}
        {isMountedRef.current && userId && (
          <div className="mb-6 flex justify-end">
            <LeaderBadge userId={userId} />
          </div>
        )}

        {/* Checklist de Bienvenue */}
        {(!hasFirstAct || !hasQuestionnaireSettings) && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Checklist de Bienvenue</h2>
              {userId && <LeaderBadge userId={userId} />}
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {hasFirstAct ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-sm ${hasFirstAct ? 'text-gray-600 line-through' : 'text-gray-900 font-medium'}`}>
                  Créer votre premier acte
                </span>
                {!hasFirstAct && (
                  <button
                    onClick={() => setIsAddActModalOpen(true)}
                    className="ml-auto inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ajouter un acte</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {hasQuestionnaireSettings ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-sm ${hasQuestionnaireSettings ? 'text-gray-600 line-through' : 'text-gray-900 font-medium'}`}>
                  Personnaliser votre questionnaire
                </span>
                {!hasQuestionnaireSettings && (
                  <Link
                    href="/dashboard/questionnaire"
                    className="ml-auto inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium bg-primary hover:bg-primary-dark text-white rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Personnaliser</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {profile ? `Tableau de bord de ${displayName}` : 'Tableau de bord'}
            </h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsAddActModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter un acte</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Informations du cabinet - affichées uniquement si le profil existe */}
        {profile && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{profile.cabinet}</h2>
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{profile.adresse_cabinet}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques Globales (basées sur les actes médicaux) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ce mois</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loadingMedicalActs ? (
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                  ) : (
                    statsData.actsThisMonth
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">Actes ce mois-ci</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>



          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cette semaine</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loadingMedicalActs ? (
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  ) : (
                    statsData.actsThisWeek
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">Actes cette semaine</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques Questionnaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/history" className="block bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 group-hover:text-primary transition-colors">Total Questionnaires</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loadingQuestionnaires ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    questionnaires.length
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Envois en attente</p>
                <p className="text-3xl font-bold text-gray-900">
                  {questionnaires.filter(q => q.status === 'programmé' && q.patient_email).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <Link href="/dashboard/history" className="block bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1 group-hover:text-purple-600 transition-colors">Patients suivis</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(() => {
                    const uniqueEmails = new Set(
                      questionnaires
                        .filter(q => q.patient_email)
                        .map(q => q.patient_email)
                    )
                    return uniqueEmails.size
                  })()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Link>
        </div>

        {/* Tableau des derniers actes/patients */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Derniers actes enregistrés</h2>
              <button
                onClick={() => setIsAddActModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un acte</span>
              </button>
            </div>
          </div>

          {loadingMedicalActs ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-gray-600">Chargement des actes...</p>
            </div>
          ) : medicalActs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun acte enregistré
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez par enregistrer votre premier acte médical.
              </p>
              <button
                onClick={() => setIsAddActModalOpen(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter un acte</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom de l&apos;acte
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de l&apos;acte
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d&apos;enregistrement
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {medicalActs.slice(0, 10).map((act) => (
                    <tr key={act.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{act.act_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {act.patient_name || (
                            <span className="text-gray-400 italic">Non renseigné</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {act.act_date ? new Date(act.act_date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          }) : (
                            <span className="text-gray-400 italic">Non renseigné</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {act.created_at ? new Date(act.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {medicalActs.length > 10 && (
                <div className="p-4 text-center border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Affichage des 10 derniers actes sur {medicalActs.length} au total
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Carte d'alerte critique */}
        {criticalAlerts.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-semibold text-red-900">
                Alertes Critiques ({criticalAlerts.length})
              </h2>
            </div>
            <p className="text-red-700 mb-4">
              {criticalAlerts.length} patient(s) ont soumis un score ≤ 2/5. Action recommandée : contactez-les rapidement.
            </p>
            <div className="flex flex-wrap gap-2">
              {criticalAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white border border-red-200 rounded-lg px-4 py-2 text-sm"
                >
                  <span className="font-medium text-red-900">{alert.pathologie}</span>
                  <span className="text-red-600 ml-2">({alert.score_total}/5)</span>
                </div>
              ))}
              {criticalAlerts.length > 5 && (
                <div className="bg-white border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
                  +{criticalAlerts.length - 5} autre(s)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Liste des questionnaires */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Questionnaires récents</h2>
              <div className="flex items-center space-x-3">
                {/* Filtre Alertes Critiques */}
                <button
                  onClick={() => setShowAlertsOnly(!showAlertsOnly)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm ${showAlertsOnly
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Alertes critiques</span>
                  {criticalAlerts.length > 0 && (
                    <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {criticalAlerts.length}
                    </span>
                  )}
                </button>
                <Link
                  href="/dashboard/questionnaire"
                  className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer un questionnaire</span>
                </Link>
              </div>
            </div>
          </div>

          {loadingQuestionnaires ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-gray-600">Chargement des questionnaires...</p>
            </div>
          ) : questionnaires.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Vous n&apos;avez pas encore créé de questionnaire
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez par en créer un dans l&apos;onglet dédié.
              </p>
              <Link
                href="/dashboard/questionnaire"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Créer un questionnaire</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pathologie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email du patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de création
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(showAlertsOnly
                    ? questionnaires.filter(q => hasCriticalAlert(q.id))
                    : questionnaires
                  ).map((questionnaire) => {
                    const hasAlert = hasCriticalAlert(questionnaire.id)
                    const alertData = criticalAlerts.find(a => a.questionnaire_id === questionnaire.id)

                    return (
                      <tr
                        key={questionnaire.id}
                        className={`hover:bg-gray-50 ${hasAlert ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {hasAlert && (
                              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {questionnaire.pathologie}
                              {hasAlert && alertData && (
                                <span className="ml-2 text-xs text-red-600 font-semibold">
                                  (Score: {alertData.score_total}/5)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {questionnaire.patient_email || (
                              <span className="text-gray-400 italic">Non renseigné</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {Array.isArray(questionnaire.questions)
                              ? questionnaire.questions.length
                              : 0} question(s)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {questionnaire.status === 'programmé' && questionnaire.send_after_days ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              Programmé pour J+{questionnaire.send_after_days}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {questionnaire.status || 'Non programmé'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(questionnaire.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Suivi des envois automatiques */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Suivi des envois automatiques</h2>
          </div>

          {loadingQuestionnaires ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-gray-600">Chargement des envois...</p>
            </div>
          ) : emailQuestionnaires.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun envoi programmé
              </h3>
              <p className="text-gray-600 mb-6">
                Les questionnaires avec un email de patient apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient (Email)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pathologie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d&apos;envoi prévue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emailQuestionnaires.map((questionnaire) => {
                    const scheduledDate = getScheduledSendDate(
                      questionnaire.created_at,
                      questionnaire.send_after_days
                    )

                    return (
                      <tr key={questionnaire.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {questionnaire.patient_email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {questionnaire.pathologie}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {scheduledDate ? (
                              scheduledDate.toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            ) : (
                              <span className="text-gray-400 italic">Non programmé</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(questionnaire.status)}`}>
                            {questionnaire.status || 'Non programmé'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {questionnaire.status === 'programmé' && (
                            <span className="text-xs text-gray-500 italic">Envoi programmé</span>
                          )}
                          {questionnaire.status === 'envoyé' && (
                            <span className="text-xs text-gray-500 italic">Déjà envoyé</span>
                          )}
                          {/* Bouton "Envoyer maintenant" commenté - À réactiver manuellement après vérification */}
                          {/* 
                        {questionnaire.status === 'programmé' && (
                          <button
                            onClick={() => handleSendNow(questionnaire.id)}
                            disabled={sendingEmail === questionnaire.id}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingEmail === questionnaire.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Envoi...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Envoyer maintenant</span>
                              </>
                            )}
                          </button>
                        )}
                        */}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal d'ajout d'acte médical */}
        <AddMedicalActModal
          isOpen={isAddActModalOpen}
          onClose={() => setIsAddActModalOpen(false)}
          onSuccess={handleActCreated}
        />
      </div>
    )
  }
