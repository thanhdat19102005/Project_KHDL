/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import {
  useKpi, useSearchDistribution, useMonthlyTrend, useTopKeywords,
  useTopCategories, usePlatformDistribution, useClusterSummaries,
  useSegmentScatter, useSegmentInsights,
} from '@/hooks/useDashboard';
import { formatNumber, formatCompact } from '@/utils/format';

// Container = 1280px, padding = 32px each side → content = 1216px
// 2-col (gap 16): each = (1216-16)/2 = 600 – 40pad = 560
// 3-col (gap 16): each = (1216-32)/3 = 395 – 40pad = 355
// 2fr+1fr (gap 16): 2fr = 800-48=752, 1fr = 384-48=336
const W2 = 560;  // 2-column chart width
const W3 = 355;  // 3-column chart width
const WS = 752;  // scatter (2fr)
const WP = 336;  // pie (1fr)
const H1 = 260;  // row-1 chart height
const H2 = 360;  // row-2 chart height
const HS = 350;  // scatter/pie height

const PLATFORM_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f43f5e','#ec4899','#84cc16','#a855f7'];
const CATEGORY_COLORS = ['#6366f1','#0ea5e9','#14b8a6','#22c55e','#eab308','#f97316','#ef4444','#d946ef','#8b5cf6','#64748b'];
const CAT_MAP: Record<string, string> = {
  Drama:'Chính kịch','K-Drama':'Phim Hàn','C-Drama':'Phim Trung',
  Anime:'Anime Nhật',Action:'Hành động',Animation:'Hoạt hình',
  Show:'TV Show',TV:'TV Show',Horror:'Kinh dị',Fantasy:'Kỳ ảo',
  Music:'Âm nhạc',Sport:'Thể thao',Crime:'Tội phạm',System:'Hệ thống',
  Documentary:'Tài liệu',Other:'Khác',
};

const card = (label: string, value: string, color: string) => (
  <div key={label} style={{ background:'#fff', borderRadius:16, padding:'20px 16px', border:'1px solid #e2e8f0' }}>
    <p style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:1, margin:'0 0 8px' }}>{label}</p>
    <p style={{ fontSize:28, fontWeight:900, color, margin:0 }}>{value}</p>
  </div>
);

export default function CombinedPdfCapture() {
  const { data: kpi }            = useKpi();
  const searchTrend              = useSearchDistribution() ?? [];
  const monthlyRaw               = useMonthlyTrend() ?? [];
  const hourData                 = [...monthlyRaw].sort((a:any,b:any)=>a.search_hour-b.search_hour);
  const keywords                 = (useTopKeywords() ?? []).slice(0,10);
  const { data: categoryDataRaw }= useTopCategories();
  const categoryData             = categoryDataRaw ?? [];
  const { data: platformDataRaw }= usePlatformDistribution();
  const { data: summaries }      = useClusterSummaries();
  const { data: scatter }        = useSegmentScatter();
  const insights                 = useSegmentInsights();

  const processedPlatform = useMemo(() => {
    if (!platformDataRaw?.length) return [];
    const sorted = [...platformDataRaw].sort((a:any,b:any)=>b.total_search-a.total_search);
    const top10  = sorted.slice(0,10).map((item:any)=>({
      ...item,
      platform: item.platform.split('-').map((w:string)=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '),
    }));
    if (sorted.length<=10) return top10;
    return [...top10, { platform:'Khác', total_search: sorted.slice(10).reduce((s:number,i:any)=>s+i.total_search,0) }];
  },[platformDataRaw]);

  const scatterData = useMemo(()=>
    scatter.map((p:any)=>({...p, fill:summaries.find((s:any)=>s.cluster===p.cluster)?.color||'#9ca3af'}))
  ,[scatter,summaries]);

  const fmtKw = (t:string) => { const c=t.split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '); return c.length>18?c.slice(0,18)+'…':c; };

  const sectionBanner = (text: string) => (
    <div style={{ marginBottom:20, padding:'10px 16px', background:'#4f46e5', borderRadius:12 }}>
      <p style={{ color:'#fff', fontWeight:900, fontSize:13, margin:0, letterSpacing:2 }}>{text}</p>
    </div>
  );

  return (
    <div
      id="combined-pdf-capture"
      aria-hidden="true"
      style={{ position:'absolute', left:'-9999px', top:0, width:'1280px', backgroundColor:'#f8fafc', padding:'32px', pointerEvents:'none', zIndex:-1 }}
    >
      {/* ═══════════════ OVERVIEW ═══════════════ */}
      <div id="overview-pdf-area" style={{ marginBottom:48 }}>
        {sectionBanner('PHẦN 1 – TỔNG QUAN HỆ THỐNG')}

        {/* KPI cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
          {card('Tổng người dùng',    kpi?formatCompact(kpi.totalUsers):'…',          '#3b82f6')}
          {card('Tổng lượt tìm kiếm', kpi?formatCompact(kpi.totalSearch):'…',         '#10b981')}
          {card('Người dùng hoạt động (MAC)', kpi?.monthlyActiveCustomers?formatCompact(kpi.monthlyActiveCustomers.active_customers):'…', '#f59e0b')}
          {card('TB tìm kiếm / người', kpi?formatCompact(Math.round(kpi.avgSearchPerUser)):'…', '#8b5cf6')}
        </div>

        {/* Row 1: trend + hourly — fixed pixel width, no ResponsiveContainer */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:20, border:'1px solid #e2e8f0' }}>
            <p style={{ fontWeight:700, fontSize:13, color:'#1e293b', margin:'0 0 12px' }}>Xu hướng tìm kiếm theo tháng</p>
            <AreaChart width={W2} height={H1} data={searchTrend.filter((d:any)=>d.total_search>1000)}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#c7d2fe" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)"/>
              <XAxis dataKey="search_month" fontSize={10}/>
              <YAxis fontSize={10}/>
              <Tooltip formatter={(v:any)=>[formatNumber(Number(v)),'Lượt']}/>
              <Area type="monotone" dataKey="total_search" stroke="#6366f1" strokeWidth={2} fill="url(#g1)"/>
            </AreaChart>
          </div>
          <div style={{ background:'#fff', borderRadius:16, padding:20, border:'1px solid #e2e8f0' }}>
            <p style={{ fontWeight:700, fontSize:13, color:'#1e293b', margin:'0 0 12px' }}>Phân bổ tìm kiếm theo giờ</p>
            <AreaChart width={W2} height={H1} data={hourData}>
              <defs>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#bae6fd" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)"/>
              <XAxis dataKey="search_hour" tickFormatter={(h:any)=>`${h}h`} fontSize={10}/>
              <YAxis fontSize={10}/>
              <Tooltip formatter={(v:any)=>[formatNumber(Number(v)),'Lượt']}/>
              <Area type="monotone" dataKey="total_search" stroke="#0ea5e9" strokeWidth={2} fill="url(#g2)"/>
            </AreaChart>
          </div>
        </div>

        {/* Row 2: keywords + platform + categories */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:20, border:'1px solid #e2e8f0' }}>
            <p style={{ fontWeight:700, fontSize:13, color:'#1e293b', margin:'0 0 12px' }}>Top 10 Từ khóa tìm kiếm</p>
            <BarChart width={W3} height={H2} data={keywords.map((k:any)=>({...k,fk:fmtKw(k.keyword)}))} layout="vertical" margin={{left:8,right:24}}>
              <XAxis type="number" hide/>
              <YAxis dataKey="fk" type="category" width={140} axisLine={false} tickLine={false} tick={{fill:'#1f2937',fontWeight:700,fontSize:11}}/>
              <Tooltip formatter={(v:any)=>[formatNumber(Number(v)),'Lượt']}/>
              <Bar dataKey="searchCount" fill="#4f46e5" radius={[0,4,4,0]} barSize={16}/>
            </BarChart>
          </div>
          <div style={{ background:'#fff', borderRadius:16, padding:20, border:'1px solid #e2e8f0' }}>
            <p style={{ fontWeight:700, fontSize:13, color:'#1e293b', margin:'0 0 12px' }}>Phân bổ Nền tảng (Platform)</p>
            <PieChart width={W3} height={H2}>
              <Pie data={processedPlatform} cx="50%" cy="42%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="total_search" nameKey="platform" stroke="none">
                {processedPlatform.map((_:any,i:number)=><Cell key={i} fill={PLATFORM_COLORS[i%PLATFORM_COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={(v:any,n:any)=>[`${formatNumber(Number(v))} lượt`,n]}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:9}}/>
            </PieChart>
          </div>
          <div style={{ background:'#fff', borderRadius:16, padding:20, border:'1px solid #e2e8f0' }}>
            <p style={{ fontWeight:700, fontSize:13, color:'#1e293b', margin:'0 0 12px' }}>Top 10 Thể loại phim & Nội dung</p>
            <BarChart width={W3} height={H2} data={categoryData} layout="vertical" margin={{left:8,right:24}}>
              <XAxis type="number" hide/>
              <YAxis dataKey="category_name" type="category" width={120} axisLine={false} tickLine={false} tick={{fill:'#1f2937',fontWeight:700,fontSize:11}} tickFormatter={(v:string)=>CAT_MAP[v]||v}/>
              <Tooltip formatter={(v:any)=>[formatNumber(Number(v)),'Lượt']}/>
              <Bar dataKey="total_search" radius={[0,4,4,0]} barSize={18}>
                {categoryData.map((_:any,i:number)=><Cell key={i} fill={CATEGORY_COLORS[i%CATEGORY_COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </div>
        </div>
      </div>

      {/* ═══════════════ SEGMENTATION ═══════════════ */}
      <div id="segment-pdf-area">
        {sectionBanner('PHẦN 2 – PHÂN KHÚC KHÁCH HÀNG')}

        {/* Cluster cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
          {summaries.map((s:any)=>(
            <div key={s.cluster} style={{ background:'#fff', borderRadius:16, padding:20, border:'1px solid #e2e8f0' }}>
              <p style={{ fontSize:11, fontWeight:900, color:s.color, textTransform:'uppercase', margin:'0 0 12px', letterSpacing:1 }}>{s.segmentName}</p>
              <p style={{ fontSize:26, fontWeight:900, color:'#1e293b', margin:'0 0 12px' }}>{formatNumber(s.totalUsers)}</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[['TB Tìm kiếm',s.avgTotalSearch],['TB Từ khóa',s.avgUniqueKeywords],['TB Danh mục',s.avgCategories],['Lượt / Tháng',s.avgSearchPerMonth]].map(([l,v])=>(
                  <div key={l as string}>
                    <p style={{ fontSize:9, color:'#94a3b8', fontWeight:700, margin:'0 0 2px', textTransform:'uppercase' }}>{l}</p>
                    <p style={{ fontSize:13, fontWeight:700, color:'#475569', margin:0 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Scatter + Pie */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:24 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #e2e8f0' }}>
            <p style={{ fontWeight:700, fontSize:13, color:'#1e293b', margin:'0 0 12px' }}>Ma trận Hoạt động & Đa dạng</p>
            <ScatterChart width={WS} height={HS} margin={{top:10,right:30,bottom:20,left:10}}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
              <XAxis type="number" dataKey="x" name="Tổng TK" fontSize={10} label={{value:'Tổng Tìm Kiếm',position:'insideBottom',offset:-10,fontSize:10,fill:'#94a3b8'}}/>
              <YAxis type="number" dataKey="y" name="Từ Khóa" fontSize={10} label={{value:'Từ Khóa Duy Nhất',angle:-90,position:'insideLeft',fontSize:10,fill:'#94a3b8'}}/>
              <ZAxis range={[60,60]}/>
              <Tooltip/>
              <Scatter name="Khách hàng" data={scatterData}>
                {scatterData.map((e:any,i:number)=><Cell key={i} fill={e.fill} opacity={0.65}/>)}
              </Scatter>
            </ScatterChart>
          </div>
          <div style={{ background:'#fff', borderRadius:16, padding:24, border:'1px solid #e2e8f0' }}>
            <p style={{ fontWeight:700, fontSize:13, color:'#1e293b', margin:'0 0 12px' }}>Tỉ lệ Phân khúc</p>
            <PieChart width={WP} height={HS}>
              <Pie data={summaries} dataKey="totalUsers" nameKey="segmentName" innerRadius={70} outerRadius={110} paddingAngle={6} stroke="none">
                {summaries.map((s:any,i:number)=><Cell key={i} fill={s.color}/>)}
              </Pie>
              <Tooltip/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:10,textTransform:'uppercase',fontWeight:700}}/>
            </PieChart>
          </div>
        </div>

        {/* Insight cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {insights.map((ins:any)=>(
            <div key={ins.cluster} style={{ background:'#fff', borderRadius:16, padding:20, border:`2px solid ${ins.color}22` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', backgroundColor:ins.color, flexShrink:0 }}/>
                <p style={{ fontSize:11, fontWeight:900, color:'#1e293b', margin:0, textTransform:'uppercase' }}>{ins.segmentName}</p>
              </div>
              <p style={{ fontSize:10, color:ins.color, fontWeight:700, margin:'0 0 6px', textTransform:'uppercase' }}>{ins.title}</p>
              <p style={{ fontSize:11, color:'#64748b', margin:0, lineHeight:1.5 }}>{ins.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
