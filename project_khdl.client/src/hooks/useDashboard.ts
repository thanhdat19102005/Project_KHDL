import { useState, useEffect, useCallback } from 'react';
import type {
    KpiData, SearchDistribution, MonthlyTrend, TopKeyword,
    UserItem, UserDetail, UserInsight, SegmentSummary, ScatterPoint, SegmentInsight, TopCategory
} from '@/types';

const API_BASE = '/api/dashboard';

async function safeFetchJson<T>(url: string): Promise<T | null> {
    try {
        console.log(`[API] Fetching: ${url}`);
        const r = await fetch(url);
        if (!r.ok) {
            console.error(`[API] Error ${r.status}: ${url}`);
            return null;
        }
        const data = await r.json() as T;
        return data;
    } catch (e) {
        console.error(`[API] Fetch exception: ${url}`, e);
        return null;
    }
}

// --- CÁC HOOK CŨ GIỮ NGUYÊN ---

export function useKpi() {
    const [data, setData] = useState<KpiData | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        safeFetchJson<KpiData>(`${API_BASE}/kpi`).then(setData).finally(() => setLoading(false));
    }, []);
    return { data, loading };
}

export function useSearchDistribution() {
    const [data, setData] = useState<SearchDistribution[]>([]);
    useEffect(() => {
        safeFetchJson<SearchDistribution[]>(`${API_BASE}/search-distribution`).then(d => { if (d) setData(d); });
    }, []);
    return data;
}

export function useMonthlyTrend() {
    const [data, setData] = useState<MonthlyTrend[]>([]);
    useEffect(() => {
        safeFetchJson<MonthlyTrend[]>(`${API_BASE}/monthly-trend`).then(d => { if (d) setData(d); });
    }, []);
    return data;
}

export function useTopKeywords() {
    const [data, setData] = useState<TopKeyword[]>([]);
    useEffect(() => {
        safeFetchJson<TopKeyword[]>(`${API_BASE}/top-keywords`).then(d => { if (d) setData(d); });
    }, []);
    return data;
}

export function useUsers(search: string, cluster: number | null, topCategory: string | null, page: number = 1) {
    const [data, setData] = useState<UserItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (cluster !== null) params.set('cluster', cluster.toString());
        if (topCategory) params.set('topCategory', topCategory);
        params.set('page', page.toString());
        params.set('pageSize', '16');

        safeFetchJson<{ data: UserItem[]; totalCount: number }>(`${API_BASE}/users?${params}`)
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
    }, [search, cluster, topCategory, page]);

    return { data, totalCount, loading, refetch: () => {} };
}

// ... useUserDetail và useUserInsight giữ nguyên ...
export function useUserDetail(id: string | null) {
    const [data, setData] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!id) { setData(null); setLoading(false); return; }
        setLoading(true);
        safeFetchJson<UserDetail>(`${API_BASE}/users/${id}`).then(setData).finally(() => setLoading(false));
    }, [id]);
    return { data, loading };
}

export function useUserInsight(id: string | null) {
    const [data, setData] = useState<UserInsight | null>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!id) { setData(null); setLoading(false); return; }
        setLoading(true);
        safeFetchJson<UserInsight>(`${API_BASE}/users/${id}/insight`).then(setData).finally(() => setLoading(false));
    }, [id]);
    return { data, loading };
}

// --- CẬP NHẬT CÁC HOOK CHO SEGMENTATION (ĐỂ LẤY ĐẦY ĐỦ DỮ LIỆU) ---

export function useClusterSummaries() {
    const [data, setData] = useState<SegmentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Gọi API cluster-summaries mới ở Backend để lấy đủ Avg Search, Avg Keywords...
        safeFetchJson<SegmentSummary[]>(`${API_BASE}/cluster-summaries`)
            .then(d => { if (d) setData(d); })
            .finally(() => setLoading(false));
    }, []);
    return { data, loading };
}

export function useSegmentScatter() {
    const [data, setData] = useState<ScatterPoint[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        safeFetchJson<ScatterPoint[]>(`${API_BASE}/segment-scatter`)
            .then(d => { if (d) setData(d); })
            .finally(() => setLoading(false));
    }, []);
    return { data, loading };
}

export function useSegmentInsights() {
    const [data, setData] = useState<SegmentInsight[]>([]);
    useEffect(() => {
        safeFetchJson<SegmentInsight[]>(`${API_BASE}/segment-insights`).then(d => { if (d) setData(d); });
    }, []);
    return data;
}

// Hook mới cho Section 5: Bảng Segment chi tiết
export function useSegmentUsersTable(search: string, cluster: number | null, page: number = 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (cluster !== null) params.set('cluster', cluster.toString());
        params.set('page', page.toString());
        params.set('pageSize', '15');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        safeFetchJson<{ data: any[]; totalCount: number }>(`${API_BASE}/segment-users?${params}`)
            .then(d => { if (d) { setData(d.data); setTotalCount(d.totalCount); } })
            .finally(() => setLoading(false));
    }, [search, cluster, page]);

    return { data, totalCount, loading };
}

export function useTopCategories() {
    const [data, setData] = useState<TopCategory[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        safeFetchJson<TopCategory[]>(`${API_BASE}/top-categories`).then(d => { if (d) setData(d); }).finally(() => setLoading(false));
    }, []);
    return { data, loading };
}

// Platform distribution hook
export const usePlatformDistribution = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        safeFetchJson<any[]>('/api/dashboard/platform-distribution')
            .then(d => { if (Array.isArray(d)) setData(d); })
            .finally(() => setLoading(false));
    }, []);
    return { data, loading };
};