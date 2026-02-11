# 🏢 Organization Management & Credit System - Implementation Plan

## 📋 **Overview**

Transform LotusLeads from single-user to multi-tenant SaaS with:
- Google OAuth authentication
- Organization/team management
- Role-based access control (Admin vs User)
- Credit-based usage tracking system
- Team invitations with temporary passwords

---

## 🎯 **Core Requirements**

### **1. Authentication & Authorization**
- ✅ Google OAuth for signup/login
- ✅ Admin role (full access, org owner)
- ✅ User role (limited access, no admin features)
- ✅ Invite system (admin sends invite → user signs up)
- ✅ Temporary password for invited users (changeable)

### **2. Organization Structure**
- ✅ One organization per business
- ✅ First user = Admin (org creator)
- ✅ Multiple users per org
- ✅ Users tied to one org only

### **3. Credit System**
Different operations have different costs:

| Operation | Credit Cost | Notes |
|-----------|-------------|-------|
| **Apollo Search** | 10 credits | Most expensive - prospect identification |
| **Apollo Enrich** | 5 credits | Expensive - full contact enrichment |
| **Geo Enrichment** | 1 credit | Google Maps API - cheapest |
| **Property Analysis** | 2 credits | OpenAI Vision + processing |
| **Service Mapping** | 2 credits | OpenAI analysis + research |

- ✅ Admin can view credit balance
- ✅ Admin can purchase credits (stripe integration later)
- ✅ All users consume from org credit pool
- ✅ Block operations when credits = 0
- ✅ Usage logging (who did what, when)

---

## 🗄️ **Database Schema Changes**

### **New Tables**

#### **1. organizations**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  domain TEXT, -- Optional: company domain for auto-join
  credit_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **2. organization_members**
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

#### **3. invitations**
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  invited_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, email)
);
```

#### **4. credit_transactions**
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'apollo_search',
    'apollo_enrich', 
    'geo_enrichment',
    'property_analysis',
    'service_mapping',
    'credit_purchase'
  )),
  credits_delta INTEGER NOT NULL, -- Negative for consumption, positive for purchase
  balance_after INTEGER NOT NULL,
  lead_id UUID, -- Optional: track which lead this relates to
  metadata JSONB, -- Store additional context
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Modified Tables**

#### **Update existing tables to include org_id:**
```sql
-- Add organization_id to all existing tables
ALTER TABLE leads ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE business_profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE icp_definitions ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE saved_searches ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE campaigns ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Create indexes for performance
CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_business_profiles_org ON business_profiles(organization_id);
CREATE INDEX idx_credit_transactions_org ON credit_transactions(organization_id);
```

---

## 🔐 **Authentication Flow**

### **Scenario 1: New User Sign Up (Google OAuth)**

```
1. User clicks "Sign in with Google"
2. Google OAuth popup → user authorizes
3. Backend receives Google profile (email, name, picture)
4. Check if user exists in auth.users:
   
   a) NEW USER (First time):
      - Create user in auth.users
      - Create new organization (name from user input)
      - Add user to organization_members as 'admin'
      - Initialize credit_balance = 100 (trial credits)
      - Redirect to onboarding/dashboard
   
   b) EXISTING USER:
      - Fetch organization_id from organization_members
      - Check role
      - Redirect to dashboard
```

### **Scenario 2: Admin Invites Team Member**

```
1. Admin enters email in Team Management UI
2. Backend creates invitation record with:
   - Unique token
   - Expiry (7 days)
   - Status: 'pending'
3. Send email with invitation link:
   https://app.lotusleads.com/accept-invite?token=abc123
4. User clicks link:
   - IF already has Google account → OAuth flow → join org
   - IF no account → Create with username/temp password
5. Mark invitation as 'accepted'
6. Add to organization_members as 'user'
```

### **Scenario 3: Invited User Login**

```
1. User can login with:
   a) Google OAuth (if they signed up with Google)
   b) Username/password (if invited and set password)
2. Backend checks organization_members for org_id
3. Load org context and role
4. Show UI based on role (admin vs user)
```

---

## 💳 **Credit System Implementation**

### **Credit Costs Configuration**
```typescript
// /src/lib/credits.ts
export const CREDIT_COSTS = {
  APOLLO_SEARCH: 10,      // Most expensive
  APOLLO_ENRICH: 5,       // Expensive
  GEO_ENRICHMENT: 1,      // Cheap (Google Maps)
  PROPERTY_ANALYSIS: 2,   // Medium (OpenAI Vision)
  SERVICE_MAPPING: 2,     // Medium (OpenAI + research)
} as const;

export type OperationType = keyof typeof CREDIT_COSTS;
```

### **Credit Check Middleware (Backend)**
```typescript
// Before any paid operation:
async function checkAndDeductCredits(
  organizationId: string,
  operationType: OperationType,
  userId: string,
  leadId?: string
) {
  const cost = CREDIT_COSTS[operationType];
  
  // 1. Check current balance
  const org = await getOrganization(organizationId);
  if (org.credit_balance < cost) {
    throw new Error('Insufficient credits');
  }
  
  // 2. Deduct credits
  const newBalance = org.credit_balance - cost;
  await updateOrganization(organizationId, {
    credit_balance: newBalance
  });
  
  // 3. Log transaction
  await createCreditTransaction({
    organization_id: organizationId,
    user_id: userId,
    operation_type: operationType,
    credits_delta: -cost,
    balance_after: newBalance,
    lead_id: leadId,
    metadata: { timestamp: new Date().toISOString() }
  });
  
  return newBalance;
}
```

### **Credit Purchase (Admin Only)**
```typescript
// /supabase/functions/server/routes/credits.ts
app.post('/credits/purchase', async (c) => {
  const { organizationId, amount } = await c.req.json();
  const userId = c.get('userId');
  
  // Check if user is admin
  const member = await getOrganizationMember(organizationId, userId);
  if (member.role !== 'admin') {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  // For now, just add credits (later: Stripe integration)
  const org = await getOrganization(organizationId);
  const newBalance = org.credit_balance + amount;
  
  await updateOrganization(organizationId, {
    credit_balance: newBalance
  });
  
  await createCreditTransaction({
    organization_id: organizationId,
    user_id: userId,
    operation_type: 'credit_purchase',
    credits_delta: amount,
    balance_after: newBalance
  });
  
  return c.json({ success: true, newBalance });
});
```

---

## 🎨 **UI/UX Changes**

### **New Pages**

#### **1. Organization Settings Page**
**Route:** `/settings/organization`

**Sections:**
- **Organization Info**
  - Name
  - Slug
  - Domain (optional)
  - Created date
  
- **Credit Balance** (Admin only)
  - Current balance: `1,234 credits`
  - Purchase credits button
  - Usage chart (last 30 days)
  
- **API Keys** (Admin only)
  - Moved from Settings
  - Apollo API Key
  - Google Maps API Key
  - OpenAI API Key
  - Google Custom Search API Key

#### **2. Team Management Page**
**Route:** `/settings/team`

**Features:**
- **Team Members Table**
  - Name, Email, Role, Joined Date
  - Actions: Remove (admin only)
  
- **Invite Member** (Admin only)
  - Email input
  - Role selector (Admin / User)
  - Send invitation button
  
- **Pending Invitations**
  - Show pending invites
  - Resend / Cancel options

#### **3. Credit Dashboard Page**
**Route:** `/settings/credits` (Admin only)

**Features:**
- **Balance Overview**
  - Current balance
  - Credits used this month
  - Credits purchased this month
  
- **Usage Breakdown**
  - Pie chart by operation type
  - Top users by consumption
  
- **Transaction History**
  - Table: Date, User, Operation, Credits, Balance
  - Filter by date range, user, operation type
  
- **Purchase Credits**
  - Credit packages:
    - 100 credits - $10
    - 500 credits - $45 (10% discount)
    - 1000 credits - $80 (20% discount)
    - 5000 credits - $350 (30% discount)

#### **4. Accept Invitation Page**
**Route:** `/accept-invite?token=abc123`

**Flow:**
1. Validate token
2. Show org name and inviter
3. Options:
   - Sign in with Google
   - Create account with username/password
4. On success → Join org → Redirect to dashboard

### **Modified Pages**

#### **Settings Page Navigation**
```
Settings
├── Profile (existing)
├── Organization (NEW)
├── Team (NEW - admin only)
├── Credits (NEW - admin only)
└── API Keys (moved to Organization)
```

#### **AppShell Changes**
- Show organization name in header
- Show credit balance in header (e.g., "💎 1,234 credits")
- User dropdown menu:
  - Profile
  - Organization Settings (admin only)
  - Team Management (admin only)
  - Switch Organization (future: if user in multiple orgs)
  - Sign Out

---

## 🔧 **Backend API Routes**

### **Authentication**
```
POST   /auth/google-oauth          - Google OAuth callback
POST   /auth/signup                - Create new user + org
POST   /auth/login                 - Login with username/password
POST   /auth/logout                - Sign out
GET    /auth/me                    - Get current user + org context
```

### **Organizations**
```
GET    /organizations/:id          - Get organization details
PUT    /organizations/:id          - Update organization (admin only)
GET    /organizations/:id/members  - List team members
```

### **Invitations**
```
POST   /invitations                - Create invitation (admin only)
GET    /invitations/:token         - Validate invitation token
POST   /invitations/:token/accept  - Accept invitation
DELETE /invitations/:id            - Cancel invitation (admin only)
POST   /invitations/:id/resend     - Resend invitation (admin only)
```

### **Credits**
```
GET    /credits/balance            - Get org credit balance
POST   /credits/purchase           - Purchase credits (admin only)
GET    /credits/transactions       - List credit transactions
GET    /credits/usage-stats        - Get usage statistics (admin only)
```

### **Modified Endpoints (Add Credit Check)**
```
POST   /leads/search               - Check credits BEFORE Apollo search
POST   /leads/:id/enrich           - Check credits BEFORE Apollo enrich
POST   /leads/:id/geo-enrichment   - Check credits BEFORE geo enrichment
POST   /leads/:id/property-analysis - Check credits BEFORE analysis
POST   /leads/:id/service-mapping  - Check credits BEFORE mapping
```

---

## 📱 **UI Components to Build**

### **1. CreditBadge Component**
Display current credit balance in header/nav
```tsx
// Shows: 💎 1,234 credits
// Click → opens credit modal
// Red if < 100, yellow if < 500, green otherwise
```

### **2. InsufficientCreditsModal**
Show when user tries operation without enough credits
```tsx
// "Insufficient Credits"
// "This operation requires X credits, but you have Y"
// "Contact your admin to purchase more credits"
// Button: "OK" or "View Plans" (if admin)
```

### **3. InviteMemberModal**
Admin can invite team members
```tsx
// Email input
// Role selector
// "Send Invitation" button
```

### **4. TeamMemberRow**
Display team member in table
```tsx
// Avatar, Name, Email, Role badge, Joined date
// Actions: Edit role (admin), Remove (admin)
```

### **5. CreditTransactionRow**
Display credit transaction in history
```tsx
// Date, User avatar, Operation badge, Credits (red if -, green if +), Balance
```

### **6. CreditPurchaseModal**
Admin can purchase credit packages
```tsx
// Package cards (100, 500, 1000, 5000 credits)
// Show discount badges
// "Purchase" → Stripe checkout (Phase 2)
```

---

## 🚀 **Implementation Phases**

### **Phase 1: Foundation (Week 1)**
**Goal:** Database + basic auth working

- [ ] Create database migrations (all new tables)
- [ ] Update existing tables with organization_id
- [ ] Set up Supabase Auth with Google OAuth
- [ ] Create backend auth endpoints
- [ ] Test: User can sign up with Google → creates org

**Deliverable:** User can sign up with Google OAuth and organization is created

---

### **Phase 2: Organization & Team (Week 2)**
**Goal:** Multi-user working

- [ ] Build invitation system (backend)
- [ ] Create invitation email templates
- [ ] Build Organization Settings page
- [ ] Build Team Management page
- [ ] Build Accept Invitation page
- [ ] Add org context to all frontend API calls
- [ ] Test: Admin can invite user → user joins org

**Deliverable:** Full team management working

---

### **Phase 3: Credit System (Week 3)**
**Goal:** Credit tracking working

- [ ] Implement credit check middleware (backend)
- [ ] Add credit deduction to all paid operations
- [ ] Build Credit Dashboard page (admin)
- [ ] Build CreditBadge component (header)
- [ ] Build InsufficientCreditsModal
- [ ] Create credit transaction logging
- [ ] Test: Operations deduct credits correctly

**Deliverable:** Credits are tracked and enforced

---

### **Phase 4: Polish & Testing (Week 4)**
**Goal:** Production-ready

- [ ] Add role-based UI hiding (show/hide based on role)
- [ ] Build credit purchase flow (manual for now)
- [ ] Create admin dashboard with usage stats
- [ ] Add data isolation (ensure users only see their org data)
- [ ] Comprehensive testing (auth, invites, credits)
- [ ] Migration script for existing data

**Deliverable:** Complete org management system

---

### **Phase 5: Stripe Integration (Future)**
**Goal:** Automated payments

- [ ] Integrate Stripe for credit purchases
- [ ] Add subscription plans (optional)
- [ ] Add usage-based billing
- [ ] Build billing history page

---

## 🔒 **Security Considerations**

### **1. Data Isolation**
- ✅ Every query MUST filter by organization_id
- ✅ Row-level security (RLS) policies in Supabase
- ✅ Backend validates user belongs to org before operations

### **2. Role-Based Access Control**
```typescript
// Middleware to check admin role
async function requireAdmin(c: Context, next: Next) {
  const userId = c.get('userId');
  const orgId = c.get('organizationId');
  
  const member = await getOrganizationMember(orgId, userId);
  if (member.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  
  await next();
}

// Usage:
app.post('/invitations', requireAdmin, createInvitation);
```

### **3. Invitation Security**
- ✅ Tokens are UUID v4 (cryptographically secure)
- ✅ Invitations expire after 7 days
- ✅ One-time use (mark as 'accepted')
- ✅ Email verification on acceptance

### **4. Credit Security**
- ✅ Atomic transactions (no race conditions)
- ✅ Balance cannot go negative
- ✅ All transactions logged (audit trail)
- ✅ Only admins can purchase credits

---

## 📊 **Data Migration Plan**

For existing users/data:

```sql
-- Step 1: Create default organization for existing users
INSERT INTO organizations (name, slug, credit_balance)
VALUES ('Default Organization', 'default-org', 1000);

-- Step 2: Add all existing users as admins to default org
INSERT INTO organization_members (organization_id, user_id, role)
SELECT 
  (SELECT id FROM organizations WHERE slug = 'default-org'),
  id,
  'admin'
FROM auth.users;

-- Step 3: Update all existing leads with default org
UPDATE leads 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default-org')
WHERE organization_id IS NULL;

-- Step 4: Make organization_id required after migration
ALTER TABLE leads ALTER COLUMN organization_id SET NOT NULL;
```

---

## 🎯 **Success Metrics**

- [ ] User can sign up with Google OAuth
- [ ] Organization is created automatically on first signup
- [ ] Admin can invite team members
- [ ] Invited users can join via email link
- [ ] Credit balance displays correctly in UI
- [ ] Operations deduct correct credit amounts
- [ ] Insufficient credits blocks operations
- [ ] Admin can view credit transaction history
- [ ] Data is isolated by organization (no cross-org leaks)
- [ ] Role-based UI shows/hides features correctly

---

## 💡 **Future Enhancements**

1. **Multiple Organizations**
   - User can belong to multiple orgs
   - Switch between orgs in UI

2. **Custom Roles**
   - Beyond admin/user
   - Granular permissions (e.g., can enrich but not delete)

3. **SSO Integration**
   - SAML for enterprise customers
   - Okta, Azure AD, etc.

4. **Usage Alerts**
   - Email admin when credits < 100
   - Weekly usage reports

5. **Credit Packages**
   - Subscription plans
   - Auto-recharge when balance low

6. **Audit Logs**
   - Track all admin actions
   - Compliance/security

---

## ✅ **Decision Points**

### **Question 1: Google OAuth Only or Email/Password Too?**

**Recommendation:** Start with Google OAuth + username/password for invited users

**Rationale:**
- Google OAuth: Easier for admins (first signup)
- Username/password: Necessary for invited users who may not have/want Google

---

### **Question 2: Trial Credits on Signup?**

**Recommendation:** Yes, give 100 credits on org creation

**Breakdown:**
- 10 Apollo searches = 100 credits
- OR 20 enrichments = 100 credits
- OR 20 full property analyses = 100 credits

This gives enough to test the product before purchasing.

---

### **Question 3: Stripe Now or Later?**

**Recommendation:** Manual credit purchase first (Phase 3), Stripe later (Phase 5)

**Why:**
- Focus on core functionality first
- Manual allows you to talk to early customers
- Add Stripe when ready to scale

For now, admin can:
1. Click "Purchase Credits"
2. See packages + prices
3. Contact you or enter credit card (Stripe form)
4. You manually add credits via admin panel

---

## 📝 **Next Steps**

1. **Review this plan** - does it match your vision?
2. **Approve approach** - multi-tenant, credit system, roles
3. **Start Phase 1** - database schema + Google OAuth
4. **Iterate** - build, test, refine

**Estimated Timeline:** 4-6 weeks for Phases 1-4

---

**Questions or concerns about this plan?** Let me know and we can refine! 🚀
