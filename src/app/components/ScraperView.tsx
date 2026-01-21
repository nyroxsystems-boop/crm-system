import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Globe, Search, AlertCircle, CheckCircle2, Plus, Trash2, ExternalLink, Star, MapPin, Radar } from 'lucide-react';
import { evaluateWebsite, startScraping, getScrapingStatus, startRadiusSearch } from '../utils/storage';

// CSS Spinner component to avoid lucide-react insertBefore DOM errors
const Spinner = ({ className = "w-5 h-5" }: { className?: string }) => (
    <div
        className={`${className} border-2 border-white/30 border-t-white rounded-full animate-spin`}
        style={{ aspectRatio: '1' }}
    />
);

interface EvaluationResult {
    action: string;
    lead: {
        id: string;
        companyName: string;
        websiteUrl: string;
        designScore: number;
        designAnalysis: string;
        mobileResponsive: boolean;
        phone?: string;
    };
    evaluation: {
        score: number;
        analysis: string;
        mobileResponsive: boolean;
        issues: string[];
        suggestions: string[];
    };
}

const NICHES = [
    'Restaurant',
    'Friseur',
    'Handwerker',
    'Anwalt',
    'Arzt',
    'Immobilien',
    'Fitness',
    'Kosmetik',
    'Autowerkstatt',
    'Einzelhandel',
    'Hotel',
    'Zahnärzte',
    'Steuerberater',
    'Fotografen',
    'Sonstiges'
];

export function ScraperView() {
    const [urls, setUrls] = useState<string[]>(['']);
    const [niche, setNiche] = useState('Restaurant');
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<EvaluationResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<{ status: string; processed: number; total: number } | null>(null);

    // Tab state
    const [activeTab, setActiveTab] = useState<'manual' | 'radius'>('manual');

    // Handle tab switch - clear job status first to prevent DOM conflicts
    const handleTabSwitch = (newTab: 'manual' | 'radius') => {
        if (newTab !== activeTab) {
            // Use flushSync to force synchronous DOM update before tab switch
            // This prevents removeChild errors by ensuring jobStatus elements are removed first
            flushSync(() => {
                setJobStatus(null);
            });
            setActiveTab(newTab);
        }
    };

    // Radius Search state
    const [radiusLocation, setRadiusLocation] = useState('');
    const [radiusKm, setRadiusKm] = useState(10);
    const [scoreThreshold, setScoreThreshold] = useState(60);

    // Poll job status
    useEffect(() => {
        if (!jobId) return;

        const interval = setInterval(async () => {
            try {
                const status = await getScrapingStatus(jobId);
                setJobStatus(status);

                if (status.status === 'completed' || status.status === 'failed') {
                    clearInterval(interval);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error polling job status:', err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [jobId]);

    const addUrl = () => {
        setUrls([...urls, '']);
    };

    const removeUrl = (index: number) => {
        setUrls(urls.filter((_, i) => i !== index));
    };

    const updateUrl = (index: number, value: string) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    const handleEvaluateSingle = async (url: string) => {
        if (!url) return;

        setLoading(true);
        setError(null);

        try {
            const result = await evaluateWebsite(url, niche, undefined, city);
            setResults(prev => [result, ...prev]);
        } catch (err: any) {
            setError(err.message || 'Fehler bei der Bewertung');
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluateAll = async () => {
        const validUrls = urls.filter(u => u.trim());
        if (validUrls.length === 0) {
            setError('Bitte mindestens eine URL eingeben');
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await startScraping(validUrls, niche, city);
            setJobId(response.jobId);
        } catch (err: any) {
            setError(err.message || 'Fehler beim Starten des Scrapings');
            setLoading(false);
        }
    };

    const handleRadiusSearch = async () => {
        if (!radiusLocation.trim()) {
            setError('Bitte einen Standort eingeben');
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);
        setJobStatus(null);

        try {
            const response = await startRadiusSearch(radiusLocation, radiusKm, niche, scoreThreshold);
            setJobId(response.jobId);
        } catch (err: any) {
            setError(err.message || 'Fehler bei der Umkreissuche');
            setLoading(false);
        }
    };

    const getScoreColor = (score: number | undefined) => {
        if (!score) return 'bg-gray-300';
        if (score >= 70) return 'bg-green-500';
        if (score >= 50) return 'bg-yellow-500';
        if (score >= 30) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getScoreLabel = (score: number | undefined) => {
        if (!score) return 'N/A';
        if (score >= 70) return 'Gut';
        if (score >= 50) return 'Mittel';
        if (score >= 30) return 'Schwach';
        return 'Schlecht';
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Website Scraper</h2>
                    <p className="text-gray-500 mt-1">Websites analysieren und potenzielle Leads finden</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => handleTabSwitch('manual')}
                    className={`px-4 py-3 font-medium transition-all ${activeTab === 'manual'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Manuelle URLs
                    </div>
                </button>
                <button
                    onClick={() => handleTabSwitch('radius')}
                    className={`px-4 py-3 font-medium transition-all ${activeTab === 'radius'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Radar className="w-4 h-4" />
                        Umkreissuche
                    </div>
                </button>
            </div>

            {/* Input Section - key forces complete re-render on tab switch to prevent DOM conflicts */}
            <div key={activeTab} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                {/* Niche Selection - shared for both tabs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nische</label>
                        <select
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                        >
                            {NICHES.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>

                    {activeTab === 'manual' ? (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Stadt/Region (optional)</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="z.B. Berlin, München..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                Standort
                            </label>
                            <input
                                type="text"
                                value={radiusLocation}
                                onChange={(e) => setRadiusLocation(e.target.value)}
                                placeholder="z.B. 10115 Berlin, München Zentrum..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    )}
                </div>

                {/* Tab-specific content */}
                {activeTab === 'manual' ? (
                    <>
                        {/* URL Inputs */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700">Website URLs</label>
                            {urls.map((url, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => updateUrl(index, e.target.value)}
                                        placeholder="https://beispiel.de"
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    <button
                                        onClick={() => handleEvaluateSingle(url)}
                                        disabled={loading || !url.trim()}
                                        className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                    {urls.length > 1 && (
                                        <button
                                            onClick={() => removeUrl(index)}
                                            className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={addUrl}
                                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Weitere URL hinzufügen
                            </button>
                        </div>

                        {/* Action Button for Manual */}
                        <div className="flex gap-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={loading ? undefined : handleEvaluateAll}
                                disabled={loading || urls.every(u => !u.trim())}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold transition-all ${loading ? 'opacity-50' : 'hover:shadow-lg'} disabled:opacity-50`}
                            >
                                {loading ? (
                                    <>
                                        <Spinner />
                                        <span>Analysiere...</span>
                                    </>
                                ) : (
                                    <>
                                        <Globe className="w-5 h-5" />
                                        <span>Alle analysieren</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Radius Search Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Radius: {radiusKm} km
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={radiusKm}
                                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>1 km</span>
                                    <span>25 km</span>
                                    <span>50 km</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Score-Schwelle: unter {scoreThreshold}
                                </label>
                                <input
                                    type="range"
                                    min="10"
                                    max="90"
                                    step="5"
                                    value={scoreThreshold}
                                    onChange={(e) => setScoreThreshold(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Nur Websites mit Score unter {scoreThreshold} werden als Leads gespeichert
                                </p>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-sm text-blue-800">
                                <strong>So funktioniert's:</strong> Die Umkreissuche findet automatisch {niche}-Businesses im Umkreis von {radiusKm}km um "{radiusLocation || 'deinen Standort'}". Websites mit einem Design-Score unter {scoreThreshold} werden als potenzielle Leads gespeichert.
                            </p>
                        </div>

                        {/* Action Button for Radius Search */}
                        <div className="flex gap-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={loading ? undefined : handleRadiusSearch}
                                disabled={loading || !radiusLocation.trim()}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold transition-all ${loading ? 'opacity-50' : 'hover:shadow-lg'} disabled:opacity-50`}
                            >
                                {loading ? (
                                    <>
                                        <Spinner />
                                        <span>Suche läuft...</span>
                                    </>
                                ) : (
                                    <>
                                        <Radar className="w-5 h-5" />
                                        <span>Umkreissuche starten</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* Job Status */}
                {jobStatus && (
                    <div className="p-4 bg-purple-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <span className="w-5 h-5 flex items-center justify-center">
                                {jobStatus.status === 'running' ? (
                                    <Spinner className="w-5 h-5 border-purple-600 border-t-purple-600" />
                                ) : (
                                    /* CSS-based checkmark to avoid Lucide DOM issues */
                                    <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                                        <div className="w-2 h-3 border-r-2 border-b-2 border-white transform rotate-45 -translate-y-0.5" />
                                    </div>
                                )}
                            </span>
                            <span className="font-medium text-gray-900">
                                {jobStatus.status === 'running' ? 'Verarbeite' : 'Abgeschlossen'}: {jobStatus.processed} / {jobStatus.total}
                            </span>
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-purple-600 h-full transition-all duration-500"
                                style={{ width: `${(jobStatus.processed / jobStatus.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-600">{error}</span>
                    </div>
                )}
            </div>

            {/* Results */}
            {results.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Bewertungsergebnisse ({results.length})</h3>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {results.map((result, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-semibold text-gray-900 truncate">
                                                {result.lead.companyName}
                                            </h4>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${getScoreColor(result.evaluation.score)}`}>
                                                {result.evaluation.score}/100
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {getScoreLabel(result.evaluation.score)}
                                            </span>
                                        </div>

                                        <a
                                            href={result.lead.websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-sm text-purple-600 hover:underline mt-1"
                                        >
                                            {result.lead.websiteUrl}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>

                                        {result.lead.phone && (
                                            <p className="text-sm text-gray-600 mt-1">📞 {result.lead.phone}</p>
                                        )}

                                        <p className="text-sm text-gray-600 mt-2">{result.evaluation.analysis}</p>

                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                            <span className={result.evaluation.mobileResponsive ? 'text-green-600' : 'text-red-600'}>
                                                {result.evaluation.mobileResponsive ? '✓ Mobile optimiert' : '✗ Nicht mobile optimiert'}
                                            </span>
                                        </div>

                                        {result.evaluation.issues.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Probleme:</p>
                                                <ul className="text-sm text-red-600 space-y-1">
                                                    {result.evaluation.issues.map((issue, i) => (
                                                        <li key={i}>• {issue}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getScoreColor(result.evaluation.score)}`}>
                                            <Star className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {result.action === 'created' ? 'Neu' : 'Aktualisiert'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
