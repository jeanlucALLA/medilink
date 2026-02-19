"use client";

import { useState, useMemo } from 'react';
import { Info, CheckCircle, XCircle, Eye, X, Mail, User } from 'lucide-react';

interface EmailSendingSectionProps {
    patientEmail: string;
    setPatientEmail: (email: string) => void;
    sendImmediately: boolean;
    setSendImmediately: (immediate: boolean) => void;
    sendDelayDays: number;
    setSendDelayDays: (days: number) => void;
    practitionerName?: string;
    pathologie?: string;
}

// Validation email simple
const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export function EmailSendingSection({
    patientEmail,
    setPatientEmail,
    sendImmediately,
    setSendImmediately,
    sendDelayDays,
    setSendDelayDays,
    practitionerName,
    pathologie
}: EmailSendingSectionProps) {
    const [showPreview, setShowPreview] = useState(false);

    // Parse et valide les emails en temps réel
    const emailAnalysis = useMemo(() => {
        const rawEmails = patientEmail.split(/[\n,;\s]+/).map(e => e.trim()).filter(e => e.length > 0);
        const valid: string[] = [];
        const invalid: string[] = [];

        rawEmails.forEach(email => {
            if (isValidEmail(email)) {
                valid.push(email);
            } else {
                invalid.push(email);
            }
        });

        return { valid, invalid, total: rawEmails.length };
    }, [patientEmail]);

    return (
        <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Configuration de l&apos;envoi</h2>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Envoyer immédiatement</span>
                        <button
                            type="button"
                            onClick={() => setSendImmediately(!sendImmediately)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sendImmediately ? 'bg-primary' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sendImmediately ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                <p className="text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded flex items-start">
                    <Info className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                    L&apos;envoi sera effectué depuis &quot;Dr. {practitionerName || 'Praticien'}&quot; via TopLinkSante.
                </p>

                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Emails des patients (un par ligne ou séparés par virgule)
                            </label>
                            {/* Bouton aperçu */}
                            {emailAnalysis.valid.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(true)}
                                    className="flex items-center space-x-1 text-sm text-primary hover:text-primary-dark transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>Aperçu email</span>
                                </button>
                            )}
                        </div>
                        <textarea
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            placeholder="patient1@example.com&#10;patient2@example.com"
                            rows={4}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm ${emailAnalysis.invalid.length > 0
                                ? 'border-orange-300 bg-orange-50/30'
                                : emailAnalysis.valid.length > 0
                                    ? 'border-green-300 bg-green-50/30'
                                    : 'border-gray-300'
                                }`}
                        />

                        {/* Indicateurs de validation */}
                        <div className="mt-2 space-y-1">
                            {emailAnalysis.valid.length > 0 && (
                                <div className="flex items-center space-x-2 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {emailAnalysis.valid.length} email{emailAnalysis.valid.length > 1 ? 's' : ''} valide{emailAnalysis.valid.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                            {emailAnalysis.invalid.length > 0 && (
                                <div className="flex items-center space-x-2 text-orange-600">
                                    <XCircle className="w-4 h-4" />
                                    <span className="text-sm">
                                        {emailAnalysis.invalid.length} email{emailAnalysis.invalid.length > 1 ? 's' : ''} invalide{emailAnalysis.invalid.length > 1 ? 's' : ''}: {emailAnalysis.invalid.slice(0, 3).join(', ')}{emailAnalysis.invalid.length > 3 ? '...' : ''}
                                    </span>
                                </div>
                            )}
                            {emailAnalysis.total === 0 && (
                                <p className="text-xs text-gray-500">
                                    Un questionnaire unique sera généré pour chaque email détecté.
                                </p>
                            )}
                        </div>
                    </div>

                    {!sendImmediately && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Délai d&apos;envoi (jours après aujourd&apos;hui)
                            </label>

                            {/* Quick Presets */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {[1, 7, 14, 30, 90].map((days) => (
                                    <button
                                        key={days}
                                        type="button"
                                        onClick={() => setSendDelayDays(days)}
                                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${sendDelayDays === days
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {days}j
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={sendDelayDays}
                                        onChange={(e) => {
                                            let val = parseInt(e.target.value) || 0;
                                            if (val > 90) val = 90;
                                            if (val < 1) val = 1;
                                            setSendDelayDays(val);
                                        }}
                                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-8"
                                        min="1"
                                        max="90"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">j</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="90"
                                    value={sendDelayDays}
                                    onChange={(e) => setSendDelayDays(parseInt(e.target.value))}
                                    className="flex-1 accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Programmez l&apos;envoi entre 1 et 90 jours après la création.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Aperçu Email */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Mail className="w-5 h-5 text-primary" />
                                <h2 className="text-xl font-bold text-gray-900">Aperçu de l&apos;email</h2>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Simulation de l'email */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                {/* Email Header */}
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <span className="font-medium">De:</span>
                                        <span>Dr. {practitionerName || 'Praticien'} via TopLinkSante &lt;noreply@mail.toplinksante.com&gt;</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                                        <span className="font-medium">À:</span>
                                        <span>{emailAnalysis.valid[0] || 'patient@example.com'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                                        <span className="font-medium">Objet:</span>
                                        <span>Suivi médical - Cabinet Médical</span>
                                    </div>
                                </div>

                                {/* Email Body */}
                                <div className="p-6 bg-white">
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <span className="text-3xl">💙</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">TopLinkSante</h3>
                                    </div>

                                    <div className="space-y-4 text-gray-700">
                                        <p>Bonjour,</p>
                                        <p>
                                            Suite à votre consultation avec <strong>{practitionerName || 'Votre praticien'}</strong>, nous souhaiterions avoir votre retour.
                                        </p>
                                        <p>
                                            Merci de prendre quelques instants pour répondre à ce questionnaire :
                                        </p>

                                        <div className="text-center py-4">
                                            <div className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-xl">
                                                Répondre au questionnaire
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-500">
                                            Ce lien est personnel et sécurisé. Vos réponses sont confidentielles.
                                        </p>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
                                        Envoyé via TopLinkSante • Plateforme de suivi patient
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="mt-4 bg-blue-50 rounded-lg p-3 flex items-start space-x-2">
                                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-700">
                                    Cet email sera envoyé à <strong>{emailAnalysis.valid.length}</strong> patient{emailAnalysis.valid.length > 1 ? 's' : ''}
                                    {sendImmediately ? ' immédiatement' : ` dans ${sendDelayDays} jour${sendDelayDays > 1 ? 's' : ''}`}.
                                </p>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

