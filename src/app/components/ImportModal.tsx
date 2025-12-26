import { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, FileText } from 'lucide-react';

interface ImportModalProps {
  onClose: () => void;
  onImport: (data: any[]) => void;
}

export function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [csvData, setCsvData] = useState('');
  const [error, setError] = useState('');

  // Prevent body scroll
  useState(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvData(event.target?.result as string);
        setError('');
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setError('CSV muss mindestens eine Header-Zeile und eine Daten-Zeile enthalten');
      return [];
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const obj: any = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      data.push(obj);
    }

    return data;
  };

  const handleImport = () => {
    if (!csvData) {
      setError('Bitte wählen Sie eine CSV-Datei aus');
      return;
    }

    const parsed = parseCSV(csvData);
    if (parsed.length > 0) {
      onImport(parsed);
      onClose();
    }
  };

  const sampleCSV = `company,contactPerson,email,phone,status
Müller Autoteile GmbH,Max Mustermann,max@mueller.de,+49 123 456789,Neu
Schmidt Parts AG,Anna Schmidt,anna@schmidt.de,+49 987 654321,Qualifiziert`;

  const downloadSample = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_vorlage.csv';
    a.click();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white">Leads importieren</h3>
            <p className="text-purple-100 mt-1 text-sm md:text-base">CSV-Datei hochladen</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Download Template */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">CSV-Vorlage herunterladen</p>
                <p className="text-sm text-blue-700">Verwenden Sie diese Vorlage für den Import</p>
              </div>
            </div>
            <button
              onClick={downloadSample}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-200 border-gray-300 hover:border-[#7c3aed] hover:bg-gray-50">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Datei hierher ziehen oder klicken
              </p>
              <p className="text-sm text-gray-500">
                Unterstützte Formate: CSV
              </p>
              {csvData && (
                <p className="text-sm text-green-600 mt-2 font-medium">
                  ✓ Datei geladen
                </p>
              )}
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl border bg-red-50 border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">Fehler</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">Hinweise:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Die erste Zeile muss die Spaltennamen enthalten</li>
              <li>• Pflichtfelder: company, contactPerson, email</li>
              <li>• Verwenden Sie Komma (,) als Trennzeichen</li>
              <li>• Maximal 1000 Leads pro Import</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
            >
              Abbrechen
            </button>
            <button
              onClick={handleImport}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm"
            >
              Importieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}