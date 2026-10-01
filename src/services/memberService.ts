import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Member, MembershipType, MembershipStatus, MembershipPlan } from '../types';
import { INITIAL_MEMBERS } from '../data/mockMembers';

const LOCAL_STORAGE_KEY = 'dm_fitness_members_inr_v2';
const LOCAL_STORAGE_PLANS_KEY = 'dm_fitness_plans_inr_v2';
const LOCAL_STORAGE_INIT_KEY = 'dm_fitness_system_initialized_v2';
const LOCAL_STORAGE_DELETED_IDS_KEY = 'dm_fitness_deleted_ids_v2';

export const DEFAULT_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'plan-1m',
    name: '1 Month',
    durationMonths: 1,
    durationDays: 0,
    price: 1500,
    description: 'Standard monthly gym pass',
    isDefault: true,
  },
  {
    id: 'plan-3m',
    name: '3 Months',
    durationMonths: 3,
    durationDays: 0,
    price: 4000,
    description: 'Quarterly training program (Save ₹500)',
    isDefault: true,
  },
  {
    id: 'plan-6m',
    name: '6 Months',
    durationMonths: 6,
    durationDays: 0,
    price: 7000,
    description: 'Semi-annual conditioning pass (Save ₹2,000)',
    isDefault: true,
  },
  {
    id: 'plan-1y',
    name: '1 Year',
    durationMonths: 12,
    durationDays: 0,
    price: 12000,
    description: 'Annual VIP unlimited pass (Save ₹6,000)',
    isDefault: true,
  },
];

// Helper: Get set of permanently deleted member IDs
export function getDeletedMemberIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

// Helper: Record a member ID as permanently deleted
export function recordDeletedMemberId(id: string): void {
  try {
    const ids = getDeletedMemberIds();
    ids.add(id);
    localStorage.setItem(LOCAL_STORAGE_DELETED_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.error('Failed saving deleted ID tombstone:', err);
  }
}

// Check if system has completed its one-time initial seed
export function isSystemInitialized(): boolean {
  try {
    return localStorage.getItem(LOCAL_STORAGE_INIT_KEY) === 'true';
  } catch {
    return false;
  }
}

// Mark system as initialized permanently
export function markSystemInitialized(): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_INIT_KEY, 'true');
  } catch (err) {
    console.error('Failed setting init key:', err);
  }
}

// Read membership plans from local cache
export function getMembershipPlans(): MembershipPlan[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLANS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_PLANS_KEY, JSON.stringify(DEFAULT_MEMBERSHIP_PLANS));
      return DEFAULT_MEMBERSHIP_PLANS;
    }
    const parsed: MembershipPlan[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_MEMBERSHIP_PLANS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed reading plans from localStorage:', err);
    return DEFAULT_MEMBERSHIP_PLANS;
  }
}

// Save membership plans directly to Firestore and local cache
export async function saveMembershipPlans(plans: MembershipPlan[]): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_PLANS_KEY, JSON.stringify(plans));
  } catch (err) {
    console.error('Failed saving plans to localStorage:', err);
  }

  const docPath = 'settings/membership_plans';
  try {
    const docRef = doc(db, 'settings', 'membership_plans');
    await setDoc(docRef, {
      plans,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid || 'admin',
    });
  } catch (err) {
    console.error('Error saving plans to Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

// Subscribe to real-time Firestore pricing settings
export function subscribeToFirestorePlans(
  onData: (plans: MembershipPlan[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const docPath = 'settings/membership_plans';
  const docRef = doc(db, 'settings', 'membership_plans');

  return onSnapshot(
    docRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.plans) && data.plans.length > 0) {
          try {
            localStorage.setItem(LOCAL_STORAGE_PLANS_KEY, JSON.stringify(data.plans));
          } catch (e) {
            console.error('Error writing cached plans:', e);
          }
          onData(data.plans);
          return;
        }
      }

      // If settings document doesn't exist yet, seed initial default plans
      try {
        await setDoc(docRef, {
          plans: DEFAULT_MEMBERSHIP_PLANS,
          updatedAt: new Date().toISOString(),
          updatedBy: 'initial_setup',
        });
        onData(DEFAULT_MEMBERSHIP_PLANS);
      } catch (err) {
        console.warn('Initial settings seed notice:', err);
        onData(getMembershipPlans());
      }
    },
    (error) => {
      console.error('Firestore Plans Subscription Error:', error);
      if (onError) {
        try {
          handleFirestoreError(error, OperationType.GET, docPath);
        } catch (e) {
          onError(e);
        }
      }
    }
  );
}

// Find price for a plan
export function getPlanPrice(planName: string, plans: MembershipPlan[]): number {
  const match = plans.find((p) => p.name.toLowerCase() === planName.toLowerCase());
  if (match) return match.price;

  if (planName === '1 Month') return 1500;
  if (planName === '3 Months') return 4000;
  if (planName === '6 Months') return 7000;
  if (planName === '1 Year') return 12000;
  return 1500;
}

// Calculate expiry date automatically based on joining date and membership duration
export function calculateExpiryDate(
  joiningDateStr: string,
  planNameOrPlan: string | MembershipPlan,
  plans: MembershipPlan[] = getMembershipPlans()
): string {
  if (!joiningDateStr) return '';
  const date = new Date(joiningDateStr);
  if (isNaN(date.getTime())) return '';

  let planObj: MembershipPlan | undefined;
  if (typeof planNameOrPlan === 'object') {
    planObj = planNameOrPlan;
  } else {
    planObj = plans.find((p) => p.name.toLowerCase() === planNameOrPlan.toLowerCase());
  }

  if (planObj) {
    if (planObj.durationMonths && planObj.durationMonths > 0) {
      date.setMonth(date.getMonth() + planObj.durationMonths);
    }
    if (planObj.durationDays && planObj.durationDays > 0) {
      date.setDate(date.getDate() + planObj.durationDays);
    }
    return date.toISOString().split('T')[0];
  }

  const name = typeof planNameOrPlan === 'string' ? planNameOrPlan : '';
  if (name.includes('1 Year') || name.includes('12 Month')) {
    date.setFullYear(date.getFullYear() + 1);
  } else if (name.includes('6 Month')) {
    date.setMonth(date.getMonth() + 6);
  } else if (name.includes('3 Month')) {
    date.setMonth(date.getMonth() + 3);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  return date.toISOString().split('T')[0];
}

// Compute if member is active or expired based on today's date
export function computeMemberStatus(expiryDateStr: string): MembershipStatus {
  if (!expiryDateStr) return 'active';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(23, 59, 59, 999);

  return expiry.getTime() >= today.getTime() ? 'active' : 'expired';
}

// Check if member membership expires within next N days
export function isExpiringSoon(expiryDateStr: string, withinDays: number = 7): boolean {
  if (!expiryDateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(23, 59, 59, 999);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= withinDays;
}

// Calculate days remaining or days expired
export function getDaysRemaining(expiryDateStr: string): { days: number; isExpired: boolean } {
  if (!expiryDateStr) return { days: 0, isExpired: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return {
    days: Math.abs(days),
    isExpired: days < 0,
  };
}

// Read from local cache with status recalculation and deleted ID filtering
export function getLocalMembers(): Member[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const initialized = isSystemInitialized();

    // If never initialized at all, bootstrap initial records once
    if (raw === null && !initialized) {
      markSystemInitialized();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS.map((m) => ({
        ...m,
        status: computeMemberStatus(m.expiryDate),
      }));
    }

    if (!raw) {
      return [];
    }

    const parsed: Member[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const deletedIds = getDeletedMemberIds();
    return parsed
      .filter((m) => !deletedIds.has(m.id))
      .map((m) => ({
        ...m,
        status: computeMemberStatus(m.expiryDate),
      }));
  } catch (err) {
    console.error('Failed reading members from localStorage:', err);
    return [];
  }
}

// Save to local cache (saves empty array properly when all members are deleted)
export function saveLocalMembers(members: Member[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(members));
  } catch (err) {
    console.error('Failed saving members to localStorage:', err);
  }
}

// Real-time Firestore members collection listener
export function subscribeToFirestoreMembers(
  onData: (members: Member[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collectionPath = 'members';
  const membersRef = collection(db, collectionPath);

  return onSnapshot(
    membersRef,
    async (snapshot) => {
      const deletedIds = getDeletedMemberIds();

      // Check if Firestore was ever initialized
      let isCloudInitialized = isSystemInitialized();
      if (!isCloudInitialized) {
        try {
          const sysSnap = await getDoc(doc(db, 'settings', 'system'));
          if (sysSnap.exists()) {
            isCloudInitialized = true;
            markSystemInitialized();
          }
        } catch {
          // ignore
        }
      }

      // If completely empty AND never initialized anywhere, perform the one-time initial seed
      if (snapshot.empty && !isCloudInitialized) {
        console.log('Performing one-time initial seed for new database...');
        markSystemInitialized();
        try {
          // Mark system initialized in Firestore so it NEVER seeds again even if 0 members
          await setDoc(doc(db, 'settings', 'system'), {
            isInitialized: true,
            initializedAt: new Date().toISOString(),
          });

          const promises = INITIAL_MEMBERS.map((m) => {
            const docRef = doc(db, 'members', m.id);
            return setDoc(docRef, {
              ...m,
              status: computeMemberStatus(m.expiryDate),
              createdBy: 'initial_setup',
            });
          });
          await Promise.all(promises);
        } catch (seedErr) {
          console.warn('Initial member seed error:', seedErr);
        }
        saveLocalMembers(INITIAL_MEMBERS);
        onData(INITIAL_MEMBERS);
        return;
      }

      // If empty and already initialized: This is intentional (0 members)! Do NOT reload default data.
      if (snapshot.empty) {
        saveLocalMembers([]);
        onData([]);
        return;
      }

      // Process live snapshot documents
      const list: Member[] = [];
      snapshot.forEach((docSnap) => {
        const id = docSnap.id;
        // Never include documents that were permanently deleted
        if (deletedIds.has(id)) {
          return;
        }

        const data = docSnap.data() as Member;
        list.push({
          ...data,
          id,
          status: computeMemberStatus(data.expiryDate),
        });
      });

      // ALWAYS sync to localStorage (even if 0 items)
      saveLocalMembers(list);
      onData(list);
    },
    (error) => {
      console.error('Firestore Members Listener Error:', error);
      if (onError) {
        try {
          handleFirestoreError(error, OperationType.LIST, collectionPath);
        } catch (e) {
          onError(e);
        }
      }
    }
  );
}

// Add or update a member directly in Firestore cloud database
export async function persistMember(member: Member): Promise<void> {
  const updatedMember: Member = {
    ...member,
    status: computeMemberStatus(member.expiryDate),
    updatedAt: new Date().toISOString(),
    createdBy: member.createdBy || auth.currentUser?.uid || 'admin',
  };

  // If this ID was previously marked deleted, unmark it
  try {
    const deletedIds = getDeletedMemberIds();
    if (deletedIds.has(member.id)) {
      deletedIds.delete(member.id);
      localStorage.setItem(LOCAL_STORAGE_DELETED_IDS_KEY, JSON.stringify(Array.from(deletedIds)));
    }
  } catch (e) {
    console.error('Error updating deleted IDs:', e);
  }

  // Immediate optimistic update to local cache
  const localList = getLocalMembers();
  const index = localList.findIndex((m) => m.id === member.id);
  let updatedList: Member[];
  if (index >= 0) {
    updatedList = [...localList];
    updatedList[index] = updatedMember;
  } else {
    updatedList = [updatedMember, ...localList];
  }
  saveLocalMembers(updatedList);

  // Directly persist to Firestore
  const docPath = `members/${member.id}`;
  try {
    const docRef = doc(db, 'members', member.id);
    await setDoc(docRef, updatedMember);
  } catch (err) {
    console.error('Error persisting member to Firestore:', err);
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

// Delete member permanently from Firestore, LocalStorage, and local state
export async function removeMember(memberId: string): Promise<void> {
  // 1. Permanently record ID as deleted (tombstone)
  recordDeletedMemberId(memberId);

  // 2. Remove immediately from local storage cache
  const localList = getLocalMembers();
  const updated = localList.filter((m) => m.id !== memberId);
  saveLocalMembers(updated);

  // 3. Mark system as initialized so it never re-seeds if all are deleted
  markSystemInitialized();

  // 4. Directly delete document from Firestore cloud database
  const docPath = `members/${memberId}`;
  try {
    const docRef = doc(db, 'members', memberId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting member from Firestore:', err);
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

// Export members to CSV format
export function exportMembersToCSV(members: Member[]): void {
  const headers = [
    'ID',
    'Full Name',
    'Email',
    'Phone',
    'Address',
    'Date of Birth',
    'Gender',
    'Membership Type',
    'Total Fee (₹)',
    'Paid Amount (₹)',
    'Balance Due (₹)',
    'Joining Date',
    'Expiry Date',
    'Status',
    'Emergency Contact',
    'Notes',
  ];

  const rows = members.map((m) => [
    `"${m.id}"`,
    `"${m.fullName.replace(/"/g, '""')}"`,
    `"${(m.email || '').replace(/"/g, '""')}"`,
    `"${m.phone.replace(/"/g, '""')}"`,
    `"${m.address.replace(/"/g, '""')}"`,
    `"${m.dateOfBirth}"`,
    `"${m.gender}"`,
    `"${m.membershipType}"`,
    m.totalFee,
    m.paidAmount,
    m.balanceDue,
    `"${m.joiningDate}"`,
    `"${m.expiryDate}"`,
    `"${m.status}"`,
    `"${(m.emergencyContact || '').replace(/"/g, '""')}"`,
    `"${(m.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `DM_FITNESS_Members_INR_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
