export interface AccountRecord {
  rep: string;
  accountName: string;
  lastPurchase: Date | null;
  salesYTD: number;
  salesLYYTD: number;
  yoyDiff: number;
  ytdChangePct: number;
  cat: {
    backwall: { ytd: number; ly: number };
    bin: { ytd: number; ly: number };
    crane: { ytd: number; ly: number };
    plush: { ytd: number; ly: number };
  };
}

export interface ActivityRecord {
  rep: string;
  type: string;
  month: string;
  count: number;
}

export interface LeadRecord {
  owner: string;
  fullName: string;
  title: string;
  company: string;
  state: string;
  leadSource: string;
  lastActivity: Date | null;
  createDate: Date | null;
  engagementScore: number;
}

export type SignalLevel = 'critical' | 'warning' | 'opportunity' | 'watch';

export interface Signal {
  level: SignalLevel;
  title: string;
  detail: string;
  rep?: string;
  account?: string;
  metric?: string;
  action: string;
}

export interface AppData {
  accounts: AccountRecord[];
  activity: ActivityRecord[];
  leads: LeadRecord[];
  fileNames: string[];
  uploadedAt: Date;
  asOf: string;
}
