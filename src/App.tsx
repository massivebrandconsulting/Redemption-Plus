import { useState } from 'react';
import { AppData } from './types';
import {
  parseDeclineFile, parseConnectionsFile, parseLeadsFile, parseInvoicesFile, detectKind,
} from './utils/excelParser';
import MultiFileUpload from './components/MultiFileUpload';
import CommandCenter from './components/CommandCenter';

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    setLoading(true);
    setError(null);

    const result: AppData = {
      accounts: [],
      activity: [],
      leads: [],
      invoices: [],
      fileNames: files.map(f => f.name),
      uploadedAt: new Date(),
      asOf: '',
    };

    try {
      for (const file of files) {
        const kind = detectKind(file.name);
        if (kind === 'invoices') {
          const records = await parseInvoicesFile(file);
          result.invoices.push(...records);
        } else if (kind === 'decline') {
          const { records, asOf } = await parseDeclineFile(file);
          result.accounts.push(...records);
          if (asOf) result.asOf = asOf;
        } else if (kind === 'connections') {
          const records = await parseConnectionsFile(file);
          result.activity.push(...records);
        } else if (kind === 'leads') {
          const records = await parseLeadsFile(file);
          result.leads.push(...records);
        } else {
          // Try invoice parser first for unknown files, then decline
          let handled = false;
          try {
            const records = await parseInvoicesFile(file);
            if (records.length > 5) { result.invoices.push(...records); handled = true; }
          } catch { /* ignore */ }
          if (!handled) {
            try {
              const { records } = await parseDeclineFile(file);
              if (records.length > 5) { result.accounts.push(...records); }
            } catch { /* ignore */ }
          }
        }
      }

      if (
        result.accounts.length === 0 &&
        result.activity.length === 0 &&
        result.leads.length === 0 &&
        result.invoices.length === 0
      ) {
        setError('No data could be parsed from the uploaded files. Check that filenames include keywords like "Invoice", "Decline", "Connections", or "Leads".');
        setLoading(false);
        return;
      }

      setData(result);
    } catch (e) {
      setError(`Error parsing files: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  if (data) {
    return <CommandCenter data={data} onReset={() => setData(null)} />;
  }

  return <MultiFileUpload onFiles={handleFiles} loading={loading} error={error} />;
}
