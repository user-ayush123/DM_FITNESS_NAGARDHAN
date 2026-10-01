# Security Specification & Test-Driven Hardening

## 1. Data Invariants
1. Member documents require authenticated staff/admin access.
2. The bootstrapped admin `lanjewarayush20@gmail.com` has administrator privileges.
3. Document IDs must be sanitized with regex `^[a-zA-Z0-9_\-]+$` and length <= 128 characters.
4. String fields must enforce size limits (e.g., fullName <= 100, phone <= 25, address <= 250, notes <= 500).
5. Numerical values like `paidAmount`, `totalFee`, `balanceDue` cannot be negative.
6. Membership types are strictly constrained to valid tiers: `['1 Month', '3 Months', '6 Months', '1 Year']`.
7. Gender is strictly constrained to valid options: `['Male', 'Female', 'Other', 'Prefer not to say']`.
8. Unauthenticated requests are rejected on all collections.
9. Ghost fields (shadow injection attacks) are rejected during creation and updates.

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Read/Write**: Attempt to read `/members/m1` without Auth. Expected: PERMISSION_DENIED.
2. **Ghost Field Injection**: Adding `{ "isAdmin": true }` into a Member document. Expected: PERMISSION_DENIED.
3. **Invalid ID Poisoning**: Creating a document at `/members/../../etc/passwd` or oversized ID (>128 chars). Expected: PERMISSION_DENIED.
4. **Oversized String Bomb**: Setting `fullName` to a 50KB payload. Expected: PERMISSION_DENIED.
5. **Negative Payment**: Setting `paidAmount: -500`. Expected: PERMISSION_DENIED.
6. **Negative Balance Due**: Setting `balanceDue: -200`. Expected: PERMISSION_DENIED.
7. **Invalid Membership Tier**: Setting `membershipType: "Lifetime Free"`. Expected: PERMISSION_DENIED.
8. **Invalid Gender Value**: Setting `gender: "Alien"`. Expected: PERMISSION_DENIED.
9. **Missing Required Fields**: Submitting member without `phone` or `address`. Expected: PERMISSION_DENIED.
10. **Admin Elevation Bypass**: Modifying `/admins/{id}` by non-admin or unverified user. Expected: PERMISSION_DENIED.
11. **Spoofed CreatedBy UID**: Non-matching createdBy from requester UID during creation. Expected: PERMISSION_DENIED.
12. **Blanket Query Scraping**: Attempting an unrestricted list without authenticated session. Expected: PERMISSION_DENIED.

## 3. Test Runner
See `firestore.rules.test.ts` for full implementation asserting PERMISSION_DENIED across all malicious payloads.
