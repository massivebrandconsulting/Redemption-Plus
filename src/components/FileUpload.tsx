import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface Props {
  onFile: (text: string, filename: string) => void;
  onSampleData: () => void;
}

export default function FileUpload({ onFile, onSampleData }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file exported from Salesforce.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = e => onFile(e.target?.result as string, file.name);
    reader.readAsText(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">Pipeline Dashboard</span>
        </div>
        <p className="text-slate-400 text-sm">
          Export your Salesforce Opportunities report as CSV, then upload it here.
        </p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
          ${dragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800/50'
          }
        `}
        onClick={() => document.getElementById('csv-input')?.click()}
      >
        <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={onChange} />
        <Upload className={`w-10 h-10 mx-auto mb-4 ${dragging ? 'text-blue-400' : 'text-slate-500'}`} />
        <p className="text-white font-medium mb-1">Drop your Salesforce CSV here</p>
        <p className="text-slate-500 text-sm">or click to browse</p>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px w-20 bg-slate-800" />
        <span className="text-slate-600 text-sm">or</span>
        <div className="h-px w-20 bg-slate-800" />
      </div>

      <button
        onClick={onSampleData}
        className="mt-4 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
      >
        Load sample data to preview the dashboard
      </button>

      <div className="mt-10 max-w-lg text-left">
        <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wider">
          Required CSV columns
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-slate-500 text-xs">
          {[
            ['Opportunity Name', 'required'],
            ['Stage', 'required'],
            ['Amount', 'recommended'],
            ['Close Date', 'required'],
            ['Created Date', 'required'],
            ['Account Name', 'recommended'],
            ['Owner', 'recommended'],
            ['Last Modified Date', 'optional'],
            ['Probability (%)', 'optional'],
            ['Type', 'optional'],
          ].map(([col, req]) => (
            <div key={col} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                req === 'required' ? 'bg-blue-500' :
                req === 'recommended' ? 'bg-slate-500' : 'bg-slate-700'
              }`} />
              <span>{col}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
