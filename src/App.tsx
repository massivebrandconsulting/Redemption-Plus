import { useState } from 'react';
import { Opportunity } from './types/opportunity';
import { parseCSV } from './utils/csvParser';
import { SAMPLE_CSV } from './utils/sampleData';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { AlertCircle, X } from 'lucide-react';

interface LoadedData {
  opportunities: Opportunity[];
  filename: string;
  errors: string[];
}

export default function App() {
  const [data, setData] = useState<LoadedData | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const load = (text: string, filename: string) => {
    const result = parseCSV(text);
    setData({
      opportunities: result.opportunities,
      filename,
      errors: result.errors,
    });
    setShowErrors(result.errors.length > 0);
  };

  const loadSample = () => {
    load(SAMPLE_CSV, 'sample-salesforce-data.csv');
  };

  if (!data) {
    return <FileUpload onFile={load} onSampleData={loadSample} />;
  }

  return (
    <>
      {showErrors && data.errors.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-800 border border-amber-500/30 rounded-xl p-4 shadow-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-amber-400 text-sm font-medium">
                {data.errors.length} row{data.errors.length !== 1 ? 's' : ''} skipped
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {data.opportunities.length} opportunities loaded successfully.
              </p>
              <div className="mt-2 max-h-24 overflow-y-auto space-y-0.5">
                {data.errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-slate-500 text-xs">{e}</p>
                ))}
                {data.errors.length > 5 && (
                  <p className="text-slate-600 text-xs">+{data.errors.length - 5} more…</p>
                )}
              </div>
            </div>
            <button onClick={() => setShowErrors(false)} className="text-slate-600 hover:text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Dashboard
        opportunities={data.opportunities}
        filename={data.filename}
        onReset={() => setData(null)}
        referenceDate={new Date()}
      />
    </>
  );
}
