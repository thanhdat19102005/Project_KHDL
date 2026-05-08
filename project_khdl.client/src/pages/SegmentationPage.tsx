import { useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useSegments, useSegmentScatter, useSegmentInsights } from '@/hooks/useDashboard';
import type { ScatterPoint } from '@/types';
import { formatNumber } from '@/utils/format';

const clusterColors = ['#10b981', '#f59e0b', '#9ca3af'];

export default function SegmentationPage() {
  const segments = useSegments();
  const { data: scatter, loading: scatterLoading } = useSegmentScatter();
  const insights = useSegmentInsights();

  const scatterData = useMemo(() => {
    return scatter.map((p: ScatterPoint) => ({
      ...p,
      x: p.totalSearch,
      y: p.activeMonths,
      fill: clusterColors[p.cluster] ?? clusterColors[2]
    }));
  }, [scatter]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {segments.map((s) => (
          <div
            key={s.cluster}
            className="bg-white rounded-lg border border-gray-200 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: clusterColors[s.cluster] }}
              />
              <h3 className="text-sm font-semibold text-gray-800">{s.name}</h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Tổng người dùng</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(s.totalUsers)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tổng lượt tìm kiếm</p>
                <p className="text-sm font-semibold text-gray-800">{formatNumber(s.totalSearch)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Phân bố phân khúc (Scatter Plot)</h3>
        <div className="h-96">
          {scatterLoading ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Đang tải dữ liệu...</div>
          ) : scatterData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Không có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Tổng lượt tìm kiếm"
                  label={{ value: 'Tổng lượt tìm kiếm', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Số tháng hoạt động"
                  label={{ value: 'Số tháng hoạt động', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value) => {
                    return [formatNumber(Number(value)), ''];
                  }}
                  labelFormatter={(_, payload) => {
                    if (payload && payload[0]) {
                      const p = payload[0].payload as ScatterPoint & { fill: string };
                      return `ID: ${p.customerId}`;
                    }
                    return '';
                  }}
                />
                <Scatter data={scatterData} shape="circle">
                  {scatterData.map((_entry: ScatterPoint & { fill: string }, index: number) => (
                    <Cell key={`cell-${index}`} fill={_entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((ins) => (
          <div
            key={ins.cluster}
            className="bg-white rounded-lg border border-gray-200 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: clusterColors[ins.cluster] }}
              />
              <h3 className="text-sm font-semibold text-gray-800">{ins.title}</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{ins.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
