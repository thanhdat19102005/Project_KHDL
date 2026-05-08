export interface KpiData {
  totalUsers: number;
  totalSearch: number;
  avgSearchPerUser: number;
  updatedAt: string;
}

export interface SearchDistribution {
  category: string;
  totalSearch: number;
  percentage: number;
}

export interface MonthlyTrend {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  search_hour: any;
  month: string;
  searchCount: number;
}

export interface TopKeyword {
  keyword: string;
  searchCount: number;
}

export interface UserItem {
  customerId: string;
  totalSearch: number;
  cluster: number;
  topCategory: string;
}

export interface UserDetail {
  customerId: string;
  totalSearch: number;
  cluster: number;
  topKeyword: string;
  topCategory: string;
  monthlySearch: { month: string; searchCount: number }[];
}

export interface UserInsight {
  cluster: number;
  clusterName: string;
  behavior: string;
  meaning: string;
  action: string;
}

export interface SegmentSummary {
  cluster: number;
  name: string;
  color: string;
  totalUsers: number;
  totalSearch: number;
}

export interface ScatterPoint {
  customerId: string;
  totalSearch: number;
  activeMonths: number;
  cluster: number;
}

export interface SegmentInsight {
  cluster: number;
  name: string;
  color: string;
  title: string;
  text: string;
}



export interface TopCategory {
    category_name: string;
    total_search: number;
    percentage: number;
}