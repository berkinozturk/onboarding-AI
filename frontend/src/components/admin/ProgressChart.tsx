import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ProgressData {
  name: string;
  completionRate: number;
  badges: number;
  badgePercentage: number;
  xp: number;
}

interface Props {
  data: ProgressData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded shadow-lg border">
        <p className="font-semibold">{label}</p>
        <p className="text-blue-600">Completion Rate: {payload[0].value}%</p>
        <p className="text-green-600">Badges: {payload[1].payload.badges}/{payload[1].payload.totalBadges}</p>
        <p className="text-purple-600">XP Points: {payload[2].value}</p>
      </div>
    );
  }
  return null;
};

export default function ProgressChart({ data }: Props) {
  // Get total badges from the first data point's badgePercentage calculation
  const totalBadges = data.length > 0 ? Math.round((data[0].badges / (data[0].badgePercentage / 100))) : 0;
  
  // Add totalBadges to each data point for tooltip display
  const enhancedData = data.map(item => ({
    ...item,
    totalBadges
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={enhancedData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis 
          yAxisId="left" 
          orientation="left" 
          stroke="#8884d8"
          domain={[0, 100]}
          label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          stroke="#ffc658"
          domain={[0, Math.max(...data.map(item => item.xp), 100)]}
          label={{ value: 'XP Points', angle: 90, position: 'insideRight' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          yAxisId="left" 
          dataKey="completionRate" 
          name="Completion Rate (%)" 
          fill="#8884d8" 
          barSize={40}
        />
        <Bar 
          yAxisId="left" 
          dataKey="badgePercentage" 
          name={`Badges (/${totalBadges})`} 
          fill="#82ca9d" 
          barSize={40}
        />
        <Bar 
          yAxisId="right" 
          dataKey="xp" 
          name="XP Points" 
          fill="#ffc658" 
          barSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}