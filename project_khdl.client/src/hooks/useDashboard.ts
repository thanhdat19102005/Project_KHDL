import { useState, useEffect } from 'react';
import type { 
    KpiData, SearchDistribution, MonthlyTrend, TopKeyword, 
    UserItem, UserDetail, UserInsight, SegmentSummary, ScatterPoint, SegmentInsight, TopCategory
} from '@/types';

const API_BASE = '/api/dashboard';

// Helper to get current source path
const getFetchUrl = (endpoint: string) => {
    const source = localStorage.getItem('dashboard_source') || 'api';
    if (source === 'api') return `${API_BASE}/${endpoint}`;
    
    // Map endpoints to mock files
    const mockMap: Record<string, string> = {
        'kpi': 'kpi.json',
        'search-distribution': 'search-distribution.json',
        'monthly-trend': 'monthly-trend.json',
        'top-keywords': 'top-keywords.json',
        'top-categories': 'top-categories.json',
        'platform-distribution': 'platform-distribution.json',
        'cluster-summaries': 'cluster-summaries.json',
        'segment-scatter': 'segment-scatter.json',
        'segment-insights': 'segment-insights.json',
        'segment-users': 'segment-users.json',
        'users': 'segment-users.json' // Map users endpoint to the same mock file
    };

    const cleanEndpoint = endpoint.split('?')[0];
    const fileName = mockMap[cleanEndpoint] || `${cleanEndpoint}.json`;
    return `/mock_api/${source}/${fileName}`;
};

// Singleton Auto-refresh mechanism
if (typeof window !== 'undefined' && !(window as any).__DASHBOARD_INTERVAL_SET__) {
    (window as any).__DASHBOARD_INTERVAL_SET__ = true;
    setInterval(() => {
        console.log("[Dashboard] Triggering 30s auto-refresh");
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    }, 30000);
}

export function useDataSource() {
    const [source, setSource] = useState(localStorage.getItem('dashboard_source') || 'api');
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    useEffect(() => {
        const handler = () => {
            setSource(localStorage.getItem('dashboard_source') || 'api');
            setLastRefresh(Date.now());
        };
        
        window.addEventListener('dashboard-refresh', handler);
        return () => window.removeEventListener('dashboard-refresh', handler);
    }, []);

    const switchSource = (newSource: 'api' | 'v1' | 'v2') => {
        localStorage.setItem('dashboard_source', newSource);
        setSource(newSource);
        window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    };

    return { source, switchSource, lastRefresh };
}

async function safeFetchJson<T>(url: string): Promise<T | null> {
    try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json() as T;
    } catch (e) {
        return null;
    }
}

export function useKpi() {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<KpiData | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(true);
        safeFetchJson<KpiData>(getFetchUrl('kpi')).then(setData).finally(() => setLoading(false));
    }, [lastRefresh]);
    return { data, loading };
}

export function useSearchDistribution() {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<SearchDistribution[]>([]);
    useEffect(() => {
        safeFetchJson<SearchDistribution[]>(getFetchUrl('search-distribution')).then(d => { if (d) setData(d); });
    }, [lastRefresh]);
    return data;
}

export function useMonthlyTrend() {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<MonthlyTrend[]>([]);
    useEffect(() => {
        safeFetchJson<MonthlyTrend[]>(getFetchUrl('monthly-trend')).then(d => { if (d) setData(d); });
    }, [lastRefresh]);
    return data;
}

export function useTopKeywords() {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<TopKeyword[]>([]);
    useEffect(() => {
        safeFetchJson<TopKeyword[]>(getFetchUrl('top-keywords')).then(d => { if (d) setData(d); });
    }, [lastRefresh]);
    return data;
}

export function useUsers(search: string = '', cluster: number | null = null, pageSize: number | null = 16, page: number = 1) {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<UserItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (cluster !== null && cluster !== undefined) params.set('cluster', cluster.toString());
        params.set('page', (page || 1).toString());
        params.set('pageSize', (pageSize || 16).toString());

        safeFetchJson<{ data: UserItem[]; totalCount: number }>(getFetchUrl(`users?${params}`))
            .then(d => {
                if (!cancelled && d) {
                    setData(d.data);
                    setTotalCount(d.totalCount);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [search, cluster, pageSize, page, lastRefresh]);

    return { data, totalCount, loading };
}

export function useUserDetail(id: string | null) {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) {
            setData(null);
            return;
        }
        setLoading(true);
        safeFetchJson<UserDetail>(getFetchUrl(`user/${id}`))
            .then(setData)
            .finally(() => setLoading(false));
    }, [id, lastRefresh]);

    return { data, loading };
}

export function useUserInsight(id: string | null) {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<UserInsight[]>([]);
    useEffect(() => {
        if (!id) {
            setData([]);
            return;
        }
        safeFetchJson<UserInsight[]>(getFetchUrl(`user/${id}/insights`)).then(d => { if (d) setData(d); });
    }, [id, lastRefresh]);
    return data;
}

// Segmentation Hooks
export function useClusterSummaries() {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<SegmentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        safeFetchJson<SegmentSummary[]>(getFetchUrl('cluster-summaries'))
            .then(d => { if (d) setData(d); })
            .finally(() => setLoading(false));
    }, [lastRefresh]);
    return { data, loading };
}

export function useSegmentScatter() {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<ScatterPoint[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        safeFetchJson<ScatterPoint[]>(getFetchUrl('segment-scatter'))
            .then(d => { if (d) setData(d); })
            .finally(() => setLoading(false));
    }, [lastRefresh]);
    return { data, loading };
}

export function useSegmentInsights() {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<SegmentInsight[]>([]);
    useEffect(() => {
        safeFetchJson<SegmentInsight[]>(getFetchUrl('segment-insights')).then(d => { if (d) setData(d); });
    }, [lastRefresh]);
    return data;
}

export function useSegmentUsersTable(search: string = '', cluster: string | number | null = null, page: number = 1) {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (cluster) params.set('cluster', cluster);
        params.set('page', page.toString());
        params.set('pageSize', '15');

        safeFetchJson<{ data: any[]; totalCount: number }>(getFetchUrl(`segment-users?${params}`))
            .then(d => { if (d) { setData(d.data); setTotalCount(d.totalCount); } })
            .finally(() => setLoading(false));
    }, [search, cluster, page, lastRefresh]);

    return { data, totalCount, loading };
}

export function useTopCategories() {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<TopCategory[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        safeFetchJson<TopCategory[]>(getFetchUrl('top-categories')).then(d => { if (d) setData(d); }).finally(() => setLoading(false));
    }, [lastRefresh]);
    return { data, loading };
}

export function usePlatformDistribution() {
    const { lastRefresh } = useDataSource();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        safeFetchJson<any[]>(getFetchUrl('platform-distribution'))
            .then(d => { if (Array.isArray(d)) setData(d); })
            .finally(() => setLoading(false));
    }, [lastRefresh]);
    return { data, loading };
}