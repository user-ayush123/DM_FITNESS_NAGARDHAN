import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Member, MembershipType, MembershipStatus, MembershipPlan } from '../types';
import { INITIAL_MEMBERS } from '../data/mockMembers';

const LOCAL_STORAGE_KEY = 'dm_fitness_members_inr_v2';
const LOCAL_STORAGE_PLANS_KEY = 'dm_fitness_plans_inr_v2';

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

// Read membership plans from localStorage
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

// Save membership plans to localStorage and optional Firestore
export async function saveMembershipPlans(plans: MembershipPlan[], isFirebaseActive: boolean = false): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_PLANS_KEY, JSON.stringify(plans));
  } catch (err) {
    console.error('Failed saving plans to localStorage:', err);
  }

  // Also sync to Firestore if user is authenticated
  if (isFirebaseActive && auth.currentUser) {
    try {
      const docRef = doc(db, 'settings', 'membership_plans');
      await setDoc(docRef, {
        plans,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.uid,
      });
    } catch (err) {
      console.warn('Could not sync plans to Firestore settings:', err);
    }
  }
}

// Find price for a plan
export function getPlanPrice(planName: string, plans: MembershipPlan[]): number {
  const match = plans.find((p) => p.name.toLowerCase() === planName.toLowerCase());
  if (match) return match.price;

  // Fallback defaults in INR
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

  // Fallback parsing if plan not found in list
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

// Read from localStorage with status recalculation
export function getLocalMembers(): Member[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS.map((m) => ({
        ...m,
        status: computeMemberStatus(m.expiryDate),
      }));
    }
    const parsed: Member[] = JSON.parse(raw);
    return parsed.map((m) => ({
      ...m,
      status: computeMemberStatus(m.expiryDate),
    }));
  } catch (err) {
    console.error('Failed reading members from localStorage:', err);
    return INITIAL_MEMBERS;
  }
}

// Save to localStorage
export function saveLocalMembers(members: Member[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(members));
  } catch (err) {
    console.error('Failed saving members to localStorage:', err);
  }
}

// Sync Firestore collection with Firestore Error Handling
export function subscribeToFirestoreMembers(
  onData: (members: Member[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  const collectionPath = 'members';
  const membersRef = collection(db, collectionPath);

  return onSnapshot(
    membersRef,
    (snapshot) => {
      const list: Member[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Member;
        list.push({
          ...data,
          id: docSnap.id,
          status: computeMemberStatus(data.expiryDate),
        });
      });
      // Update local storage cache
      if (list.length > 0) {
        saveLocalMembers(list);
      }
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (e) {
        onError(e);
      }
    }
  );
}

// Add or update a member in both Firestore and localStorage
export async function persistMember(member: Member, isFirebaseActive: boolean): Promise<void> {
  const updatedMember: Member = {
    ...member,
    status: computeMemberStatus(member.expiryDate),
    updatedAt: new Date().toISOString(),
  };

  // Always update local cache
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

  // If signed in to Firebase, push to cloud
  if (isFirebaseActive && auth.currentUser) {
    const docPath = `members/${member.id}`;
    try {
      const docRef = doc(db, 'members', member.id);
      await setDoc(docRef, {
        ...updatedMember,
        createdBy: member.createdBy || auth.currentUser.uid,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  }
}

// Delete member from both Firestore and localStorage
export async function removeMember(memberId: string, isFirebaseActive: boolean): Promise<void> {
  // Update local storage
  const localList = getLocalMembers();
  const updated = localList.filter((m) => m.id !== memberId);
  saveLocalMembers(updated);

  // If signed in, delete from Firestore
  if (isFirebaseActive && auth.currentUser) {
    const docPath = `members/${memberId}`;
    try {
      const docRef = doc(db, 'members', memberId);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
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
