
import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Member } from '../types';

const volumeData = [
  { name: 'Week 1', sent: 120 },
  { name: 'Week 2', sent: 250 },
  { name: 'Week 3', sent: 180 },
  { name: 'Week 4', sent: 390 },
];

const deliveryData = [
  { name: 'Delivered', value: 980, color: '#4ade80' }, // green-400
  { name: 'Failed', value: 20, color: '#f87171' },    // red-400
];

const personalizationData = [
  { name: 'Personalized', value: 65, color: '#818cf8' }, // indigo-400
  { name: 'Generic', value: 35, color: '#94a3b8' },     // slate-400
];

export const VolumeChart: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-80 transition-colors flex flex-col">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Message Volume (Last 30 Days)</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={volumeData}>
            <defs>
              <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#6366f1' }}
            />
            <Area type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const DeliveryChart: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-80 transition-colors flex flex-col">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Delivery Success Rate</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={deliveryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {deliveryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip 
               contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 dark:fill-white font-bold text-2xl">
              98%
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const PersonalizationChart: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-80 transition-colors flex flex-col">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Personalization Usage</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={personalizationData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} width={100} />
            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
              {personalizationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const BirthdayDistributionChart: React.FC<{ members: Member[], onBarClick?: (monthIndex: number) => void }> = ({ members, onBarClick }) => {
  const { chartData, totalCount } = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = new Array(12).fill(0);
    let total = 0;

    members.forEach(m => {
      if (m.birthday) {
        // Expected format YYYY-MM-DD
        const parts = m.birthday.split('-');
        if (parts.length === 3) {
           const monthIndex = parseInt(parts[1], 10) - 1;
           if (monthIndex >= 0 && monthIndex < 12) {
             counts[monthIndex]++;
             total++;
           }
        }
      }
    });

    // We store the raw index so we can pass it to the onClick handler easily
    const data = months.map((m, i) => ({ name: m, count: counts[i], index: i + 1 }));
    return { chartData: data, totalCount: total };
  }, [members]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-80 transition-colors flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Birthday Distribution</h3>
        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
          {totalCount} Members
        </span>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
             data={chartData} 
             margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
             onClick={(data) => {
                 if (data && data.activePayload && data.activePayload[0] && onBarClick) {
                     onBarClick(data.activePayload[0].payload.index);
                 }
             }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 12}} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 12}} 
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40} style={{ cursor: 'pointer' }}>
              {chartData.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill="#60a5fa" className="hover:opacity-80 transition-opacity" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
