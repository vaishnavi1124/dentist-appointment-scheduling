// frontend/src/components/MonthlyBreakdownChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend, // <-- NEW: Import Legend
} from 'recharts';

interface ChartProps {
  data: { month: string; bookings: number; cancellations: number }[];
}

export default function MonthlyBreakdownChart({ data }: ChartProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 h-96">
      <h3 className="text-lg font-semibold text-white mb-4">
        Monthly Breakdown — {currentYear}
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: -20, bottom: 40 }} 
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="month"
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={(str) => str.substring(0, 3)} // Format as 'Jan', 'Feb'
            angle={-45}
            textAnchor="end"
            interval={0} // Ensure all months are shown
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            allowDecimals={false} // No decimal points for bookings
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              borderColor: '#374151',
            }}
            labelStyle={{ color: '#f9fafb' }}
          />
          {/* Add a legend to distinguish the bars */}
          <Legend wrapperStyle={{ paddingTop: 25 }} /> 
          
          {/* Bar for Bookings */}
          <Bar 
            dataKey="bookings" 
            fill="#6366f1" // Indigo
            radius={[4, 4, 0, 0]} // Rounded top corners
          />
          
          {/* Bar for Cancellations */}
          <Bar 
            dataKey="cancellations" 
            fill="#f43f5e" // Rose
            radius={[4, 4, 0, 0]} // Rounded top corners
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}