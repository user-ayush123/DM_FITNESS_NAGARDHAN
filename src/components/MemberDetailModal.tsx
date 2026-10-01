import React, { useState } from 'react';
import {
  X,
  Dumbbell,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Printer,
  Edit2,
  Trash2,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Member, MembershipPlan } from '../types';
import { getDaysRemaining, getPlanPrice } from '../services/memberService';

interface MemberDetailModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onUpdatePayment: (member: Member, newPaidAmount: number) => Promise<void>;
  onRenewPlan: (member: Member, planName: string, fee: number) => Promise<void>;
  plans: MembershipPlan[];
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  isOpen,
  member,
  onClose,
  onEdit,
  onDelete,
  onUpdatePayment,
  onRenewPlan,
  plans,
}) => {
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [showRenewOptions, setShowRenewOptions] = useState(false);
  const [selectedRenewPlanName, setSelectedRenewPlanName] = useState<string>(
    plans[0]?.name || '1 Month'
  );
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !member) return null;

  const { days, isExpired } = getDaysRemaining(member.expiryDate);
  const selectedPlanObj = plans.find((p) => p.name === selectedRenewPlanName) || plans[0];
  const renewalFee = selectedPlanObj ? selectedPlanObj.price : getPlanPrice(selectedRenewPlanName, plans);

  const handleCollectBalance = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    setIsProcessing(true);
    try {
      const newPaid = member.paidAmount + amount;
      await onUpdatePayment(member, newPaid);
      setShowPaymentInput(false);
      setPaymentAmount('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSettleFullBalance = async () => {
    setIsProcessing(true);
    try {
      await onUpdatePayment(member, member.totalFee);
      setShowPaymentInput(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenew = async () => {
    setIsProcessing(true);
    try {
      await onRenewPlan(member, selectedRenewPlanName, renewalFee);
      setShowRenewOptions(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#101217] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                Member Profile & Pass
              </h2>
              <p className="text-xs text-zinc-400">DM FITNESS Official Member Registry</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintCard}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Print Member Pass"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Pass</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* DM FITNESS VIP MEMBER PASS (Visual Card) */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-700/80 bg-gradient-to-br from-zinc-900 via-[#131720] to-black p-5 shadow-xl ring-1 ring-white/10 print:border-black print:bg-white print:text-black">
            {/* Background watermark */}
            <div className="absolute -right-8 -top-8 text-white/[0.03] select-none pointer-events-none">
              <Dumbbell className="h-48 w-48 stroke-1" />
            </div>

            <div className="relative z-10 flex flex-col justify-between gap-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-500 font-['Space_Grotesk'] text-xl font-bold text-black shadow-lg shadow-emerald-500/20">
                    {member.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                      DM FITNESS VIP PASS
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-xl font-bold text-white tracking-tight">
                      {member.fullName}
                    </h3>
                    <p className="text-xs text-zinc-400">ID: {member.id}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      member.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        member.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    {member.status.toUpperCase()}
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {isExpired ? `Expired ${days}d ago` : `${days} days remaining`}
                  </p>
                </div>
              </div>

              {/* Pass details bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-black/40 p-3.5 border border-zinc-800/80">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Plan</span>
                  <span className="text-xs font-semibold text-emerald-400">{member.membershipType}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Joined</span>
                  <span className="text-xs font-medium text-zinc-200">{member.joiningDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Valid Until</span>
                  <span className="text-xs font-medium text-zinc-200">{member.expiryDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Balance</span>
                  <span
                    className={`text-xs font-bold ${
                      member.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    ₹{member.balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Personal Information Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-400" /> Contact Details
              </h4>
              <div className="text-xs space-y-1.5 text-zinc-300">
                <div>
                  <span className="text-zinc-500">Phone: </span>
                  <span className="font-semibold text-white">{member.phone}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Email: </span>
                  <span>{member.email || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Address: </span>
                  <span className="text-zinc-300">{member.address}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Personal & Emergency
              </h4>
              <div className="text-xs space-y-1.5 text-zinc-300">
                <div>
                  <span className="text-zinc-500">Date of Birth: </span>
                  <span className="font-medium text-white">{member.dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Gender: </span>
                  <span className="font-medium text-white">{member.gender}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Emergency Contact: </span>
                  <span className="font-medium text-amber-300">
                    {member.emergencyContact || 'None listed'}
                  </span>
                </div>
                {member.notes && (
                  <div className="pt-1 border-t border-zinc-800/80">
                    <span className="text-zinc-500">Notes: </span>
                    <span className="italic text-zinc-400">{member.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Payment Settlement Drawer */}
          {member.balanceDue > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span className="text-xs font-semibold text-rose-300">
                    Unpaid Balance: ₹{member.balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSettleFullBalance}
                    disabled={isProcessing}
                    className="rounded-lg bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/30 transition-colors"
                  >
                    Clear Full ₹{member.balanceDue.toLocaleString('en-IN')}
                  </button>
                  <button
                    onClick={() => setShowPaymentInput(!showPaymentInput)}
                    className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    {showPaymentInput ? 'Cancel' : 'Partial Payment'}
                  </button>
                </div>
              </div>

              {showPaymentInput && (
                <div className="flex items-center gap-2 pt-2 border-t border-rose-500/20">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">₹</span>
                    <input
                      type="number"
                      max={member.balanceDue}
                      min="1"
                      placeholder={`Enter amount (max ₹${member.balanceDue})`}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-7 pr-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCollectBalance}
                    disabled={isProcessing || !paymentAmount}
                    className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    Record Payment
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Renew Plan Section with Dynamic Plans */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  Extend or Renew Membership
                </span>
              </div>
              <button
                onClick={() => setShowRenewOptions(!showRenewOptions)}
                className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                {showRenewOptions ? 'Close' : 'Renew Plan'}
              </button>
            </div>

            {showRenewOptions && (
              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <p className="text-[11px] text-zinc-400">
                  Select new duration. The new expiry date will extend from today or existing expiry date.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedRenewPlanName(p.name)}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                        selectedRenewPlanName.toLowerCase() === p.name.toLowerCase()
                          ? 'border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{p.name}</div>
                      <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                        ₹{p.price.toLocaleString('en-IN')}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleRenew}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-lime-500 px-4 py-1.5 text-xs font-bold text-black hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Confirm Renewal (₹{renewalFee.toLocaleString('en-IN')})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions: Edit & Delete */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              onClick={() => {
                onClose();
                onDelete(member);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Member</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(member);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
                <span>Edit Details</span>
              </button>
              <button
                onClick={onClose}
                className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
