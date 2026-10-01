import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, User, Phone, Mail, MapPin, AlertCircle, Sparkles, Check } from 'lucide-react';
import { Member, MembershipPlan, GenderType, MemberFormData } from '../types';
import { calculateExpiryDate, getPlanPrice } from '../services/memberService';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MemberFormData, existingId?: string) => Promise<void>;
  memberToEdit?: Member | null;
  plans: MembershipPlan[];
}

const GENDER_OPTIONS: GenderType[] = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  memberToEdit,
  plans,
}) => {
  const isEditing = Boolean(memberToEdit);

  const getInitialState = (): MemberFormData => {
    if (memberToEdit) {
      return {
        fullName: memberToEdit.fullName,
        email: memberToEdit.email || '',
        phone: memberToEdit.phone,
        address: memberToEdit.address,
        dateOfBirth: memberToEdit.dateOfBirth,
        gender: memberToEdit.gender,
        membershipType: memberToEdit.membershipType,
        totalFee: memberToEdit.totalFee,
        paidAmount: memberToEdit.paidAmount,
        balanceDue: memberToEdit.balanceDue,
        joiningDate: memberToEdit.joiningDate,
        expiryDate: memberToEdit.expiryDate,
        emergencyContact: memberToEdit.emergencyContact || '',
        notes: memberToEdit.notes || '',
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultPlan = plans[0]?.name || '1 Month';
    const defaultFee = plans[0]?.price || 1500;
    const defaultExpiry = calculateExpiryDate(todayStr, defaultPlan, plans);

    return {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '1998-01-01',
      gender: 'Male',
      membershipType: defaultPlan,
      totalFee: defaultFee,
      paidAmount: defaultFee,
      balanceDue: 0,
      joiningDate: todayStr,
      expiryDate: defaultExpiry,
      emergencyContact: '',
      notes: '',
    };
  };

  const [formData, setFormData] = useState<MemberFormData>(getInitialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());
      setErrors({});
    }
  }, [isOpen, memberToEdit, plans]);

  if (!isOpen) return null;

  // Handle plan change and automatically recalculate fee and expiry date
  const handlePlanChange = (plan: MembershipPlan) => {
    const fee = plan.price;
    const newExpiry = calculateExpiryDate(formData.joiningDate, plan, plans);
    const balance = Math.max(0, fee - formData.paidAmount);

    setFormData((prev) => ({
      ...prev,
      membershipType: plan.name,
      totalFee: fee,
      expiryDate: newExpiry || prev.expiryDate,
      balanceDue: balance,
    }));
  };

  // Handle joining date change and recalculate expiry
  const handleJoiningDateChange = (date: string) => {
    const newExpiry = calculateExpiryDate(date, formData.membershipType, plans);
    setFormData((prev) => ({
      ...prev,
      joiningDate: date,
      expiryDate: newExpiry || prev.expiryDate,
    }));
  };

  // Handle fee & paid amount changes
  const handleFeeChange = (fee: number) => {
    const validFee = isNaN(fee) ? 0 : Math.max(0, fee);
    setFormData((prev) => ({
      ...prev,
      totalFee: validFee,
      balanceDue: Math.max(0, validFee - prev.paidAmount),
    }));
  };

  const handlePaidChange = (paid: number) => {
    const validPaid = isNaN(paid) ? 0 : Math.max(0, paid);
    setFormData((prev) => ({
      ...prev,
      paidAmount: validPaid,
      balanceDue: Math.max(0, prev.totalFee - validPaid),
    }));
  };

  const handlePayInFull = () => {
    setFormData((prev) => ({
      ...prev,
      paidAmount: prev.totalFee,
      balanceDue: 0,
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required.';
    if (!formData.address.trim()) errs.address = 'Full address is required.';
    if (!formData.dateOfBirth) errs.dateOfBirth = 'Date of birth is required.';
    if (!formData.joiningDate) errs.joiningDate = 'Joining date is required.';
    if (!formData.expiryDate) errs.expiryDate = 'Expiry date is required.';

    if (formData.email && !formData.email.includes('@')) {
      errs.email = 'Please enter a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await onSave(formData, memberToEdit?.id);
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#101217] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h2 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                {isEditing ? 'Edit Member Details' : 'Register New Gym Member'}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isEditing
                ? `Updating membership profile for ${memberToEdit?.fullName}`
                : 'Enter athlete credentials and membership terms for DM FITNESS enrollment.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Personal & Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> 1. Personal & Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full rounded-xl border bg-zinc-950/70 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                    errors.fullName
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
                {errors.fullName && <p className="text-[11px] text-rose-400 mt-1">{errors.fullName}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full rounded-xl border bg-zinc-950/70 pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                      errors.phone
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Date of Birth <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Gender <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as GenderType })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Full Residential Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-zinc-500" />
                  <textarea
                    required
                    rows={2}
                    placeholder="Street, Building, Apartment, City, State, ZIP"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full rounded-xl border bg-zinc-950/70 pl-9 pr-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                      errors.address
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {errors.address && <p className="text-[11px] text-rose-400 mt-1">{errors.address}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Membership Plan & Dates */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> 2. Membership Plan & Schedule
              </h3>
              <span className="text-[11px] text-zinc-400">
                {plans.length} plan durations available
              </span>
            </div>

            {/* Dynamic Plan selection buttons */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">
                Choose Plan Duration <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {plans.map((plan) => {
                  const isSelected = formData.membershipType.toLowerCase() === plan.name.toLowerCase();
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanChange(plan)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500 shadow-md shadow-emerald-500/10'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-xs font-bold truncate max-w-full">{plan.name}</span>
                      <span className="text-sm font-semibold text-emerald-400 mt-0.5">₹{plan.price.toLocaleString('en-IN')}</span>
                      {plan.description && (
                        <span className="text-[9px] text-zinc-500 mt-0.5 truncate max-w-full">
                          {plan.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Joining Date */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Joining Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.joiningDate}
                  onChange={(e) => handleJoiningDateChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-300">
                    Expiry Date <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">Auto-calculated</span>
                </div>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financials & Payment Breakdown */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="text-sm font-bold">₹</span> 3. Payment & Dues
              </h3>
              <button
                type="button"
                onClick={handlePayInFull}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer"
              >
                Mark Paid in Full
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Total Fee */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Total Fee (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.totalFee}
                    onChange={(e) => handleFeeChange(parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-7 pr-3 py-1.5 text-sm font-semibold text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Paid Amount */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Payment Paid (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.paidAmount}
                    onChange={(e) => handlePaidChange(parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-7 pr-3 py-1.5 text-sm font-semibold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Balance Due (Auto-calculated) */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Balance Due (₹)
                </label>
                <div className="flex items-center h-[34px] px-3 rounded-lg bg-zinc-900 border border-zinc-800 font-['Space_Grotesk'] font-bold text-sm">
                  <span className={formData.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    ₹{formData.balanceDue.toLocaleString('en-IN')}
                  </span>
                  {formData.balanceDue === 0 && (
                    <span className="ml-auto text-[10px] text-emerald-500 font-medium">Cleared</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Emergency & Notes */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              4. Additional Details (Optional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Emergency Contact (Name & Phone)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe (+1 555-987-6543)"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Trainer / Health Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Knee injury history, morning trainer"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 px-6 py-2.5 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Check className="h-4 w-4 stroke-[3]" />
              <span>{submitting ? 'Saving...' : isEditing ? 'Update Member' : 'Enroll Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
