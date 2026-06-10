"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Gavel,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  UserPlus,
  Scale,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Stats {
  totalUsers: number;
  totalUsersGrowth: number;
  activeAuctions: number;
  activeAuctionsGrowth: number;
  monthlyRevenue: number;
  monthlyRevenueGrowth: number;
  pendingDisputes: number;
  pendingDisputesGrowth: number;
}

interface ActivityItem {
  id: string;
  type: "USER_REGISTERED" | "BID_PLACED" | "DISPUTE_OPENED" | "PAYMENT_RECEIVED";
  title: string;
  description: string;
  time: string;
}

interface RevenueData {
  date: string;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState<"day" | "week" | "month">("day");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsRes, activityRes, revenueRes] = await Promise.all([
        adminApi.dashboard.getStats(),
        adminApi.dashboard.getActivity(),
        adminApi.dashboard.getRevenue(revenuePeriod),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (activityRes.success) setActivities(activityRes.data);
      if (revenueRes.success) setRevenueData(revenueRes.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Re-fetch revenue when period changes
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await adminApi.dashboard.getRevenue(revenuePeriod);
        if (res.success) setRevenueData(res.data);
      } catch (error) {
        console.error("Lỗi khi tải biểu đồ doanh thu:", error);
      }
    };
    fetchRevenue();
  }, [revenuePeriod]);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "USER_REGISTERED":
        return <UserPlus className="w-4 h-4" />;
      case "BID_PLACED":
        return <Gavel className="w-4 h-4" />;
      case "DISPUTE_OPENED":
        return <Scale className="w-4 h-4" />;
      case "PAYMENT_RECEIVED":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityIconWrapperStyle = (type: string) => {
    switch (type) {
      case "USER_REGISTERED":
        return "bg-pink-50 border-pink-100 text-pink-500";
      case "BID_PLACED":
        return "bg-teal-50 border-teal-100 text-teal-500";
      case "DISPUTE_OPENED":
        return "bg-sky-50 border-sky-100 text-sky-500";
      case "PAYMENT_RECEIVED":
        return "bg-orange-50 border-orange-100 text-orange-500";
      default:
        return "bg-slate-50 border-slate-100 text-slate-500";
    }
  };

  const getGrowthDirection = (val: number) => {
    if (val > 0) return "up";
    if (val < 0) return "down";
    return "neutral";
  };

  return (
    <div className="space-y-8">
      {/* Header section - Clean Vietnamese Font */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">TỔNG QUAN HỆ THỐNG</h2>
          <p className="text-sm text-slate-500 mt-1 font-sans">
            Thống kê hoạt động, doanh thu và xử lý giao dịch thời gian thực.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid with Vibrant Colors matching Image 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <AdminStatsCard
          label="Tổng người dùng"
          value={stats?.totalUsers || 0}
          trend={getGrowthDirection(stats?.totalUsersGrowth || 0)}
          trendValue={stats?.totalUsersGrowth}
          loading={loading}
          colorClass="text-pink-600"
        />
        <AdminStatsCard
          label="Đấu giá hoạt động"
          value={stats?.activeAuctions || 0}
          trend={getGrowthDirection(stats?.activeAuctionsGrowth || 0)}
          trendValue={stats?.activeAuctionsGrowth}
          loading={loading}
          colorClass="text-teal-600"
        />
        <AdminStatsCard
          label="Doanh thu tháng này"
          value={formatVND(stats?.monthlyRevenue || 0)}
          trend={getGrowthDirection(stats?.monthlyRevenueGrowth || 0)}
          trendValue={stats?.monthlyRevenueGrowth}
          loading={loading}
          colorClass="text-orange-600"
        />
        <AdminStatsCard
          label="Tranh chấp cần xử lý"
          value={stats?.pendingDisputes || 0}
          trend={getGrowthDirection(stats?.pendingDisputesGrowth || 0)}
          trendValue={stats?.pendingDisputesGrowth}
          loading={loading}
          colorClass="text-sky-600"
        />
      </div>

      {/* Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Revenue Line Chart with Summary Metrics below */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 p-6 flex flex-col justify-between h-[450px] shadow-sm rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800 tracking-wide uppercase font-sans">Biểu đồ doanh thu</h3>
              <p className="text-xs text-slate-400 mt-0.5">Phí nền tảng thu từ các giao dịch thành công.</p>
            </div>
            
            {/* Period Selector Buttons */}
            <div className="flex border border-slate-200 bg-slate-50 rounded-xl overflow-hidden">
              {(["day", "week", "month"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setRevenuePeriod(period)}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                    revenuePeriod === period
                      ? "bg-emerald-500 text-white"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {period === "day" ? "Ngày" : period === "week" ? "Tuần" : "Tháng"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full text-xs font-mono mb-4">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 animate-pulse">
                Đang tải dữ liệu biểu đồ...
              </div>
            ) : revenueData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                Không có dữ liệu doanh thu trong khoảng thời gian này
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    dx={-5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "8px",
                      color: "#1e293b",
                      fontFamily: "sans-serif",
                    }}
                    formatter={(val: any) => [formatVND(Number(val || 0)), "Doanh thu"]}
                    labelStyle={{ color: "#64748b" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
                    dot={{ r: 3, fill: "#0ea5e9", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bottom Summary Indicators matching Robust Template */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng người dùng</p>
              <p className="text-lg font-semibold text-slate-800 mt-0.5">{stats?.totalUsers || 0}</p>
              <div className="w-full h-1.5 bg-slate-100 mt-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đấu giá hoạt động</p>
              <p className="text-lg font-semibold text-slate-800 mt-0.5">{stats?.activeAuctions || 0}</p>
              <div className="w-full h-1.5 bg-slate-100 mt-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tranh chấp</p>
              <p className="text-lg font-semibold text-slate-800 mt-0.5">{stats?.pendingDisputes || 0}</p>
              <div className="w-full h-1.5 bg-slate-100 mt-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Doanh thu tháng</p>
              <p className="text-lg font-semibold text-slate-800 mt-0.5 truncate">{formatVND(stats?.monthlyRevenue || 0)}</p>
              <div className="w-full h-1.5 bg-slate-100 mt-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Layout: 1/3 Colored Cards stack & 2/3 Recent Activity Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Colored Progress Cards (1/3 Width) */}
        <div className="space-y-6 flex flex-col justify-between">
          {/* Card 1 - Orange User Growth */}
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white p-6 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-85">Người dùng mới</span>
                <Users className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mt-2">+{stats?.totalUsersGrowth || 0}%</p>
              <p className="text-xs opacity-75 mt-1">Lượt đăng ký mới gia tăng trong tháng này</p>
            </div>
            <div className="mt-6">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(10, (stats?.totalUsersGrowth || 0) + 30))}%` }} />
              </div>
            </div>
          </div>

          {/* Card 2 - Teal Auction Growth */}
          <div className="bg-gradient-to-br from-teal-400 to-emerald-600 text-white p-6 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-85">Phiên đấu giá</span>
                <Gavel className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mt-2">+{stats?.activeAuctionsGrowth || 0}%</p>
              <p className="text-xs opacity-75 mt-1">Số lượng phiên đấu giá mới hoạt động</p>
            </div>
            <div className="mt-6">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(10, (stats?.activeAuctionsGrowth || 0) + 35))}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Redesigned Recent Activity Table (2/3 Width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 shadow-sm rounded-2xl">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-slate-800 tracking-wide uppercase font-sans">Hoạt động gần đây</h3>
              <p className="text-xs text-slate-400 mt-0.5">Dòng sự kiện thời gian thực xảy ra trên hệ thống đấu giá.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 border border-slate-100 bg-slate-50 rounded-2xl" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 text-slate-400 text-sm font-sans rounded-2xl">
              Chưa ghi nhận hoạt động nào trên hệ thống
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-50">
                    <th className="py-3 px-4 font-bold">Sự kiện</th>
                    <th className="py-3 px-4 font-bold">Mô tả</th>
                    <th className="py-3 px-4 font-bold text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 border flex-shrink-0 rounded-md ${getActivityIconWrapperStyle(act.type)}`}>
                            {getActivityIcon(act.type)}
                          </div>
                          <span className="text-sm font-semibold text-slate-700 tracking-tight">{act.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-600 font-sans">{act.description}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400 text-right">
                        {new Date(act.time).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(act.time).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
