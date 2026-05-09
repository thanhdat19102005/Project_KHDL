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
        console.log(`[API] Success: ${url}`, Array.isArray(data) ? `count=${data.length}` : 'object');
        return data;
    } catch (e) {
        console.error(`[API] Fetch exception: ${url}`, e);
        return null;
    }
}

export function useKpi() {
    const [data, setData] = useState<KpiData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        safeFetchJson<KpiData>(`${API_BASE}/kpi`)
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    return { data, loading };
}

export function useSearchDistribution() {
    const [data, setData] = useState<SearchDistribution[]>([]);
    useEffect(() => {
        safeFetchJson<SearchDistribution[]>(`${API_BASE}/search-distribution`).then(d => {
            if (d) setData(d);
        });
    }, []);
    return data;
}

export function useMonthlyTrend() {
    const [data, setData] = useState<MonthlyTrend[]>([]);
    useEffect(() => {
        safeFetchJson<MonthlyTrend[]>(`${API_BASE}/monthly-trend`).then(d => {
            if (d) setData(d);
        });
    }, []);
    return data;
}

export function useTopKeywords() {
    const [data, setData] = useState<TopKeyword[]>([]);
    useEffect(() => {
        safeFetchJson<TopKeyword[]>(`${API_BASE}/top-keywords`).then(d => {
            if (d) setData(d);
        });
    }, []);
    return data;
}

export function useUsers(search: string, cluster: number | null, topCategory: string | null, page: number = 1) {
    const [data, setData] = useState<UserItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (cluster !== null) params.set('cluster', cluster.toString());
        if (topCategory) params.set('topCategory', topCategory);
        params.set('page', page.toString());
        params.set('pageSize', '16');
        safeFetchJson<{ data: UserItem[]; totalCount: number }>(`${API_BASE}/users?${params}`)
            .then(d => {
                if (d) {
                    setData(d.data);
                    setTotalCount(d.totalCount);
                }
            })
            .finally(() => setLoading(false));
    }, [search, cluster, topCategory, page]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { data, totalCount, loading, refetch: fetchUsers };
}

export function useUserDetail(id: string | null) {
    const [data, setData] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) {
            setData(null);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setData(null);
        safeFetchJson<UserDetail>(`${API_BASE}/users/${id}`)
            .then(d => {
                if (!cancelled) setData(d);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    return { data, loading };
}

export function useUserInsight(id: string | null) {
    const [data, setData] = useState<UserInsight | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) {
            setData(null);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setData(null);
        safeFetchJson<UserInsight>(`${API_BASE}/users/${id}/insight`)
            .then(d => {
                if (!cancelled) setData(d);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    return { data, loading };
}

export function useSegments() {
    const [data, setData] = useState<SegmentSummary[]>([]);
    useEffect(() => {
        safeFetchJson<SegmentSummary[]>(`${API_BASE}/segments`).then(d => {
            if (d) setData(d);
        });
    }, []);
    return data;
}

export function useSegmentScatter() {
    const [data, setData] = useState<ScatterPoint[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        safeFetchJson<ScatterPoint[]>(`${API_BASE}/segment-scatter`)
            .then(d => {
                if (d) setData(d);
            })
            .finally(() => setLoading(false));
    }, []);
    return { data, loading };
}

export function useSegmentInsights() {
    const [data, setData] = useState<SegmentInsight[]>([]);
    useEffect(() => {
        safeFetchJson<SegmentInsight[]>(`${API_BASE}/segment-insights`).then(d => {
            if (d) setData(d);
        });
    }, []);
    return data;
}



export function useTopCategories() {
    const [data, setData] = useState<TopCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        safeFetchJson<TopCategory[]>(`${API_BASE}/top-categories`)
            .then(d => { if (d) setData(d); })
            .finally(() => setLoading(false));
    }, []);

    return { data, loading };
}


// Thêm vào đoạn này để lấy dữ liệu Platform
export const usePlatformDistribution = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard/platform-distribution')
            .then(res => res.json())
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return { data, loading };
};