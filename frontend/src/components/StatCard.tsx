import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string; // We'll use emoji for simplicity, just like the image
}

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-5 border border-slate-700">
      <div className="flex-shrink-0 text-3xl bg-slate-900 p-3 rounded-lg">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </div>
        <div className="text-3xl font-bold text-white">
          {value}
        </div>
      </div>
    </div>
  );
}