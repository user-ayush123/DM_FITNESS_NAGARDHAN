/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Member, MemberFormData, DashboardStats, MembershipPlan } from './types';
import {
  getLocalMembers,
  persistMember,
  removeMember,
  subscribeToFirestoreMembers,
  subscribeToFirestorePlans,
  exportMembersToCSV,
  computeMemberStatus,
  isExpiringSoon,
  calculateExpiryDate,
  getMembershipPlans,
  saveMembershipPlans,
} from './services/memberService';
import { Navbar } from './components/Navbar';
import { StatCards } from './components/StatCards';
import { FiltersBar } from './components/FiltersBar';
import { MemberTable } from './components/MemberTable';
import { MemberModal } from './components/MemberModal';
import { MemberDetailModal } from './components/MemberDetailModal';
import { DeleteModal } from './components/DeleteModal';
import { SettingsView } from './components/SettingsView';
import { Dumbbell, Activity, Settings as SettingsIcon, Cloud, Check } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>(() => getLocalMembers());
  const [plans, setPlans] = useState<MembershipPlan[]>(() => getMembershipPlans());
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(true);

  // Active top-level tab: 'members' | 'settings'
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Real-time toast notice
  const [cloudToast, setCloudToast] = useState('');

  const showCloudToast = (msg: string) => {
    setCloudToast(msg);
    setTimeout(() => setCloudToast(''), 3000);
  };

  // Monitor Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Connect real-time Firestore listeners for members & pricing settings across all devices
  useEffect(() => {
    // 1. Real-time listener for all members
    const unsubscribeMembers = subscribeToFirestoreMembers(
      (cloudMembers) => {
        setMembers(cloudMembers);
        setIsFirestoreConnected(true);
      },
      (error) => {
        console.warn('Notice from Firestore members listener:', error);
      }
    );

    // 2. Real-time listener for pricing settings
    const unsubscribePlans = subscribeToFirestorePlans(
      (cloudPlans) => {
        setPlans(cloudPlans);
        setIsFirestoreConnected(true);
      },
      (error) => {
        console.warn('Notice from Firestore plans listener:', error);
      }
    );

    return () => {
      unsubscribeMembers();
      unsubscribePlans();
    };
  }, []);

  // Recalculate dashboard statistics
  const stats: DashboardStats = useMemo(() => {
    let active = 0;
    let expired = 0;
    let expiringSoonCount = 0;
    let revenue = 0;
    let balance = 0;

    members.forEach((m) => {
      const currentStatus = computeMemberStatus(m.expiryDate);
      if (currentStatus === 'active') {
        active++;
      } else {
        expired++;
      }

      if (isExpiringSoon(m.expiryDate, 7)) {
        expiringSoonCount++;
      }

      revenue += m.paidAmount || 0;
      balance += m.balanceDue || 0;
    });

    return {
      totalMembers: members.length,
      activeMembers: active,
      expiredMembers: expired,
      expiringSoon: expiringSoonCount,
      totalRevenue: revenue,
      totalBalanceDue: balance,
    };
  }, [members]);

  // Filter members based on user selections
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.fullName.toLowerCase().includes(q);
        const matchesPhone = m.phone.toLowerCase().includes(q);
        const matchesEmail = (m.email || '').toLowerCase().includes(q);
        const matchesAddress = m.address.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesAddress) {
          return false;
        }
      }

      // Status filter
      const currentStatus = computeMemberStatus(m.expiryDate);
      if (selectedStatus === 'active' && currentStatus !== 'active') return false;
      if (selectedStatus === 'expired' && currentStatus !== 'expired') return false;
      if (selectedStatus === 'expiring' && !isExpiringSoon(m.expiryDate, 7)) return false;

      // Plan filter
      if (selectedPlan !== 'all' && m.membershipType.toLowerCase() !== selectedPlan.toLowerCase()) {
        return false;
      }

      // Payment filter
      if (selectedPayment === 'has_balance' && m.balanceDue <= 0) return false;
      if (selectedPayment === 'paid' && m.balanceDue > 0) return false;

      // Gender filter
      if (selectedGender !== 'all' && m.gender !== selectedGender) return false;

      return true;
    });
  }, [members, searchQuery, selectedStatus, selectedPlan, selectedPayment, selectedGender]);

  // Reset filters handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPlan('all');
    setSelectedPayment('all');
    setSelectedGender('all');
  };

  // Update & persist membership plans directly to Firestore
  const handleUpdatePlans = async (updatedPlans: MembershipPlan[]) => {
    setPlans(updatedPlans);
    await saveMembershipPlans(updatedPlans);
    showCloudToast('Pricing settings saved to Firestore cloud database!');
  };

  // Add or Edit Member Save Handler
  const handleSaveMember = async (formData: MemberFormData, existingId?: string) => {
    const id = existingId || `dm-${Date.now().toString().slice(-5)}`;
    const now = new Date().toISOString();

    const memberToSave: Member = {
      ...formData,
      id,
      status: computeMemberStatus(formData.expiryDate),
      createdBy: existingId
        ? members.find((m) => m.id === existingId)?.createdBy || user?.uid || 'admin'
        : user?.uid || 'admin',
      createdAt: existingId
        ? members.find((m) => m.id === existingId)?.createdAt || now
        : now,
      updatedAt: now,
    };

    // Save directly to Firestore and local cache
    await persistMember(memberToSave);
    showCloudToast(
      existingId
        ? `Updated member "${memberToSave.fullName}" in Cloud Firestore!`
        : `Enrolled new member "${memberToSave.fullName}" in Cloud Firestore!`
    );

    // If detail modal is open with this member, update it
    if (selectedMember && selectedMember.id === id) {
      setSelectedMember(memberToSave);
    }
  };

  // Delete Member Handler
  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    const idToDelete = memberToDelete.id;
    const name = memberToDelete.fullName;

    // 1. Immediately remove from local UI state
    setMembers((prev) => prev.filter((m) => m.id !== idToDelete));
    setIsDeleteModalOpen(false);
    setMemberToDelete(null);
    if (selectedMember?.id === idToDelete) {
      setIsDetailModalOpen(false);
      setSelectedMember(null);
    }

    setIsDeleting(true);
    try {
      // 2. Permanently remove from Firestore and LocalStorage
      await removeMember(idToDelete);
      showCloudToast(`Permanently deleted "${name}".`);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Payment Update (e.g. collecting balance)
  const handleUpdatePayment = async (member: Member, newPaidAmount: number) => {
    const clampedPaid = Math.min(member.totalFee, Math.max(0, newPaidAmount));
    const newBalance = Math.max(0, member.totalFee - clampedPaid);

    const updated: Member = {
      ...member,
      paidAmount: clampedPaid,
      balanceDue: newBalance,
      updatedAt: new Date().toISOString(),
    };

    await persistMember(updated);
    setSelectedMember(updated);
    showCloudToast(`Payment updated for ${member.fullName} in Cloud Firestore!`);
  };

  // Quick Membership Renewal
  const handleRenewPlan = async (member: Member, planName: string, fee: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const baseDate = member.expiryDate > todayStr ? member.expiryDate : todayStr;
    const newExpiry = calculateExpiryDate(baseDate, planName, plans);

    const updated: Member = {
      ...member,
      membershipType: planName,
      totalFee: member.totalFee + fee,
      paidAmount: member.paidAmount + fee,
      expiryDate: newExpiry,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };

    await persistMember(updated);
    setSelectedMember(updated);
    showCloudToast(`Renewed membership for ${member.fullName} in Cloud Firestore!`);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        user={user}
        authLoading={authLoading}
        onOpenAddModal={() => {
          setMemberToEdit(null);
          setIsAddEditModalOpen(true);
        }}
        totalMembersCount={members.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isFirestoreConnected={isFirestoreConnected}
      />

      {/* Cloud Notification Toast */}
      {cloudToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 border border-emerald-500/40 px-4 py-3 text-xs font-semibold text-emerald-400 shadow-2xl backdrop-blur-xl animate-bounce">
          <Cloud className="h-4 w-4" />
          <span>{cloudToast}</span>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {activeTab === 'settings' ? (
          /* Settings View */
          <SettingsView
            plans={plans}
            onUpdatePlans={handleUpdatePlans}
            onClose={() => setActiveTab('members')}
          />
        ) : (
          /* Members Directory & Dashboard View */
          <>
            {/* Hero Welcome & Quick Gym Headline */}
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-[#10131c] to-[#0c0f17] p-6 shadow-2xl backdrop-blur-xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-2">
                    <Activity className="h-3.5 w-3.5" />
                    <span>DM FITNESS Management Dashboard</span>
                  </div>
                  <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Member Management & Operations
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mt-1">
                    Live cloud synchronization via Firebase Firestore. Changes update across all
                    screens, browsers, and devices instantly in real-time.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="flex items-center gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                  >
                    <SettingsIcon className="h-4 w-4 text-emerald-400" />
                    <span>Price Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setMemberToEdit(null);
                      setIsAddEditModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-5 py-3 text-xs font-bold text-black shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Dumbbell className="h-4 w-4 stroke-[2.5]" />
                    <span>Enroll Member</span>
                  </button>
                </div>
              </div>

              {/* Decorative ambient lights */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="pointer-events-none absolute right-40 -bottom-20 h-48 w-48 rounded-full bg-lime-500/10 blur-3xl" />
            </div>

            {/* 1. Summary Statistics Cards */}
            <StatCards
              stats={stats}
              onFilterStatus={(status) => {
                setSelectedStatus(status);
                if (status === 'has_balance') {
                  setSelectedPayment('has_balance');
                }
              }}
            />

            {/* 2. Filters & Actions Bar */}
            <FiltersBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedPlan={selectedPlan}
              onPlanChange={setSelectedPlan}
              selectedPayment={selectedPayment}
              onPaymentChange={setSelectedPayment}
              selectedGender={selectedGender}
              onGenderChange={setSelectedGender}
              onOpenAddModal={() => {
                setMemberToEdit(null);
                setIsAddEditModalOpen(true);
              }}
              onExportCSV={() => exportMembersToCSV(members)}
              onPrint={() => window.print()}
              onResetFilters={handleResetFilters}
              totalFiltered={filteredMembers.length}
              totalAll={members.length}
              plans={plans}
            />

            {/* 3. Members Table */}
            <MemberTable
              members={filteredMembers}
              onViewDetails={(m) => {
                setSelectedMember(m);
                setIsDetailModalOpen(true);
              }}
              onEdit={(m) => {
                setMemberToEdit(m);
                setIsAddEditModalOpen(true);
              }}
              onDelete={(m) => {
                setMemberToDelete(m);
                setIsDeleteModalOpen(true);
              }}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-[#090a0f] py-6 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-medium">
            <span className="font-['Space_Grotesk'] font-bold text-zinc-300">DM FITNESS</span>
            <span>• Built for professional fitness administration</span>
          </p>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Firebase Firestore Live Database Connected
            </span>
            <span>•</span>
            <button
              onClick={() => setActiveTab(activeTab === 'members' ? 'settings' : 'members')}
              className="text-zinc-300 hover:text-emerald-400 hover:underline cursor-pointer"
            >
              {activeTab === 'members' ? 'Pricing Settings' : 'Back to Members'}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MemberModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={handleSaveMember}
        memberToEdit={memberToEdit}
        plans={plans}
      />

      <MemberDetailModal
        isOpen={isDetailModalOpen}
        member={selectedMember}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={(m) => {
          setIsDetailModalOpen(false);
          setMemberToEdit(m);
          setIsAddEditModalOpen(true);
        }}
        onDelete={(m) => {
          setIsDetailModalOpen(false);
          setMemberToDelete(m);
          setIsDeleteModalOpen(true);
        }}
        onUpdatePayment={handleUpdatePayment}
        onRenewPlan={handleRenewPlan}
        plans={plans}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        member={memberToDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
