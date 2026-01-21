import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, CheckCircle, Clock, AlertCircle, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { getLeads, type Lead } from '../utils/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    async function loadLeads() {
      try {
        const data = await getLeads();
        setLeads(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load leads:', error);
        setLeads([]);
      }
    }
    loadLeads();
  }, []);

  // Basic stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'Neu').length,
    qualified: leads.filter(l => l.status === 'Qualifiziert').length,
    won: leads.filter(l => l.status === 'Gewonnen').length,
    totalValue: leads.reduce((sum, l) => sum + (l.value || 0), 0),
    avgValue: leads.length > 0 ? leads.reduce((sum, l) => sum + (l.value || 0), 0) / leads.length : 0,
  };

  // Scraper-specific stats
  const scraperStats = {
    avgDesignScore: leads.filter(l => l.designScore).length > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.designScore || 0), 0) / leads.filter(l => l.designScore).length)
      : 0,
    withEmail: leads.filter(l => l.email && l.email !== 'nicht gefunden' && l.email !== '').length,
    withPhone: leads.filter(l => l.phone).length,
    withWebsite: leads.filter(l => l.website || l.websiteUrl).length,
    fromScraper: leads.filter(l => l.source === 'Umkreissuche' || l.source === 'Scraper').length,
    avgRating: leads.filter(l => l.googleRating).length > 0
      ? (leads.reduce((sum, l) => sum + (l.googleRating || 0), 0) / leads.filter(l => l.googleRating).length).toFixed(1)
      : 'N/A',
  };

  // Score distribution for chart
  const scoreDistribution = [
    { name: '0-29 (Gut)', count: leads.filter(l => l.designScore !== undefined && l.designScore < 30).length, color: '#22c55e' },
    { name: '30-49 (OK)', count: leads.filter(l => l.designScore !== undefined && l.designScore >= 30 && l.designScore < 50).length, color: '#eab308' },
    { name: '50-69 (Mäßig)', count: leads.filter(l => l.designScore !== undefined && l.designScore >= 50 && l.designScore < 70).length, color: '#f97316' },
    { name: '70-100 (Schlecht)', count: leads.filter(l => l.designScore !== undefined && l.designScore >= 70).length, color: '#ef4444' },
  ];

  const recentLeads = leads.slice(0, 5);

  // Data for charts
  const pipelineData = ['Neu', 'Qualifiziert', 'Angebot', 'Verhandlung', 'Gewonnen', 'Verloren'].map((status) => ({
    name: status,
    count: leads.filter(l => l.status === status).length,
    value: leads.filter(l => l.status === status).reduce((sum, l) => sum + (l.value || 0), 0)
  }));

  const pieData = pipelineData.filter(d => d.count > 0).map(d => ({
    name: d.name,
    value: d.count
  }));

  const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50">
      {/* Header */}
      <div className="animate-slide-in-up">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">Dashboard</h2>
        <p className="text-gray-600 mt-2 text-sm md:text-base">Willkommen zurück! Hier ist Ihre Übersicht.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="stats-card group animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs font-bold text-green-600">Live</span>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{stats.total}</p>
          <p className="text-sm font-medium text-gray-500">Gesamt Leads</p>
        </div>

        <div className="stats-card group animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs font-bold text-green-600">+12%</span>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{stats.won}</p>
          <p className="text-sm font-medium text-gray-500">Gewonnen</p>
        </div>

        <div className="stats-card group animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
              <span className="text-xs font-bold text-orange-600">{stats.new} Neu</span>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{stats.qualified}</p>
          <p className="text-sm font-medium text-gray-500">In Bearbeitung</p>
        </div>

        <div className="stats-card group animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 glow-purple">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full">
              <TrendingUp className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-bold text-purple-600">+8%</span>
            </div>
          </div>
          <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-1">€{stats.totalValue.toLocaleString()}</p>
          <p className="text-sm font-medium text-gray-500">Gesamtwert</p>
        </div>
      </div>

      {/* Scraper Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500">Ø Score</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{scraperStats.avgDesignScore}<span className="text-sm font-normal text-gray-400">/100</span></p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500">Mit E-Mail</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{scraperStats.withEmail}<span className="text-sm font-normal text-gray-400">/{stats.total}</span></p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500">Mit Telefon</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{scraperStats.withPhone}<span className="text-sm font-normal text-gray-400">/{stats.total}</span></p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500">Gescraped</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{scraperStats.fromScraper}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500">Ø Google</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{scraperStats.avgRating}<span className="text-sm font-normal text-gray-400">⭐</span></p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500">Vollständig</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round((scraperStats.withEmail / Math.max(stats.total, 1)) * 100)}<span className="text-sm font-normal text-gray-400">%</span></p>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Score-Verteilung (Leads)</h3>
        <div className="flex items-end gap-2 h-24">
          {scoreDistribution.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t-lg transition-all hover:scale-105"
                style={{
                  height: `${Math.max((item.count / Math.max(...scoreDistribution.map(d => d.count), 1)) * 80, 8)}px`,
                  backgroundColor: item.color
                }}
              />
              <span className="text-xs text-gray-500 mt-2 text-center">{item.name}</span>
              <span className="text-sm font-bold text-gray-700">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        {/* Pipeline Bar Chart */}
        <div className="lg:col-span-2 card-premium bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Pipeline Übersicht</h3>
              <p className="text-xs text-gray-500 mt-1">Verteilung nach Status</p>
            </div>
            <div className="px-3 py-1.5 bg-purple-100 rounded-lg">
              <span className="text-xs font-bold text-purple-700">Live Daten</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)'
                }}
              />
              <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card-premium bg-white p-6 rounded-2xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Verteilung</h3>
            <p className="text-xs text-gray-500 mt-1">Lead Status</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">
              <p className="text-sm">Keine Daten verfügbar</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-premium bg-white p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Neueste Leads</h3>
            <p className="text-xs text-gray-500 mt-1">Ihre zuletzt hinzugefügten Leads</p>
          </div>
          <button className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
            Alle anzeigen →
          </button>
        </div>
        <div className="space-y-3">
          {recentLeads.length > 0 ? (
            recentLeads.map((lead, index) => (
              <div key={lead.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all border border-gray-100 hover:border-purple-200 hover:shadow-md group" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-12 h-12 bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <span className="text-base font-bold text-white">{lead.company[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{lead.company}</p>
                  <p className="text-sm text-gray-500">{lead.contactPerson}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 md:gap-3">
                  <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm ${lead.status === 'Neu' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                    lead.status === 'Qualifiziert' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                      lead.status === 'Gewonnen' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                    {lead.status}
                  </span>
                  <span className="text-base font-bold text-gray-900 whitespace-nowrap">€{lead.value?.toLocaleString() || '0'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-gray-400">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-semibold">Noch keine Leads vorhanden</p>
              <p className="text-sm mt-1">Erstellen Sie Ihren ersten Lead</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}