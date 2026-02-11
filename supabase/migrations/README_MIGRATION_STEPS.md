# 🚀 Organization Management Migration - Step by Step

Follow these steps **in order**. After each step, verify it succeeded before moving to the next.

---

## 🧹 **STEP 0: Cleanup Old Policies (CRITICAL)**

**File:** `step0_cleanup_old_policies.sql`

**What it does:** Removes leftover policies from previous failed migration attempts

**Run this FIRST before anything else!** This clears out broken policies that reference columns that don't exist yet.

---

## ✅ **STEP 1: Create New Tables**

**File:** `step1_create_new_tables.sql`

**What it does:** Creates 7 brand new tables (organizations, user_profiles, memberships, etc.)

**Run this first.** Should complete without errors.

---

## 🔍 **STEP 2: Discover Existing Tables**

**File:** `step2_list_existing_tables.sql`

**What it does:** Shows which tables exist and which need `organization_id` column

**This is informational only** - just tells you what tables you have. Copy the output and share it with me so I can create custom Step 5 scripts for YOUR specific tables.

---

## ⚡ **STEP 3: Add Helper Functions**

**File:** `step3_add_helper_functions.sql`

**What it does:** Creates credit balance functions and auto-update triggers

**Run after Step 1 succeeds.**

---

## 🔒 **STEP 4: Enable RLS on New Tables**

**File:** `step4_add_rls_to_new_tables.sql`

**What it does:** Enables Row-Level Security on the 7 new tables

**Run after Step 3 succeeds.**

---

## ⚠️ **STEP 5: Connect Your Existing Tables**

**THIS STEP WILL BE CUSTOM CREATED AFTER STEP 2**

After you run Step 2 and share the output with me, I'll create custom migration scripts that:
- Add `organization_id` column to YOUR specific tables
- Enable RLS on those tables
- Create appropriate policies

We need to know EXACTLY which tables you have first!

---

## 📋 **How to Run:**

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `step0_cleanup_old_policies.sql`
3. Paste and click **RUN**
4. ✅ Verify success message appears
5. Move to Step 1
6. Copy contents of `step1_create_new_tables.sql`
7. Paste and click **RUN**
8. ✅ Verify success message appears
9. Move to Step 2
10. Copy contents of `step2_list_existing_tables.sql`
11. Paste and click **RUN**
12. **SHARE THE OUTPUT WITH ME**
13. I'll create custom Step 5 scripts for you
14. Continue with Steps 3, 4, and 5

---

## 🎯 **START HERE:**

Run **Step 0** now and let me know if it succeeds!