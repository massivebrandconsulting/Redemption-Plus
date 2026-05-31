import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface UploadedFile {
  name: string;
  kind: 'decline' | 'connections' | 'leads' | 'unknown';
  status: 'ready' | 'error';
}

interface Props {
  onFiles: (files: File[]) => void;
  loading: boolean;
  error: string | null;
}

const KIND_INFO = {
  decline: { label: 'Accounts / Decline List', color: 'text-blue-400', dot: 'bg-blue-400' },
  connections: { label: 'Connections / Activity', color: 'text-violet-400', dot: 'bg-violet-400' },
  leads: { label: 'Open Leads', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  unknown: { label: 'Unknown type', color: 'text-slate-500', dot: 'bg-slate-500' },
};

const detectKind = (name: string): UploadedFile['kind'] => {
  const l = name.toLowerCase();
  if (l.includes('decline') || l.includes('account')) return 'decline';
  if (l.includes('connect')) return 'connections';
  if (l.includes('lead')) return 'leads';
  return 'unknown';
};

export default function MultiFileUpload({ onFiles, loading, error }: Props) {
  const [queued, setQueued] = useState<UploadedFile[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter(f =>
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
    );
    setFiles(prev => {
      const next = [...prev];
      arr.forEach(f => { if (!next.find(e => e.name === f.name)) next.push(f); });
      return next;
    });
    setQueued(prev => {
      const next = [...prev];
      arr.forEach(f => {
        if (!next.find(e => e.name === f.name)) {
          next.push({ name: f.name, kind: detectKind(f.name), status: 'ready' });
        }
      });
      return next;
    });
  }, []);

  const remove = (name: string) => {
    setQueued(p => p.filter(f => f.name !== name));
    setFiles(p => p.filter(f => f.name !== name));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-blue-400 text-sm font-medium">Daily Command Center</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Upload Today's Reports</h1>
          <p className="text-slate-400">Drop your Salesforce exports and get an instant pulse on the business.</p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => document.getElementById('file-input')?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
            ${dragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-600'}
          `}
        >
          <input
            id="file-input" type="file" multiple accept=".xlsx,.xls,.csv" className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${dragging ? 'text-blue-400' : 'text-slate-600'}`} />
          <p className="text-white font-medium mb-1">Drop Salesforce exports here</p>
          <p className="text-slate-500 text-sm">or click to browse — .xlsx, .xls, .csv</p>
        </div>

        {/* File list */}
        {queued.length > 0 && (
          <div className="mt-4 space-y-2">
            {queued.map(f => {
              const info = KIND_INFO[f.kind];
              return (
                <div key={f.name} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                  <FileSpreadsheet className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">{f.name}</div>
                    <div className={`text-xs flex items-center gap-1.5 mt-0.5 ${info.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
                      {info.label}
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <button onClick={() => remove(f.name)} className="text-slate-600 hover:text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {queued.length > 0 && (
          <button
            onClick={() => onFiles(files)}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
          >
            {loading ? 'Processing...' : `Build Command Center →`}
          </button>
        )}

        {/* Expected files guide */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { kind: 'decline', title: 'Accounts List', desc: 'YTD sales, YOY comparison, last purchase, category breakdown' },
            { kind: 'connections', title: 'Connections', desc: 'Activity by rep — calls, emails, site visits, video calls' },
            { kind: 'leads', title: 'Open Leads', desc: 'Pipeline leads with engagement scores and sources' },
          ].map(({ kind, title, desc }) => {
            const info = KIND_INFO[kind as keyof typeof KIND_INFO];
            return (
              <div key={kind} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className={`flex items-center gap-1.5 text-xs font-medium mb-2 ${info.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
                  {title}
                </div>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
