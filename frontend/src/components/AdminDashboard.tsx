
// frontend/src/components/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatCard from './StatCard';
import BookingsChart from './BookingsChart';
import MonthlyBreakdownChart from './MonthlyBreakdownChart';

const API_URL = 'http://localhost:8000';

// --- Interfaces ---
interface Stats {
  todays_bookings: number;
  weekly_bookings: number;
  monthly_bookings: number;
  pending_jobs: number;
  revenue_today: number | null;
  revenue_month: number | null;
  avg_turnaround_hr: number | null;
  cancellations: number;
}

interface ChartData {
  date: string;
  bookings: number;
}

interface TodaysBooking {
  patient_name: string;
  dentist_name: string;
  date: string;
  time: string;
  end_time: string;
}

interface MonthlyBreakdownData {
  month: string;
  bookings: number;
  cancellations: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [todaysBookings, setTodaysBookings] = useState<TodaysBooking[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyBreakdownData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("No authorization token found. Please log in.");
      navigate('/login');
      return;
    }

    const apiClient = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` }
    });

    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, chartRes, todaysBookingsRes, monthlyRes] = await Promise.all([
          apiClient.get(`/admin/stats`),
          apiClient.get(`/admin/chart-data`),
          apiClient.get(`/admin/todays-bookings`),
          apiClient.get(`/admin/monthly-breakdown`),
        ]);

        setStats(statsRes.data);
        setChartData(chartRes.data.data);
        setTodaysBookings(todaysBookingsRes.data.data);
        setMonthlyData(monthlyRes.data.data);

      } catch (err) {
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError;
          if (axiosError.response?.status === 401) {
            setError("Your session has expired. Please log in again.");
            logout();
            navigate('/login');
          } else {
            setError("Failed to fetch data. Try again.");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, logout, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1E2E] text-white">
        Loading Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1E2E] text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1E2E] via-[#2A3048] to-[#1A1E2E] text-white px-6 py-6">
      
      {/* ✅ Top Header */}
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <a href="/" className="text-blue-300 hover:text-pink-400 transition text-lg font-medium">
          ← Back to Home
        </a>

        <h1 className="text-3xl font-bold text-center flex-1">
          Admin Dashboard
        </h1>

        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white font-medium transition"
        >
          Logout
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Today's Bookings" value={stats?.todays_bookings ?? 0} icon="🗓️" />
        <StatCard title="Weekly Bookings" value={stats?.weekly_bookings ?? 0} icon="📅" />
        <StatCard title="Monthly Bookings" value={stats?.monthly_bookings ?? 0} icon="📊" />
        <StatCard title="Cancellations" value={stats?.cancellations ?? 0} icon="❌" />
      </div>

      {/* Today's Bookings Table */}
      <div className="bg-[#2A3048]/50 p-6 rounded-lg mb-10 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Today's Bookings</h3>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-gray-600 sticky top-0 bg-[#2A3048]/90">
              <tr>
                <th className="py-2 px-4">Patient</th>
                <th className="py-2 px-4">Dentist</th>
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Start</th>
                <th className="py-2 px-4">End</th>
              </tr>
            </thead>
            <tbody>
              {todaysBookings.length ? todaysBookings.map((b, i) => (
                <tr key={i} className="border-b border-gray-700 hover:bg-gray-700/30">
                  <td className="py-3 px-4">{b.patient_name}</td>
                  <td className="py-3 px-4">{b.dentist_name}</td>
                  <td className="py-3 px-4">{b.date}</td>
                  <td className="py-3 px-4">{b.time}</td>
                  <td className="py-3 px-4">{b.end_time}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="py-4 text-center text-gray-400">No bookings today.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BookingsChart data={chartData} />
        <MonthlyBreakdownChart data={monthlyData} />
      </div>

    </div>
  );
}

