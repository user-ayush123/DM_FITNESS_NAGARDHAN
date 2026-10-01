import React from 'react';
import { Search, X, Filter, Download, Plus, RefreshCw, Printer } from 'lucide-react';
import { MembershipPlan } from '../types';

interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedPlan: string;
  onPlanChange: (plan: string) => void;
  selectedPayment: string;
  onPaymentChange: (payment: string) => void;
  selectedGender: string;
  onGenderChange: (gender: string) => void;
  onOpenAddModal: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  onResetFilters: () => void;
  totalFiltered: number;
  totalAll: number;
  plans: MembershipPlan[];
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedPlan,
  onPlanChange,
  selectedPayment,
  onPaymentChange,
  selectedGender,
  onGenderChange,
  onOpenAddModal,
  onExportCSV,
  onPrint,
  onResetFilters,
  totalFiltered,
  totalAll,
  plans,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedStatus !== 'all' ||
    selectedPlan !== 'all' ||
    selectedPayment !== 'all' ||
    selectedGender !== 'all';

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-md">
      {/* Top row: Search input & primary actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search member by name, phone, email, or address..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-9 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/80 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              title="Reset all filters"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
            title="Print member registry"
          >
            <Printer className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
            title="Export all members as CSV file"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filter Chips & Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/60 text-xs">
        {/* Status quick chips */}
        <div className="flex items-center gap-1 rounded-xl bg-zinc-950/60 p-1 border border-zinc-800/80">
          <button
            onClick={() => onStatusChange('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              selectedStatus === 'all'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({totalAll})
          </button>
          <button
            onClick={() => onStatusChange('active')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              selectedStatus === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Active
          </button>
          <button
            onClick={() => onStatusChange('expiring')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              selectedStatus === 'expiring'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Expiring Soon
          </button>
          <button
            onClick={() => onStatusChange('expired')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              selectedStatus === 'expired'
                ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Expired
          </button>
        </div>

        {/* Membership Plan Filter */}
        <select
          value={selectedPlan}
          onChange={(e) => onPlanChange(e.target.value)}
          aria-label="Filter by membership plan"
          className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All Plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name} (₹{p.price.toLocaleString('en-IN')})
            </option>
          ))}
        </select>

        {/* Payment Filter */}
        <select
          value={selectedPayment}
          onChange={(e) => onPaymentChange(e.target.value)}
          aria-label="Filter by payment status"
          className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All Payments</option>
          <option value="has_balance">Balance Due</option>
          <option value="paid">Fully Paid</option>
        </select>

        {/* Gender Filter */}
        <select
          value={selectedGender}
          onChange={(e) => onGenderChange(e.target.value)}
          aria-label="Filter by gender"
          className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        {/* Count indication */}
        <div className="ml-auto text-xs text-zinc-400">
          Showing <span className="font-semibold text-zinc-200">{totalFiltered}</span> of{' '}
          <span className="font-semibold text-zinc-200">{totalAll}</span> members
        </div>
      </div>
    </div>
  );
};
