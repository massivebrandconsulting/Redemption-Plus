export interface Opportunity {
  name: string;
  accountName: string;
  stage: string;
  amount: number;
  closeDate: Date;
  createdDate: Date;
  lastModifiedDate: Date | null;
  owner: string;
  probability: number;
  type: string;
}

export type Period = 'WTD' | 'MTD' | 'QTD' | 'YTD';

export interface PeriodMetrics {
  closedWonValue: number;
  closedWonCount: number;
  newPipelineValue: number;
  newPipelineCount: number;
  openPipelineValue: number;
  openPipelineCount: number;
}
