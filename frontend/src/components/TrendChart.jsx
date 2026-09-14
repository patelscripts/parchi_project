import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const TrendChart = ({ data, series, threshold, thresholdSource }) => {
  // data: [{ date: '2023-01-01', creatinine: 1.1, bun: 15, acr: 30 }, ...]
  // series: [{ key: 'creatinine', color: '#5ea8a8', label: 'Creatinine' }, ...]
  // threshold: { value: 1.3, label: '1.3 mg/dL' }

  return (
    <div className="w-full h-64 relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            minTickGap={30}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'var(--font-mono)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ fontWeight: '500', color: '#64748b' }}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3, fill: s.color }}
              activeDot={{ r: 4 }}
              name={s.label}
            />
          ))}
          {threshold && (
            <ReferenceLine
              y={threshold.value}
              stroke="#cbd5e1"
              strokeDasharray="5 5"
              label={{
                position: 'right',
                value: threshold.label,
                fill: '#94a3b8',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {thresholdSource && (
        <div className="absolute -bottom-6 left-0 text-[11px] text-text-muted italic">
          Reference: {thresholdSource}
        </div>
      )}
    </div>
  );
};

export default TrendChart;
