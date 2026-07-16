'use client'
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const SAMPLE = [
  { day: 'Mon', calories: 1850 }, { day: 'Tue', calories: 2100 },
  { day: 'Wed', calories: 1700 }, { day: 'Thu', calories: 2250 },
  { day: 'Fri', calories: 1950 }, { day: 'Sat', calories: 2400 },
  { day: 'Sun', calories: 2050 },
]

export function WeeklyChart({ data }: { data: { day: string; calories: number }[] }) {
  const total = data.reduce((s, d) => s + d.calories, 0)
  const empty = total === 0
  const chartData = empty ? SAMPLE : data

  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={196}>
        <AreaChart data={chartData} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8722B" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#E8722B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: '#777', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#777', fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
          <Tooltip
            cursor={{ stroke: 'rgba(212,96,26,0.4)', strokeWidth: 1 }}
            contentStyle={{
              background: '#161210', border: '1px solid rgba(212,96,26,0.3)',
              borderRadius: 12, fontSize: 12, color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
            labelStyle={{ color: '#E8722B', fontWeight: 700, marginBottom: 2 }}
            formatter={(v) => [`${Number(v).toLocaleString()} kcal`, 'Calories']}
          />
          <Area
            type="monotone" dataKey="calories" stroke="#E8722B" strokeWidth={2.5}
            fill="url(#calGrad)" style={{ opacity: empty ? 0.3 : 1 }}
            animationDuration={1100}
          />
        </AreaChart>
      </ResponsiveContainer>
      {empty && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
            background: 'rgba(20,16,13,0.78)', padding: '7px 14px', borderRadius: 99,
            border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
          }}>
            Log meals to see your real trend
          </span>
        </div>
      )}
    </div>
  )
}
