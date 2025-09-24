"use client";
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface DonutChartProps {
  data: any[];
  title: string;
  dataKey: string;
  nameKey?: string;
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const CustomDonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  dataKey,
  nameKey = 'name',
  colors = DEFAULT_COLORS,
  height = 300
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{
                fontSize: '12px',
                color: '#6b7280'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};