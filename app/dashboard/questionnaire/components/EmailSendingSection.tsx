"use client";

import { Info } from 'lucide-react';

interface EmailSendingSectionProps {
    patientEmail: string;
    setPatientEmail: (email: string) => void;
    sendImmediately: boolean;
    setSendImmediately: (immediate: boolean) => void;
    sendDelayDays: number;
    setSendDelayDays: (days: number) => void;
    practitionerName?: string;
}

export function EmailSendingSection({
    patientEmail,
    setPatientEmail,
    sendImmediately,
    setSendImmediately,
    sendDelayDays,
    setSendDelayDays,
    practitionerName
}: EmailSendingSectionProps) {
    return (
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
                L&apos;envoi sera effectué depuis &quot;Dr. {practitionerName || 'Praticien'}&quot; via Medi.Link.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emails des patients (un par ligne ou séparés par virgule)
                    </label>
                    <textarea
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="patient1@example.com&#10;patient2@example.com"
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Un questionnaire unique sera généré pour chaque email détecté.
                    </p>
                </div>

                {!sendImmediately && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Délai d&apos;envoi (jours après aujourd&apos;hui)
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="number"
                                value={sendDelayDays}
                                onChange={(e) => setSendDelayDays(parseInt(e.target.value) || 0)}
                                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                min="1"
                            />
                            <span className="text-sm text-gray-500">jours</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">L&apos;email sera envoyé automatiquement.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
