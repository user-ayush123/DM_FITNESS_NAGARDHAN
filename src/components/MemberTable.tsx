import React, { useState } from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Member } from '../types';
import { getDaysRemaining } from '../services/memberService';

interface MemberTableProps {
  members: Member[];
  onViewDetails: (member: Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

type SortField = 'fullName' | 'joiningDate' | 'expiryDate' | 'paidAmount' | 'balanceDue' | 'status';
type SortOrder = 'asc' | 'desc';

export const MemberTable: React.FC<MemberTableProps> = ({
  members,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const [sortField, setSortField] = useState<SortField>('expiryDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 inline ml-1 text-emerald-400" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 inline ml-1 text-emerald-400" />
    );
  };

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-12 text-center backdrop-blur-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400 mb-4">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white mb-1">
          No Members Found
        </h3>
        <p className="max-w-sm text-xs text-zinc-400">
          No athletes match your current search queries or filter settings. Try adjusting your
          criteria or register a new member.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <th
                  onClick={() => handleSort('fullName')}
                  className="py-3.5 pl-6 pr-3 cursor-pointer hover:text-white transition-colors"
                >
                  Member {getSortIcon('fullName')}
                </th>
                <th className="py-3.5 px-3">Contact & Address</th>
                <th
                  onClick={() => handleSort('expiryDate')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  Plan & Expiry {getSortIcon('expiryDate')}
                </th>
                <th
                  onClick={() => handleSort('paidAmount')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  Payments {getSortIcon('paidAmount')}
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  Status {getSortIcon('status')}
                </th>
                <th className="py-3.5 pr-6 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {sortedMembers.map((member) => {
                const { days, isExpired } = getDaysRemaining(member.expiryDate);
                const hasBalance = member.balanceDue > 0;

                return (
                  <tr
                    key={member.id}
                    className="group hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* Member Profile */}
                    <td className="py-4 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-lime-500/20 font-['Space_Grotesk'] text-sm font-bold text-emerald-400 border border-emerald-500/30">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                            {member.fullName}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <span>{member.gender}</span>
                            <span>•</span>
                            <span>DOB: {member.dateOfBirth}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Address */}
                    <td className="py-4 px-3 max-w-[200px]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                          <Phone className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{member.phone}</span>
                        </div>
                        {member.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                            <Mail className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <MapPin className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                          <span className="truncate" title={member.address}>
                            {member.address}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Plan & Validity */}
                    <td className="py-4 px-3">
                      <div className="space-y-1">
                        <span className="inline-block rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-zinc-700">
                          {member.membershipType}
                        </span>
                        <div className="text-[11px] text-zinc-400">
                          <span>Joined: {member.joiningDate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-zinc-500">Expires:</span>
                          <span className={isExpired ? 'text-rose-400 font-semibold' : 'text-zinc-200 font-medium'}>
                            {member.expiryDate}
                          </span>
                          <span className={`text-[10px] ml-1 ${isExpired ? 'text-rose-400' : days <= 7 ? 'text-amber-400 font-medium' : 'text-zinc-500'}`}>
                            ({isExpired ? `${days}d ago` : `${days}d left`})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Payments */}
                    <td className="py-4 px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-semibold">
                            ₹{member.paidAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-zinc-500">/ ₹{member.totalFee.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          {hasBalance ? (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
                              Due: ₹{member.balanceDue.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                              <CheckCircle className="h-3 w-3" /> Paid in full
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-3">
                      {member.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-400 border border-rose-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                          Expired
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 pr-6 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewDetails(member)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="View VIP Pass & Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEdit(member)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                          title="Edit Member"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(member)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {sortedMembers.map((member) => {
          const { days, isExpired } = getDaysRemaining(member.expiryDate);
          const hasBalance = member.balanceDue > 0;

          return (
            <div
              key={member.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3.5 backdrop-blur-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 font-['Space_Grotesk'] text-base font-bold text-emerald-400 border border-emerald-500/20">
                    {member.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{member.fullName}</h4>
                    <p className="text-[11px] text-zinc-400">
                      {member.gender} • {member.phone}
                    </p>
                  </div>
                </div>

                {member.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    Expired
                  </span>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2 text-xs rounded-xl bg-zinc-950/60 p-3 border border-zinc-800/80">
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 block">Plan</span>
                  <span className="font-medium text-emerald-400">{member.membershipType}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 block">Expiry Date</span>
                  <span className={isExpired ? 'text-rose-400 font-semibold' : 'text-zinc-200'}>
                    {member.expiryDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 block">Paid Amount</span>
                  <span className="font-semibold text-white">₹{member.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 block">Balance Due</span>
                  <span className={hasBalance ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    ₹{member.balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                <span className="truncate">{member.address}</span>
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <button
                  onClick={() => onViewDetails(member)}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <Eye className="h-3.5 w-3.5" /> View Pass
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(member)}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(member)}
                    className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
