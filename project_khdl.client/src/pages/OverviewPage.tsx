/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo, useEffect } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { motion } from "framer-motion";

import {
  useKpi,
  useSearchDistribution,
  useMonthlyTrend,
  useTopKeywords,
  useSegmentUsersTable,
  useTopCategories,
  usePlatformDistribution,
  useClusterSummaries,
} from "@/hooks/useDashboard";

import {
  Search,
  User,
  Filter,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Crown,
  Star,
  Coffee,
  Target,
} from "lucide-react";

import { formatNumber, formatCompact } from "../utils/format";
import UserDetailPanel from "../components/UserDetailPanel";
import type { User360Data } from "../components/UserDetailPanel";





const getClusterIcon = (id: number, size = 18, className = "") => {
  switch (id) {
    case 0: return <Coffee size={size} className={className || "text-slate-400"} />;
    case 1: return <User size={size} className={className || "text-blue-500"} />;
    case 2: return <Crown size={size} className={className || "text-amber-500"} />;
    case 3: return <Star size={size} className={className || "text-emerald-500"} />;
    default: return <Target size={size} className={className} />;
  }
};

const PLATFORM_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f43f5e",
  "#ec4899",
  "#84cc16",
  "#a855f7",
];

const CATEGORY_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#d946ef",
  "#8b5cf6",
  "#64748b",
];

// Hàm vẽ chú thích "đám mây" chấm tròn tự xuống hàng
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 px-2 mt-4 pb-4">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center space-x-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-bold" style={{ color: entry.color }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};



export default function OverviewPage() {
  const { data: kpi } = useKpi();
  const factSearchTrend = useSearchDistribution() ?? [];
  const monthlyTrendRaw = useMonthlyTrend() ?? [];
  const hourData = [...monthlyTrendRaw].sort(
    (a, b) => a.search_hour - b.search_hour,
  );
  const keywords = useTopKeywords() ?? [];
  const { data: categoryDataRaw, loading: categoryLoading } =
    useTopCategories();
  const categoryData = categoryDataRaw ?? [];
  const { data: platformDataRaw } = usePlatformDistribution();
  const platformData = platformDataRaw ?? [];

  const processedPlatformData = useMemo(() => {
    if (!platformData || platformData.length === 0) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sorted = [...platformData].sort(
      (a: any, b: any) => b.total_search - a.total_search,
    );

    const top10 = sorted.slice(0, 10).map((item: any) => ({
      ...item,
      platform: item.platform
        .split("-")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    }));

    if (sorted.length <= 10) return top10;

    const others = sorted.slice(10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const othersTotal = others.reduce(
      (sum: number, item: any) => sum + item.total_search,
      0,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const othersPercentage = others
      .reduce(
        (sum: number, item: any) => sum + parseFloat(item.percentage || "0"),
        0,
      )
      .toFixed(2);

    return [
      ...top10,
      {
        platform: "Khác",
        total_search: othersTotal,
        percentage: othersPercentage,
      },
    ];
  }, [platformData]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userDetail, setUserDetail] = useState<User360Data | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [clusterFilter, setClusterFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [keywordLimit, setKeywordLimit] = useState(10);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);


  const formatKeyword = (text: string) => {
    if (!text) return "";
    // Viết hoa chữ cái đầu mỗi từ
    const capitalized = text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    // Cắt chuỗi nếu quá dài
    const truncated =
      capitalized.length > 18
        ? capitalized.substring(0, 18) + "..."
        : capitalized;
    // Dùng non-breaking space để Recharts không tự rớt dòng
    return truncated.replace(/ /g, "\u00A0");
  };

  // Lọc và format từ khóa
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredKeywords = keywords
    .map((k: any) => ({ ...k, formattedKeyword: formatKeyword(k.keyword) }))
    .slice(0, keywordLimit);

  // Lấy dữ liệu người dùng & Phân trang – dùng useSegmentUsersTable để có đủ cột
  const {
    data: tableUsers,
    totalCount,
    loading: tableLoading,
  } = useSegmentUsersTable(debouncedSearch, clusterFilter, page);
  const { data: summaries } = useClusterSummaries();
  const totalPages = Math.ceil(totalCount / 15);
  const fetchUserDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/dashboard/users/${id}/full-360`);
      const raw = await response.json();

      // Map backend model to frontend view model
      const mapped: User360Data = {
        customerId: raw.customerId,
        segment: raw.segmentName,
        clusterId: raw.cluster,
        metrics: {
          totalSearches: raw.totalSearch,
          avgSearchPerMonth: raw.avgSearchMonth,
          topCategory: raw.topCategory,
          topKeyword: raw.topKeyword,
          diversityScore: 85,
        },
        timeline: raw.timeline.map((t: any) => ({
          month: t.month,
          searchCount: t.totalSearch,
          topKeyword: t.topCategory,
        })),
        insights: {
          behavior: raw.behavioralSummary,
          meaning: raw.behaviorChange,
          action: raw.riskOpportunity,
        },
        recommendedActions: (
          raw.recommendedActions ||
          raw.RecommendedActions ||
          []
        ).map((a: any) => ({
          title: typeof a === "string" ? a : a.action,
          description:
            typeof a === "string"
              ? "Hành động được cá nhân hóa dựa trên phân tích hành vi search của khách hàng."
              : a.reason,
          impact:
            typeof a === "string"
              ? (raw.cluster !== undefined ? raw.cluster : raw.Cluster) === 0
                ? "High"
                : "Medium"
              : a.confidence > 0.85
                ? "High"
                : "Medium",
        })),
        aiInsights: raw.aiInsights || raw.AiInsights,
      };

      setUserDetail(mapped);
      setShowUserModal(true);
    } catch (error) {
      console.error("Error fetching user detail:", error);
    }
  };

  return (
    <div className="space-y-10 pb-20 relative">


      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Hệ thống Phân tích Chiến lược
          </h1>
        </div>
      </div>


      {/* ====== PDF EXPORT AREA – KPI + Charts only ====== */}
      <div id="overview-pdf-area">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex items-center gap-5 group cursor-default"
          >
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                Tổng người dùng
              </p>
              <p
                className="text-3xl font-black text-slate-800 tracking-tighter tabular-nums"
                title={formatNumber(kpi?.totalUsers)}
              >
                {kpi ? formatCompact(kpi.totalUsers) : "..."}
              </p>
            </div>
          </motion.div>
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex items-center gap-5 group cursor-default"
          >
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                Tổng lượt tìm kiếm
              </p>
              <p
                className="text-3xl font-black text-slate-800 tracking-tighter tabular-nums"
                title={formatNumber(kpi?.totalSearch)}
              >
                {kpi ? formatCompact(kpi.totalSearch) : "..."}
              </p>
            </div>
          </motion.div>
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex items-center gap-5 group cursor-default"
          >
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M19 8v2h2" />
                <path d="M19 12v2h2" />
                <path d="M19 16v2h2" />
                <path d="M16 8h2" />
                <path d="M16 12h2" />
                <path d="M16 16h2" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                Người dùng hoạt động tháng (MAC)
              </p>
              <div className="flex flex-col">
                <p
                  className="text-3xl font-black text-slate-800 tracking-tighter tabular-nums"
                  title={formatNumber(
                    kpi?.monthlyActiveCustomers?.active_customers,
                  )}
                >
                  {kpi?.monthlyActiveCustomers
                    ? formatCompact(kpi.monthlyActiveCustomers.active_customers)
                    : "..."}
                </p>
                <p className="text-[10px] font-bold text-amber-500 mt-0.5">
                  {kpi?.monthlyActiveCustomers?.month || ""}
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex items-center gap-5 group cursor-default"
          >
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <rect width="4" height="7" x="7" y="10" rx="1" />
                <rect width="4" height="12" x="15" y="5" rx="1" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                TB tìm kiếm / người
              </p>
              <p
                className="text-3xl font-black text-slate-800 tracking-tighter tabular-nums"
                title={formatNumber(Math.round(kpi?.avgSearchPerUser || 0))}
              >
                {kpi ? formatCompact(Math.round(kpi.avgSearchPerUser)) : "..."}
              </p>
            </div>
          </motion.div>
        </div>

        {/* ROW 1: CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-[400px]">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
              Xu hướng tìm kiếm theo tháng
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={factSearchTrend.filter(
                    (d: any) => d.total_search > 1000,
                  )}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5} />
                      <stop
                        offset="95%"
                        stopColor="#c7d2fe"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148,163,184,0.2)"
                  />
                  <XAxis
                    dataKey="search_month"
                    fontSize={11}
                    stroke="#e5e7eb"
                    tick={{ fill: "#374151" }}
                  />
                  <YAxis
                    fontSize={11}
                    stroke="#e5e7eb"
                    tick={{ fill: "#374151" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid #e0e7ff",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(99,102,241,0.15)",
                    }}
                    formatter={(v) => [formatNumber(Number(v)), "Lượt"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_search"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#gradTrend)"
                    dot={{
                      r: 4,
                      fill: "#6366f1",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-[400px]">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
              Phân bổ tìm kiếm theo giờ
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={hourData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradHour" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                      <stop
                        offset="95%"
                        stopColor="#bae6fd"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148,163,184,0.2)"
                  />
                  <XAxis
                    dataKey="search_hour"
                    fontSize={11}
                    stroke="#e5e7eb"
                    tick={{ fill: "#374151" }}
                    tickFormatter={(h) => `${h}h`}
                  />
                  <YAxis
                    fontSize={11}
                    stroke="#e5e7eb"
                    tick={{ fill: "#374151" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid #bae6fd",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(14,165,233,0.15)",
                    }}
                    formatter={(v) => [formatNumber(Number(v)), "Lượt"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_search"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    fill="url(#gradHour)"
                    dot={{
                      r: 3,
                      fill: "#0ea5e9",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ROW 2: 3 BOXES EQUAL HEIGHT (650px) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 1. Từ khóa tìm kiếm */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm min-h-[650px] flex flex-col">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pulse"
                  >
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                  </svg>
                  <h3 className="text-sm font-bold text-gray-800">
                    Từ khóa tìm kiếm phổ biến
                  </h3>
                </div>
                <select
                  className="border border-gray-200 rounded-full px-3 py-1 text-xs font-bold text-gray-600 outline-none cursor-pointer shadow-sm hover:border-blue-400 hover:text-blue-600 transition-all duration-200 bg-white"
                  value={keywordLimit}
                  onChange={(e) => setKeywordLimit(Number(e.target.value))}
                >
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                </select>
              </div>
            </div>
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredKeywords}
                  layout="vertical"
                  margin={{ left: 10, right: 30 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="formattedKeyword"
                    type="category"
                    width={180}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#1f2937", fontWeight: "bold", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const catMap: Record<string, string> = {
                          Drama: "Chính kịch",
                          "K-Drama": "Phim Hàn",
                          "C-Drama": "Phim Trung",
                          Anime: "Anime Nhật",
                          Action: "Hành động",
                          Animation: "Hoạt hình",
                          Show: "TV Show",
                          TV: "TV Show",
                          Horror: "Kinh dị",
                          Fantasy: "Kỳ ảo",
                          Music: "Âm nhạc",
                          Sport: "Thể thao",
                          Crime: "Tội phạm",
                          System: "Hệ thống",
                          Documentary: "Tài liệu",
                          Other: "Khác",
                        };
                        const catDisplay = catMap[data.category] || data.category || "–";

                        return (
                          <div className="bg-white/95 backdrop-blur-md p-3 border border-indigo-100 shadow-2xl rounded-2xl min-w-[160px]">
                            <p className="text-sm font-black text-slate-800 mb-2 border-b border-indigo-50 pb-1.5">
                              {data.keyword}
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                  Thể loại
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                    data.category === "Action"
                                      ? "bg-rose-50 text-rose-600"
                                      : data.category === "Anime"
                                        ? "bg-indigo-50 text-indigo-600"
                                        : data.category === "K-Drama"
                                          ? "bg-blue-50 text-blue-600"
                                          : data.category === "C-Drama"
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  {catDisplay}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                  Lượt tìm kiếm
                                </span>
                                <span className="text-xs font-black text-indigo-600 font-mono">
                                  {formatNumber(data.searchCount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="searchCount"
                    fill="#4f46e5"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. BIỂU ĐỒ DONUT (PLATFORM) - ĐÃ KÉO XỊT XUỐNG DƯỚI */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm min-h-[650px] flex flex-col">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">
              Phân bổ Nền tảng (Platform)
            </h3>
            <div className="flex-1 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedPlatformData}
                    cx="50%"
                    cy="45%" // Kéo vòng tròn xuống trung tâm hơn
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="total_search"
                    nameKey="platform"
                    stroke="none"
                  >
                    {processedPlatformData.map((_e: any, index: number) => (
                      <Cell
                        key={index}
                        fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip
                    formatter={(v, n, p) => [
                      `${formatNumber(Number(v))} lượt (${(p as any).payload?.percentage}%)`,
                      n,
                    ]}
                  />
                  <Legend content={renderCustomLegend} verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Top Danh mục tìm kiếm */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm min-h-[650px] flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
              Top 10 Thể loại phim & Nội dung
            </h3>
            <div className="flex-1 min-h-0 w-full">
              {categoryLoading ? (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Đang tải...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    layout="vertical"
                    margin={{ left: 10, right: 30 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="category_name"
                      type="category"
                      width={150}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#1f2937",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                      tickFormatter={(val) => {
                        const map: Record<string, string> = {
                          Drama: "Chính kịch",
                          "K-Drama": "Phim Hàn",
                          "C-Drama": "Phim Trung",
                          Anime: "Anime Nhật",
                          Action: "Hành động",
                          Animation: "Hoạt hình",
                          Show: "TV Show",
                          Horror: "Kinh dị",
                          Fantasy: "Kỳ ảo",
                          Music: "Âm nhạc",
                          Sport: "Thể thao",
                          Crime: "Tội phạm",
                          System: "Hệ thống",
                        };
                        return map[val] || val;
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const map: Record<string, string> = {
                            Drama: "Chính kịch",
                            "K-Drama": "Phim Hàn",
                            "C-Drama": "Phim Trung",
                            Anime: "Anime Nhật",
                            Action: "Hành động",
                            Animation: "Hoạt hình",
                            Show: "TV Show",
                            Horror: "Kinh dị",
                            Fantasy: "Kỳ ảo",
                            Music: "Âm nhạc",
                            Sport: "Thể thao",
                            Crime: "Tội phạm",
                            System: "Hệ thống",
                          };
                          const displayName =
                            map[data.category_name] || data.category_name;
                          return (
                            <div className="bg-white/95 backdrop-blur-md p-3 border border-indigo-100 shadow-2xl rounded-2xl min-w-[200px]">
                              <div className="flex items-center gap-2 mb-2 border-b border-indigo-50 pb-1.5">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      CATEGORY_COLORS[
                                        payload[0].dataKey === "total_search"
                                          ? 0
                                          : 0
                                      ],
                                  }}
                                ></div>
                                <p className="text-sm font-black text-slate-800">
                                  {displayName}
                                </p>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                                    Lượt tìm kiếm
                                  </span>
                                  <span className="text-xs font-black text-indigo-600 font-mono">
                                    {formatNumber(data.total_search)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                                    Tỷ trọng
                                  </span>
                                  <span className="text-xs font-black text-emerald-600">
                                    {data.percentage}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="total_search"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    >
                      {categoryData.map((_entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

      </div> {/* end #overview-pdf-area */}

        {/* ROW 3: LIST – excluded from PDF */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-wrap gap-6 items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-xl">
                <BarChart3 size={20} className="text-slate-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Chi tiết Khách hàng</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Tìm mã KH..."
                  className="border border-slate-200 rounded-2xl pl-11 pr-6 py-2.5 text-xs font-bold outline-none focus:ring-4 ring-blue-50 focus:border-blue-200 w-64 transition-all bg-white"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                <select
                  className="border border-slate-200 rounded-2xl pl-11 pr-10 py-2.5 text-xs font-bold outline-none focus:ring-4 ring-blue-50 focus:border-blue-200 transition-all appearance-none bg-white min-w-[200px] cursor-pointer"
                  value={clusterFilter ?? ''}
                  onChange={(e) => { setClusterFilter(e.target.value ? parseInt(e.target.value) : null); setPage(1); }}
                >
                  <option value="">Tất cả phân khúc</option>
                  {summaries.map((s: any) => <option key={s.cluster} value={s.cluster}>{s.segmentName}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Mã Khách Hàng</th>
                  <th className="px-8 py-5 text-center">Tên Phân Khúc</th>
                  <th className="px-8 py-5 text-right">Tổng Tìm Kiếm</th>
                  <th className="px-8 py-5 text-right">Số Từ Khóa</th>
                  <th className="px-8 py-5 text-right">Số Danh Mục</th>
                  <th className="px-8 py-5 text-right">TB / Tháng</th>
                  <th className="px-8 py-5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tableUsers.map((u: any) => (
                  <tr key={u.customerId} className="hover:bg-blue-50/30 transition-all duration-300 group">
                    <td className="px-8 py-5 font-mono font-bold text-slate-600 group-hover:text-blue-600 transition-colors">{u.customerId}</td>
                    <td className="px-8 py-5 text-center">
                      <span
                        className="px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase shadow-lg flex items-center justify-center gap-2 w-max mx-auto transition-transform group-hover:scale-105"
                        style={{ backgroundColor: summaries.find((s: any) => s.cluster === u.cluster)?.color, boxShadow: `0 4px 12px ${summaries.find((s: any) => s.cluster === u.cluster)?.color}44` }}
                      >
                        {getClusterIcon(u.cluster, 14, "text-white")}
                        <span className="text-white">{u.segmentName}</span>
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-800 tabular-nums">{formatNumber(u.totalSearch)}</td>
                    <td className="px-8 py-5 text-right text-slate-500 font-bold tabular-nums">{u.uniqueKeywords}</td>
                    <td className="px-8 py-5 text-right text-slate-500 font-bold tabular-nums">{u.totalCategories}</td>
                    <td className="px-8 py-5 text-right font-mono text-blue-600 font-black tabular-nums">{u.avgSearchMonth}</td>
                    <td className="px-8 py-5 text-center">
                      <button
                        onClick={() => fetchUserDetail(u.customerId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all font-bold text-[10px] uppercase tracking-wider"
                      >
                        <TrendingUp size={12} />
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-bold italic">
              Hiển thị <span className="text-slate-700 not-italic">{tableUsers.length}</span> trên <span className="text-slate-700 not-italic">{formatNumber(totalCount)}</span> khách hàng
            </p>
            <div className="flex items-center gap-6">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-3">
                Trang <span className="text-blue-600 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm">{page}</span> / {totalPages}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || tableLoading}
                  className="border border-slate-200 p-2 rounded-xl text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-50"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || tableLoading}
                  className="border border-slate-200 p-2 rounded-xl text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-50"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* MODAL USER 360 */}
      {showUserModal && userDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[80vh] overflow-hidden relative border border-slate-200"
          >
            <UserDetailPanel
              data={userDetail}
              allUsers={tableUsers}
              onUserSelect={(id) => fetchUserDetail(id)}
              onClose={() => setShowUserModal(false)}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
