import { useState, useEffect } from 'react';
import { getLeads, saveLead, getSettings, type Lead, type PipelineStage } from '../utils/storage';
import { LeadDetailModal } from './LeadDetailModal';
import { TrendingUp, DollarSign, Plus, Eye, Edit, Trash2, ChevronRight, Target } from 'lucide-react';
import { LeadModal } from './LeadModal';

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  'blue': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', gradient: 'from-blue-500 to-blue-600' },
  'cyan': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', gradient: 'from-cyan-500 to-cyan-600' },
  'green': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', gradient: 'from-green-500 to-green-600' },
  'yellow': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', gradient: 'from-yellow-500 to-yellow-600' },
  'orange': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', gradient: 'from-orange-500 to-orange-600' },
  'red': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', gradient: 'from-red-500 to-red-600' },
  'purple': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', gradient: 'from-purple-500 to-purple-600' },
  'pink': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', gradient: 'from-pink-500 to-pink-600' },
  'emerald': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', gradient: 'from-emerald-500 to-emerald-600' },
  'gray': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', gradient: 'from-gray-500 to-gray-600' },
};

export function PipelineView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [activeStageId, setActiveStageId] = useState<string>('');
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allLeads = getLeads();
    const settings = getSettings();
    const activeStages = settings.pipelineStages
      .filter(s => s.isActive)
      .sort((a, b) => a.order - b.order);
    
    setLeads(allLeads);
    setStages(activeStages);
    
    if (activeStages.length > 0 && !activeStageId) {
      setActiveStageId(activeStages[0].id);
    }
  };

  const activeStage = stages.find(s => s.id === activeStageId);
  const stageLeads = leads.filter(lead => lead.status === activeStage?.name);
  const totalStageValue = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
  const weightedValue = Math.round(totalStageValue * (activeStage?.probability || 0) / 100);

  const handleMoveToStage = (lead: Lead, targetStageName: string) => {
    saveLead({ ...lead, status: targetStageName });
    loadData();
  };

  const handleDeleteLead = (id: string) => {
    if (confirm('Möchten Sie diesen Lead wirklich löschen?')) {
      const filteredLeads = leads.filter(l => l.id !== id);
      setLeads(filteredLeads);
      loadData();
    }
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleSaveLead = (lead: Partial<Lead>) => {
    saveLead(lead);
    loadData();
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const getColorStyles = (colorName: string) => {
    return STAGE_COLORS[colorName] || STAGE_COLORS['blue'];
  };

  const priorityColors: Record<string, string> = {
    'Hoch': 'bg-red-100 text-red-700 border-red-200',
    'Mittel': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Niedrig': 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Pipeline</h2>
        <p className="text-gray-500 mt-1 text-sm">Verwalten Sie Ihre Leads nach Pipeline-Stages</p>
      </div>

      {/* Pipeline Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <div className="flex overflow-x-auto">
          {stages.map((stage, index) => {
            const colors = getColorStyles(stage.color);
            const stageLeadsCount = leads.filter(l => l.status === stage.name).length;
            const stageValue = leads.filter(l => l.status === stage.name).reduce((sum, l) => sum + (l.value || 0), 0);
            const isActive = activeStageId === stage.id;
            
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`relative flex-1 min-w-[140px] md:min-w-[180px] px-4 py-4 border-b-4 transition-all ${
                  isActive 
                    ? `${colors.border} ${colors.bg}` 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wide ${isActive ? colors.text : 'text-gray-500'}`}>
                    {stage.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? `${colors.bg} ${colors.text} border ${colors.border}` : 'bg-gray-100 text-gray-600'}`}>
                    {stageLeadsCount}
                  </span>
                </div>
                <div className={`text-sm font-bold ${isActive ? colors.text : 'text-gray-700'}`}>
                  €{stageValue.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {stage.probability}% Chance
                </div>
                {index < stages.length - 1 && (
                  <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Content */}
      {activeStage && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Stage Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-gray-500" />
                <p className="text-xs text-gray-500 font-medium">Leads in Stage</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stageLeads.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <p className="text-xs text-gray-500 font-medium">Gesamtwert</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">€{totalStageValue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <p className="text-xs text-gray-500 font-medium">Gewichtet</p>
              </div>
              <p className="text-2xl font-bold text-[#7c3aed]">€{weightedValue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <p className="text-xs text-gray-500 font-medium">Ø Wert</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                €{stageLeads.length > 0 ? Math.round(totalStageValue / stageLeads.length).toLocaleString() : '0'}
              </p>
            </div>
          </div>

          {/* Leads List */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Leads in {activeStage.name}
              </h3>
              <button
                onClick={() => {
                  setEditingLead(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#7c3aed] text-white rounded-lg hover:bg-[#6d28d9] transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Neuer Lead
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {stageLeads.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${getColorStyles(activeStage.color).gradient} opacity-20 rounded-2xl flex items-center justify-center`}>
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-lg font-medium">Keine Leads in dieser Stage</p>
                  <p className="text-sm mt-1">Leads werden hier angezeigt, wenn sie zu "{activeStage.name}" gehören</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stageLeads.map((lead) => {
                    const colors = getColorStyles(activeStage.color);
                    return (
                      <div
                        key={lead.id}
                        className="bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-[#7c3aed] hover:shadow-lg transition-all group"
                      >
                        {/* Lead Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-12 h-12 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <span className="text-lg font-bold text-white">{lead.company[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{lead.company}</h4>
                            <p className="text-sm text-gray-500 truncate">{lead.contactPerson}</p>
                            <p className="text-xs text-gray-400 truncate">{lead.email}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setDetailLead(lead)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Details anzeigen"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleEditClick(lead)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Bearbeiten"
                            >
                              <Edit className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Löschen"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>

                        {/* Value */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                          <span className="text-xs text-gray-500 font-medium">Geschätzter Wert</span>
                          <span className="text-lg font-bold text-gray-900">€{lead.value?.toLocaleString() || '0'}</span>
                        </div>

                        {/* Tags & Actions */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {lead.source}
                          </span>
                          {lead.priority && (
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${priorityColors[lead.priority]}`}>
                              {lead.priority}
                            </span>
                          )}
                          {lead.industry && (
                            <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium border border-gray-200">
                              {lead.industry}
                            </span>
                          )}
                        </div>

                        {/* Move to Stage */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-500 font-medium">Verschieben nach:</span>
                          <div className="flex flex-wrap gap-1">
                            {stages
                              .filter(s => s.id !== activeStageId)
                              .slice(0, 3)
                              .map((stage) => {
                                const stageColors = getColorStyles(stage.color);
                                return (
                                  <button
                                    key={stage.id}
                                    onClick={() => handleMoveToStage(lead, stage.name)}
                                    className={`text-xs px-2 py-1 ${stageColors.bg} ${stageColors.text} border ${stageColors.border} rounded font-medium hover:scale-105 transition-transform`}
                                  >
                                    {stage.name}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lead Modal */}
      {isModalOpen && (
        <LeadModal
          lead={editingLead}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLead(null);
          }}
          onSave={handleSaveLead}
        />
      )}

      {/* Detail Modal */}
      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          onClose={() => setDetailLead(null)}
          onEdit={(lead) => {
            setDetailLead(null);
            handleEditClick(lead);
          }}
          onDelete={(id) => {
            handleDeleteLead(id);
            setDetailLead(null);
          }}
        />
      )}
    </div>
  );
}