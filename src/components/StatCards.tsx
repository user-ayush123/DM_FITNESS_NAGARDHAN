import React from 'react';
import { Users, UserCheck, AlertCircle, WalletCards, TrendingUp } from 'lucide-react';
import { DashboardStats } from '../types';

interface StatCardsProps {
  stats: DashboardStats;
  onFilterStatus?: (status: string) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, onFilterStatus }) => {
  const activePercent = stats.totalMembers > 0
    ? Math.round((stats.activeMembers / stats.totalMembers) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
      {/* 1. Total Members */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('all')}
        className="group relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-4 backdrop-blur-md transition-all hover:border-zinc-700 hover:bg-zinc-900/90 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Total Members
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
            <Users className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-['Space_Grotesk'] text-2xl font-bold text-white tracking-tight">
            {stats.totalMembers}
          </span>
          <span className="text-[11px] font-medium text-zinc-500">enrolled</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          <span>Lifetime registry</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0" />
      </div>

      {/* 2. Active Members */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('active')}
        className="group relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-4 backdrop-blur-md transition-all hover:border-emerald-500/40 hover:bg-zinc-900/90 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Active Members
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <UserCheck className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-['Space_Grotesk'] text-2xl font-bold text-emerald-400 tracking-tight">
            {stats.activeMembers}
          </span>
          <span className="text-[11px] font-medium text-emerald-500/80">
            ({activePercent}% active)
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-500"
            style={{ width: `${activePercent}%` }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />
      </div>

      {/* 3. Expiring & Expired */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('expiring')}
        className="group relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-4 backdrop-blur-md transition-all hover:border-amber-500/40 hover:bg-zinc-900/90 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Expiring Soon
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-['Space_Grotesk'] text-2xl font-bold text-amber-400 tracking-tight">
            {stats.expiringSoon}
          </span>
          <span className="text-[11px] font-medium text-zinc-500">within 7 days</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="text-rose-400 font-medium">{stats.expiredMembers} expired</span>
          <span className="text-amber-400/90 font-medium">Needs renewal</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" />
      </div>

      {/* 4. Total Revenue Collected (₹) */}
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-4 backdrop-blur-md transition-all hover:border-emerald-500/30 hover:bg-zinc-900/90">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Total Revenue
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-500/10 font-bold text-lime-400 border border-lime-500/20 group-hover:scale-110 transition-transform text-sm">
            ₹
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-['Space_Grotesk'] text-2xl font-bold text-white tracking-tight">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] font-medium text-zinc-500">collected</span>
        </div>
        <div className="mt-2 text-[11px] text-zinc-400">
          Payment received to date
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-lime-500/0 via-lime-500/50 to-lime-500/0" />
      </div>

      {/* 5. Pending Balance Due (₹) */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('has_balance')}
        className="group relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-4 backdrop-blur-md transition-all hover:border-rose-500/40 hover:bg-zinc-900/90 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Balance Due
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
            <WalletCards className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className={`font-['Space_Grotesk'] text-2xl font-bold tracking-tight ${stats.totalBalanceDue > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
            ₹{stats.totalBalanceDue.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] font-medium text-zinc-500">outstanding</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="text-zinc-400">Unsettled fees</span>
          {stats.totalBalanceDue > 0 && (
            <span className="text-rose-400 font-medium">Pending collection</span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0" />
      </div>
    </div>
  );
};
