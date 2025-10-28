// frontend/src/components/BookingsChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface ChartProps {
  data: { date: string; bookings: number }[];
}

export default function BookingsChart({ data }: ChartProps) {
 const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long' });
  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 h-96">
      <h3 className="text-lg font-semibold text-white mb-4">
        Bookings — {currentMonthName}
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: -20, bottom: 40 }} // Adjusted margins
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={(str) => str.substring(5)} // Format date as 'MM-DD'
            angle={-45}       // Angle the labels
            textAnchor="end" // Anchor them to the end
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
          <Line
            type="monotone"
            dataKey="bookings"
            stroke="#6366f1" // Indigo color
            strokeWidth={2}
            dot={{ r: 4, fill: '#818cf8' }}
            activeDot={{ r: 8, stroke: '#4f46e5' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


