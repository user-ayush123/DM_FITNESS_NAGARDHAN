import React, { useState } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  Calendar,
  Clock,
  Info
} from 'lucide-react';
import { MembershipPlan } from '../types';
import { DEFAULT_MEMBERSHIP_PLANS } from '../services/memberService';

interface SettingsViewProps {
  plans: MembershipPlan[];
  onUpdatePlans: (plans: MembershipPlan[]) => Promise<void>;
  onClose?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  plans,
  onUpdatePlans,
  onClose,
}) => {
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editName, setEditName] = useState<string>('');
  const [editMonths, setEditMonths] = useState<number>(1);
  const [editDays, setEditDays] = useState<number>(0);
  const [editDesc, setEditDesc] = useState<string>('');

  // Add custom plan form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDurationType, setNewDurationType] = useState<'months' | 'days'>('months');
  const [newDurationValue, setNewDurationValue] = useState<number>(2);
  const [newPrice, setNewPrice] = useState<number>(2500);
  const [newDescription, setNewDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Status feedback message
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const triggerSaveNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  // Start editing a plan
  const handleStartEdit = (plan: MembershipPlan) => {
    setEditingPlanId(plan.id);
    setEditPrice(plan.price);
    setEditName(plan.name);
    setEditMonths(plan.durationMonths || 0);
    setEditDays(plan.durationDays || 0);
    setEditDesc(plan.description || '');
  };

  // Save edited plan
  const handleSaveEdit = async (planId: string) => {
    if (editPrice < 0) return;
    const updated = plans.map((p) => {
      if (p.id === planId) {
        return {
          ...p,
          name: editName.trim() || p.name,
          price: editPrice,
          durationMonths: editMonths,
          durationDays: editDays,
          description: editDesc.trim(),
        };
      }
      return p;
    });

    await onUpdatePlans(updated);
    setEditingPlanId(null);
    triggerSaveNotification(`Updated ${editName || 'membership plan'} price to ₹${editPrice.toLocaleString('en-IN')}!`);
  };

  // Quick inline price update
  const handleQuickPriceChange = async (planId: string, newP: number) => {
    if (isNaN(newP) || newP < 0) return;
    const updated = plans.map((p) => (p.id === planId ? { ...p, price: newP } : p));
    await onUpdatePlans(updated);
    triggerSaveNotification(`Price updated to ₹${newP.toLocaleString('en-IN')} and saved to LocalStorage!`);
  };

  // Add new custom duration
  const handleAddCustomPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Please enter a plan name.');
      return;
    }
    if (newPrice <= 0) {
      setFormError('Please enter a valid price greater than ₹0.');
      return;
    }
    if (newDurationValue <= 0) {
      setFormError('Duration must be greater than 0.');
      return;
    }

    // Check duplicate name
    if (plans.some((p) => p.name.toLowerCase() === newName.trim().toLowerCase())) {
      setFormError('A membership plan with this name already exists.');
      return;
    }

    const newPlan: MembershipPlan = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      durationMonths: newDurationType === 'months' ? newDurationValue : 0,
      durationDays: newDurationType === 'days' ? newDurationValue : 0,
      price: newPrice,
      description:
        newDescription.trim() ||
        `Custom duration: ${newDurationValue} ${newDurationType}`,
      isDefault: false,
    };

    const updated = [...plans, newPlan];
    await onUpdatePlans(updated);

    // Reset form
    setNewName('');
    setNewPrice(2500);
    setNewDurationValue(2);
    setNewDescription('');
    setFormError('');
    setIsAddingNew(false);
    triggerSaveNotification(`Custom plan "${newPlan.name}" added at ₹${newPrice.toLocaleString('en-IN')}!`);
  };

  // Delete plan
  const handleDeletePlan = async (planId: string, planName: string) => {
    if (plans.length <= 1) {
      alert('You must keep at least one active membership plan.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove the "${planName}" plan? Existing members will not be affected.`)) {
      const updated = plans.filter((p) => p.id !== planId);
      await onUpdatePlans(updated);
      triggerSaveNotification(`Removed plan "${planName}".`);
    }
  };

  // Reset to default standard plans
  const handleResetDefaults = async () => {
    if (window.confirm('Reset all membership plans and prices to original defaults (₹1,500, ₹4,000, ₹7,000, ₹12,000)?')) {
      await onUpdatePlans(DEFAULT_MEMBERSHIP_PLANS);
      triggerSaveNotification('Reset to factory default plans and prices in Indian Rupees (₹)!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
              <Settings className="h-4 w-4" />
              <span>Admin System Settings</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-white">
              Membership Plans & Pricing (₹ INR)
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl mt-1">
              Modify rates for standard durations (1 Month, 3 Months, 6 Months, 1 Year) or add custom
              durations (e.g. 2 Weeks, 2 Months, 2 Years) in Indian Rupees (₹). All changes persist automatically in LocalStorage
              and reflect immediately across member registration and renewals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Reset to default plans & prices"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Add Custom Duration</span>
            </button>
          </div>
        </div>

        {/* Success toast banner */}
        {saveSuccessMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-medium text-emerald-400 animate-fadeIn">
            <Check className="h-4 w-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Add Custom Duration Modal / Drawer */}
      {isAddingNew && (
        <div className="rounded-2xl border border-emerald-500/30 bg-[#12141c] p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
                Add New Custom Membership Duration
              </h3>
            </div>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setFormError('');
              }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddCustomPlan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Plan Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Plan Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2 Months Cardio, 2 Weeks Trial"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Duration Type & Value */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Duration Length <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  required
                  value={newDurationValue}
                  onChange={(e) => setNewDurationValue(parseInt(e.target.value) || 1)}
                  className="w-20 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
                />
                <select
                  value={newDurationType}
                  onChange={(e) => setNewDurationType(e.target.value as 'months' | 'days')}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="months">Month(s)</option>
                  <option value="days">Day(s)</option>
                </select>
              </div>
            </div>

            {/* Price (₹) */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Price (₹ INR) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">₹</span>
                <input
                  type="number"
                  min="1"
                  step="50"
                  required
                  placeholder="2500"
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-7 pr-3 py-2 text-xs font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Description / Tagline
              </label>
              <input
                type="text"
                placeholder="e.g. Monsoon workout promo"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Submit button */}
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-black hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Save New Plan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of All Membership Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isEditing = editingPlanId === plan.id;
          const durationLabel =
            plan.durationMonths && plan.durationMonths > 0
              ? `${plan.durationMonths} ${plan.durationMonths === 1 ? 'Month' : 'Months'}`
              : `${plan.durationDays} Days`;

          const monthlyEquivalent =
            plan.durationMonths && plan.durationMonths > 0
              ? Math.round(plan.price / plan.durationMonths)
              : null;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition-all ${
                isEditing
                  ? 'border-emerald-500 bg-zinc-900/90 ring-1 ring-emerald-500'
                  : 'border-zinc-800/90 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80'
              }`}
            >
              {/* Card top */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        plan.isDefault
                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {plan.isDefault ? 'Standard Tier' : 'Custom Duration'}
                    </span>
                    <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white mt-1.5">
                      {plan.name}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(plan)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {!plan.isDefault && (
                      <button
                        onClick={() => handleDeletePlan(plan.id, plan.name)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                        title="Remove Custom Plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mt-2 min-h-[32px] line-clamp-2">
                  {plan.description || `Includes full gym access for ${durationLabel}.`}
                </p>
              </div>

              {/* Price section / In-place edit */}
              <div className="mt-5 pt-4 border-t border-zinc-800/80">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-emerald-400 mb-1">
                        Modify Price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={editPrice}
                          onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                          className="w-full rounded-xl border border-emerald-500 bg-zinc-950 pl-7 pr-3 py-1.5 text-sm font-bold text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                        Edit Title
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleSaveEdit(plan.id)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-500 py-1.5 text-xs font-bold text-black hover:bg-emerald-400 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setEditingPlanId(null)}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="font-['Space_Grotesk'] text-3xl font-extrabold text-white tracking-tight">
                          ₹{plan.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-medium text-zinc-500">/ {durationLabel}</span>
                      </div>
                    </div>

                    {monthlyEquivalent && (
                      <p className="text-[11px] font-medium text-emerald-400/90 mt-1">
                        ~₹{monthlyEquivalent.toLocaleString('en-IN')}/month equivalent
                      </p>
                    )}

                    {/* Quick inline price adjuster in INR */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500">Quick adjust:</span>
                      <div className="flex items-center gap-1">
                        {[plan.price - 250, plan.price + 250].map((adj) => {
                          if (adj <= 0) return null;
                          return (
                            <button
                              key={adj}
                              onClick={() => handleQuickPriceChange(plan.id, adj)}
                              className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
                            >
                              ₹{adj.toLocaleString('en-IN')}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handleStartEdit(plan)}
                          className="ml-auto text-[11px] font-medium text-emerald-400 hover:underline cursor-pointer"
                        >
                          Custom price
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info card / Persistence reminder */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 backdrop-blur-md flex items-start gap-3 text-xs text-zinc-400">
        <Info className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-zinc-200">
            Automatic Sync with Registration & Renewals
          </p>
          <p>
            Any updated prices and newly added durations are saved to your browser's LocalStorage instantly in Indian Rupees (₹).
            When gym staff opens the "Add New Member" modal or clicks "Renew Plan" on an athlete's profile,
            all these customized plans and rates will be available as instant-select options.
          </p>
        </div>
      </div>
    </div>
  );
};
