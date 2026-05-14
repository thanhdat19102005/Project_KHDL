// --- GIỮ NGUYÊN CÁC INTERFACE CŨ ---

export interface KpiData {
    totalUsers: number;
    totalSearch: number;
    avgSearchPerUser: number;
    monthlyActiveCustomers?: {
        month: string;
        active_customers: number;
    };
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
    segmentName?: string;
    topCategory: string;
    riskLevel?: string;      // THÊM: Nguy cơ (Low/Med/High)
    churnProb?: number;      // THÊM: Xác suất rời bỏ
}

export interface UserDetail {
    customerId: string;
    totalSearch: number;
    cluster: number;
    segmentName?: string; // THÊM MỚI: Tên phân khúc
    topKeyword: string;
    topCategory: string;
    monthlySearch: { month: string; searchCount: number }[];
}

export interface UserInsight {
    cluster: number;
    clusterName: string; // Đây chính là segmentName cho riêng detail
    behavior: string;
    meaning: string;
    action: string;
}

export interface TopCategory {
    category_name: string;
    total_search: number;
    percentage: number;
}

// --- CẬP NHẬT & THÊM MỚI CHO TASK SEGMENT USER ---

export interface SegmentSummary {
    cluster: number;
    name: string;      // Mapping cũ
    segmentName: string; // THÊM MỚI: Theo yêu cầu Mapping Layer
    color: string;
    totalUsers: number;
    avgTotalSearch: number;
    avgUniqueKeywords: number;
    avgCategories: number;
    avgSearchPerMonth: number;
    label: string;    // Thường chứa segmentName từ Backend
}

export interface ScatterPoint {
    x: number;
    y: number;
    cluster: number;
    segmentName?: string; // THÊM MỚI: Hiện tên khi hover vào điểm
    customerId?: string;
}

export interface SegmentInsight {
    cluster: number;
    name: string;       // Mapping cũ
    segmentName?: string; // THÊM MỚI: Đồng bộ với Backend mapping
    color: string;
    title: string;
    text: string;
}

// Section 5: Bảng danh sách Segment chi tiết
export interface SegmentUserTableItem {
    customerId: string;
    cluster: number;
    segmentName: string; // THÊM MỚI: Hiển thị trong cột của bảng
    totalSearch: number;
    uniqueKeywords: number;
    totalCategories: number;
    avgSearchMonth: number;
}
export interface AIInsights {
    churnRisk: number;
    riskLevel: string;
    predictedCLV: number;
    recommendations: string[];
}
