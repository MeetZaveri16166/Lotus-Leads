# 🚀 LotusLeads Organization Management - Step-by-Step Implementation Plan

**Estimated Timeline:** 4-6 weeks (Phases 1-4)

---

## 🎯 **Implementation Philosophy**

1. **Build incrementally** - Each phase delivers working functionality
2. **Test continuously** - Verify each component before moving forward
3. **Backend-first approach** - Database + API before UI
4. **Data integrity is critical** - Ledger-based credits, no race conditions
5. **Security by default** - RLS policies, role checks, org isolation

---

# 📅 **Phase 1: Foundation (Week 1)**

**Goal:** Database schema + basic authentication working

---

## Day 1-2: Database Setup

### Tasks

1. **Create migration file**
   - [ ] Copy SQL from `/docs/01_DATABASE_SCHEMA.sql`
   - [ ] Run migration in Supabase dashboard
   - [ ] Verify all tables created successfully

2. **Test database functions**
   ```sql
   -- Test get_org_credit_balance
   SELECT get_org_credit_balance('test-org-id');
   
   -- Test can_user_perform_operation
   SELECT can_user_perform_operation('user-id', 'org-id', 10);
   ```

3. **Set up RLS policies**
   - [ ] Enable RLS on all tables
   - [ ] Test policies with test data
   - [ ] Verify users can't see other orgs' data

### Deliverables
✅ All tables exist
✅ Helper functions work
✅ RLS policies enforced

---

## Day 3-4: Google OAuth Integration

### Tasks

1. **Configure Supabase Auth**
   - [ ] Enable Google provider in Supabase dashboard
   - [ ] Get Google OAuth credentials (Client ID + Secret)
   - [ ] Configure redirect URLs
   - [ ] Test OAuth flow in Supabase

2. **Create auth endpoints (backend)**
   
   **File:** `/supabase/functions/server/routes/auth.ts`
   
   ```typescript
   import { Hono } from 'npm:hono';
   import { createClient } from 'npm:@supabase/supabase-js';
   
   const auth = new Hono();
   
   // POST /auth/google
   auth.post('/google', async (c) => {
     const { google_token, organization_name, industry } = await c.req.json();
     
     // 1. Verify Google token with Supabase
     const supabase = createClient(
       Deno.env.get('SUPABASE_URL'),
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
     );
     
     const { data: { user }, error } = await supabase.auth.signInWithIdToken({
       provider: 'google',
       token: google_token
     });
     
     if (error) return c.json({ error: 'Invalid Google token' }, 400);
     
     // 2. Check if user already exists
     const existingMember = await supabase
       .from('organization_members')
       .select('organization_id, role')
       .eq('user_id', user.id)
       .single();
     
     if (existingMember.data) {
       // User already has org - just return auth
       const org = await supabase
         .from('organizations')
         .select('*')
         .eq('id', existingMember.data.organization_id)
         .single();
       
       return c.json({
         user,
         organization: org.data,
         membership: existingMember.data,
         access_token: user.access_token
       });
     }
     
     // 3. New user - create organization
     const slug = organization_name.toLowerCase().replace(/\s+/g, '-');
     
     const { data: org, error: orgError } = await supabase
       .from('organizations')
       .insert({
         name: organization_name,
         slug,
         industry,
         subscription_status: 'trial',
         trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
       })
       .select()
       .single();
     
     if (orgError) return c.json({ error: 'Failed to create org' }, 500);
     
     // 4. Add user as admin
     await supabase
       .from('organization_members')
       .insert({
         organization_id: org.id,
         user_id: user.id,
         role: 'admin'
       });
     
     // 5. Create user profile
     await supabase
       .from('user_profiles')
       .insert({
         id: user.id,
         full_name: user.user_metadata.full_name,
         avatar_url: user.user_metadata.avatar_url,
         auth_method: 'google',
         status: 'active'
       });
     
     // 6. Grant trial credits (100)
     const request_id = crypto.randomUUID();
     await supabase
       .from('credit_ledger')
       .insert({
         organization_id: org.id,
         user_id: user.id,
         operation_type: 'credit_grant',
         credits_delta: 100,
         balance_before: 0,
         balance_after: 100,
         request_id
       });
     
     return c.json({
       user,
       organization: { ...org, trial_credits: 100 },
       membership: { role: 'admin' },
       access_token: user.access_token
     }, 201);
   });
   
   export default auth;
   ```

3. **Register auth routes in main server**
   
   **File:** `/supabase/functions/server/index.tsx`
   
   ```typescript
   import auth from './routes/auth.ts';
   
   app.route('/auth', auth);
   ```

4. **Test OAuth flow**
   - [ ] Sign up with Google → creates user + org
   - [ ] Sign in with Google → returns existing user
   - [ ] Verify 100 trial credits granted
   - [ ] Check user is admin role

### Deliverables
✅ Google OAuth working
✅ User + org created on signup
✅ Trial credits granted
✅ Auth tokens returned

---

## Day 5: Email/Password Auth

### Tasks

1. **Create signup endpoint**
   
   **File:** `/supabase/functions/server/routes/auth.ts`
   
   ```typescript
   import { hash } from 'npm:bcrypt';
   
   // POST /auth/signup
   auth.post('/signup', async (c) => {
     const { email, password, full_name, organization_name, industry } = await c.req.json();
     
     // 1. Create Supabase auth user
     const supabase = createClient(
       Deno.env.get('SUPABASE_URL'),
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
     );
     
     const { data: { user }, error } = await supabase.auth.admin.createUser({
       email,
       password,
       email_confirm: true, // Auto-confirm
       user_metadata: { full_name }
     });
     
     if (error) return c.json({ error: error.message }, 400);
     
     // 2. Create organization (same as Google flow)
     const slug = organization_name.toLowerCase().replace(/\s+/g, '-');
     
     const { data: org } = await supabase
       .from('organizations')
       .insert({ name: organization_name, slug, industry, subscription_status: 'trial' })
       .select()
       .single();
     
     // 3. Add as admin
     await supabase.from('organization_members').insert({
       organization_id: org.id,
       user_id: user.id,
       role: 'admin'
     });
     
     // 4. Create profile
     await supabase.from('user_profiles').insert({
       id: user.id,
       full_name,
       auth_method: 'email',
       status: 'active'
     });
     
     // 5. Grant trial credits
     const request_id = crypto.randomUUID();
     await supabase.from('credit_ledger').insert({
       organization_id: org.id,
       user_id: user.id,
       operation_type: 'credit_grant',
       credits_delta: 100,
       balance_before: 0,
       balance_after: 100,
       request_id
     });
     
     // 6. Sign in to get tokens
     const { data: session } = await supabase.auth.signInWithPassword({ email, password });
     
     return c.json({
       user,
       organization: org,
       membership: { role: 'admin' },
       access_token: session.session.access_token,
       refresh_token: session.session.refresh_token
     }, 201);
   });
   ```

2. **Create login endpoint**
   
   ```typescript
   // POST /auth/login
   auth.post('/login', async (c) => {
     const { email, password } = await c.req.json();
     
     const supabase = createClient(
       Deno.env.get('SUPABASE_URL'),
       Deno.env.get('SUPABASE_ANON_KEY')
     );
     
     const { data, error } = await supabase.auth.signInWithPassword({
       email,
       password
     });
     
     if (error) return c.json({ error: 'Invalid credentials' }, 401);
     
     // Get org context
     const { data: membership } = await supabase
       .from('organization_members')
       .select('organization_id, role, organizations(*)')
       .eq('user_id', data.user.id)
       .single();
     
     return c.json({
       user: data.user,
       organization: membership.organizations,
       membership: { role: membership.role },
       access_token: data.session.access_token,
       refresh_token: data.session.refresh_token
     });
   });
   ```

3. **Create /auth/me endpoint**
   
   ```typescript
   // GET /auth/me
   auth.get('/me', async (c) => {
     const token = c.req.header('Authorization')?.split(' ')[1];
     
     const supabase = createClient(
       Deno.env.get('SUPABASE_URL'),
       Deno.env.get('SUPABASE_ANON_KEY')
     );
     
     const { data: { user }, error } = await supabase.auth.getUser(token);
     
     if (error) return c.json({ error: 'Unauthorized' }, 401);
     
     // Get full context
     const { data: membership } = await supabase
       .from('organization_members')
       .select('organization_id, role, monthly_credit_limit, organizations(*)')
       .eq('user_id', user.id)
       .single();
     
     const balance = await supabase.rpc('get_org_credit_balance', {
       org_id: membership.organization_id
     });
     
     const usage = await supabase.rpc('get_user_monthly_usage', {
       p_user_id: user.id
     });
     
     return c.json({
       user,
       organization: {
         ...membership.organizations,
         credit_balance: balance.data
       },
       membership: {
         role: membership.role,
         monthly_credit_limit: membership.monthly_credit_limit,
         current_month_usage: usage.data
       }
     });
   });
   ```

### Deliverables
✅ Email/password signup works
✅ Login returns tokens + org context
✅ /auth/me returns full user context

---

## Day 6-7: Frontend Auth UI

### Tasks

1. **Create auth pages**
   
   **File:** `/src/app/pages/LoginPage.tsx`
   
   ```typescript
   import { useState } from 'react';
   import { useNavigate } from 'react-router';
   import { createClient } from '@supabase/supabase-js';
   import { projectId, publicAnonKey } from '/utils/supabase/info';
   
   export function LoginPage() {
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [loading, setLoading] = useState(false);
     const navigate = useNavigate();
     
     const supabase = createClient(
       `https://${projectId}.supabase.co`,
       publicAnonKey
     );
     
     const handleEmailLogin = async (e: React.FormEvent) => {
       e.preventDefault();
       setLoading(true);
       
       const { data, error } = await supabase.auth.signInWithPassword({
         email,
         password
       });
       
       if (error) {
         alert(error.message);
       } else {
         // Store auth context
         localStorage.setItem('access_token', data.session.access_token);
         navigate('/');
       }
       
       setLoading(false);
     };
     
     const handleGoogleLogin = async () => {
       const { data, error } = await supabase.auth.signInWithOAuth({
         provider: 'google'
       });
       
       if (error) alert(error.message);
     };
     
     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="max-w-md w-full bg-white border-2 border-gray-200 rounded-xl p-8">
           <div className="text-center mb-8">
             <h1 className="text-3xl font-bold text-gray-900 mb-2">🌸 LotusLeads</h1>
             <p className="text-gray-600">Sales Intelligence Platform</p>
           </div>
           
           <button
             onClick={handleGoogleLogin}
             className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-[#E64B8B] transition-colors mb-6"
           >
             <span>🔵</span>
             Sign in with Google
           </button>
           
           <div className="text-center text-gray-500 mb-6">OR</div>
           
           <form onSubmit={handleEmailLogin} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#E64B8B] focus:ring-4 focus:ring-[#E64B8B]/20 outline-none"
                 required
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#E64B8B] focus:ring-4 focus:ring-[#E64B8B]/20 outline-none"
                 required
               />
             </div>
             
             <button
               type="submit"
               disabled={loading}
               className="w-full px-4 py-3 bg-white text-[#E64B8B] border-2 border-[#E64B8B] rounded-lg hover:bg-[#E64B8B] hover:text-white transition-colors font-medium disabled:opacity-50"
             >
               {loading ? 'Signing in...' : 'Sign In →'}
             </button>
           </form>
           
           <p className="text-center text-sm text-gray-600 mt-6">
             Don't have an account?{' '}
             <a href="/signup" className="text-[#E64B8B] hover:underline font-medium">
               Sign Up
             </a>
           </p>
         </div>
       </div>
     );
   }
   ```

2. **Create signup page** (similar structure)

3. **Add auth routes**
   
   **File:** `/src/app/routes.ts`
   
   ```typescript
   import { LoginPage } from './pages/LoginPage';
   import { SignupPage } from './pages/SignupPage';
   
   export const router = createBrowserRouter([
     {
       path: '/login',
       Component: LoginPage
     },
     {
       path: '/signup',
       Component: SignupPage
     },
     // ... existing routes
   ]);
   ```

4. **Create auth context provider**
   
   **File:** `/src/contexts/AuthContext.tsx`
   
   ```typescript
   import { createContext, useContext, useState, useEffect } from 'react';
   
   interface AuthContextType {
     user: any;
     organization: any;
     membership: any;
     loading: boolean;
     signOut: () => void;
   }
   
   const AuthContext = createContext<AuthContextType>(null);
   
   export function AuthProvider({ children }) {
     const [user, setUser] = useState(null);
     const [organization, setOrganization] = useState(null);
     const [membership, setMembership] = useState(null);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       // Load user context on mount
       fetchUserContext();
     }, []);
     
     const fetchUserContext = async () => {
       const token = localStorage.getItem('access_token');
       if (!token) {
         setLoading(false);
         return;
       }
       
       const res = await fetch(
         `https://${projectId}.supabase.co/functions/v1/make-server-2f1627d1/auth/me`,
         {
           headers: { Authorization: `Bearer ${token}` }
         }
       );
       
       if (res.ok) {
         const data = await res.json();
         setUser(data.user);
         setOrganization(data.organization);
         setMembership(data.membership);
       }
       
       setLoading(false);
     };
     
     const signOut = () => {
       localStorage.removeItem('access_token');
       setUser(null);
       setOrganization(null);
       setMembership(null);
     };
     
     return (
       <AuthContext.Provider value={{ user, organization, membership, loading, signOut }}>
         {children}
       </AuthContext.Provider>
     );
   }
   
   export const useAuth = () => useContext(AuthContext);
   ```

5. **Protect routes**
   
   **File:** `/src/app/components/ProtectedRoute.tsx`
   
   ```typescript
   import { Navigate } from 'react-router';
   import { useAuth } from '@/contexts/AuthContext';
   
   export function ProtectedRoute({ children }) {
     const { user, loading } = useAuth();
     
     if (loading) return <div>Loading...</div>;
     if (!user) return <Navigate to="/login" />;
     
     return children;
   }
   ```

### Deliverables
✅ Login page functional
✅ Signup page functional
✅ Auth context provides user/org data
✅ Protected routes redirect to login

---

## Phase 1 Checklist

- [ ] Database schema created
- [ ] Google OAuth working
- [ ] Email/password auth working
- [ ] /auth/me returns context
- [ ] Frontend login/signup pages
- [ ] Auth context provider
- [ ] Protected routes
- [ ] Trial credits granted on signup

**Milestone:** User can sign up and login ✅

---

# 📅 **Phase 2: Team Management (Week 2)**

**Goal:** Invitations, team pages, multi-user support

---

## Day 8-9: Invitation System (Backend)

### Tasks

1. **Create invitation endpoints**
   
   **File:** `/supabase/functions/server/routes/invitations.ts`
   
   ```typescript
   import { Hono } from 'npm:hono';
   
   const invitations = new Hono();
   
   // POST /invitations
   invitations.post('/', async (c) => {
     const { email, role, organization_id } = await c.req.json();
     const userId = c.get('userId'); // From auth middleware
     
     // Check if user is admin
     const supabase = c.get('supabase');
     const { data: member } = await supabase
       .from('organization_members')
       .select('role')
       .eq('user_id', userId)
       .eq('organization_id', organization_id)
       .single();
     
     if (member.role !== 'admin') {
       return c.json({ error: 'Admin access required' }, 403);
     }
     
     // Create invitation
     const token = crypto.randomUUID();
     const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
     
     const { data: invitation, error } = await supabase
       .from('invitations')
       .insert({
         organization_id,
         email,
         role,
         token,
         invited_by: userId,
         expires_at: expiresAt,
         status: 'pending'
       })
       .select()
       .single();
     
     if (error) return c.json({ error: error.message }, 400);
     
     // TODO: Send invitation email
     
     return c.json({
       invitation,
       invite_link: `https://app.lotusleads.com/accept-invite?token=${token}`
     }, 201);
   });
   
   // GET /invitations/:token
   invitations.get('/:token', async (c) => {
     const token = c.req.param('token');
     const supabase = c.get('supabase');
     
     const { data: invitation } = await supabase
       .from('invitations')
       .select('*, organizations(name, logo_url), users:invited_by(full_name)')
       .eq('token', token)
       .eq('status', 'pending')
       .single();
     
     if (!invitation) {
       return c.json({ error: 'Invalid or expired invitation' }, 404);
     }
     
     if (new Date(invitation.expires_at) < new Date()) {
       return c.json({ error: 'Invitation expired' }, 410);
     }
     
     return c.json({
       valid: true,
       invitation
     });
   });
   
   // POST /invitations/:token/accept
   invitations.post('/:token/accept', async (c) => {
     const token = c.req.param('token');
     const { full_name, password } = await c.req.json();
     const supabase = c.get('supabase');
     
     // Get invitation
     const { data: invitation } = await supabase
       .from('invitations')
       .select('*')
       .eq('token', token)
       .eq('status', 'pending')
       .single();
     
     if (!invitation) return c.json({ error: 'Invalid invitation' }, 404);
     
     // Create user
     const { data: { user }, error } = await supabase.auth.admin.createUser({
       email: invitation.email,
       password,
       email_confirm: true,
       user_metadata: { full_name }
     });
     
     if (error) return c.json({ error: error.message }, 400);
     
     // Create profile
     await supabase.from('user_profiles').insert({
       id: user.id,
       full_name,
       auth_method: 'invited',
       status: 'active',
       password_reset_required: true
     });
     
     // Add to organization
     await supabase.from('organization_members').insert({
       organization_id: invitation.organization_id,
       user_id: user.id,
       role: invitation.role,
       invited_by: invitation.invited_by
     });
     
     // Mark invitation accepted
     await supabase
       .from('invitations')
       .update({
         status: 'accepted',
         accepted_at: new Date(),
         accepted_by: user.id
       })
       .eq('id', invitation.id);
     
     // Sign in
     const { data: session } = await supabase.auth.signInWithPassword({
       email: invitation.email,
       password
     });
     
     return c.json({
       user,
       access_token: session.session.access_token
     });
   });
   
   export default invitations;
   ```

2. **Register routes**

3. **Test invitation flow**
   - [ ] Create invitation → returns token
   - [ ] Validate token → returns org info
   - [ ] Accept invitation → creates user + adds to org

### Deliverables
✅ Invitation endpoints working
✅ Token validation working
✅ User can accept invite

---

## Day 10-11: Team Management UI

### Tasks

1. **Create Team Management page**
   
   **File:** `/src/app/pages/TeamManagementPage.tsx`
   
   (Implementation based on wireframe #6)

2. **Create Invite User Modal**
   
   **File:** `/src/app/components/InviteUserModal.tsx`

3. **Create Team Member Card**
   
   **File:** `/src/app/components/TeamMemberCard.tsx`

4. **Test full flow**
   - [ ] Admin can open modal
   - [ ] Admin can invite user
   - [ ] Invitation appears in pending list
   - [ ] Admin can resend/cancel

### Deliverables
✅ Team page shows members
✅ Invite modal works
✅ Pending invitations displayed

---

## Day 12-13: Accept Invitation Page

### Tasks

1. **Create Accept Invite page**
   
   **File:** `/src/app/pages/AcceptInvitePage.tsx`
   
   (Implementation based on wireframe #11)

2. **Test acceptance flow**
   - [ ] User clicks invite link
   - [ ] Page shows org info
   - [ ] User enters name + password
   - [ ] User joins org successfully
   - [ ] Redirects to dashboard

### Deliverables
✅ Accept invite page functional
✅ User can join organization
✅ Redirects after success

---

## Day 14: Organization Settings

### Tasks

1. **Create Organization Settings page**
   
   **File:** `/src/app/pages/OrganizationSettingsPage.tsx`
   
   (Based on wireframe #5)

2. **Add admin check to routes**

3. **Test**
   - [ ] Admin can update org name
   - [ ] Admin can update API keys
   - [ ] User cannot access page

### Deliverables
✅ Org settings page functional
✅ Admin-only access enforced

---

## Phase 2 Checklist

- [ ] Invitation system working
- [ ] Team management page
- [ ] Invite user modal
- [ ] Accept invite page
- [ ] Organization settings page
- [ ] Admin-only routes protected

**Milestone:** Admin can invite users, users can join ✅

---

# 📅 **Phase 3: Credit System (Week 3)**

**Goal:** Credits deducted, tracked, enforced

---

## Day 15-16: Credit Check Middleware

### Tasks

1. **Create credit service**
   
   **File:** `/supabase/functions/server/services/credits.ts`
   
   ```typescript
   export const CREDIT_COSTS = {
     apollo_search: 10,
     apollo_enrich: 5,
     geo_enrichment: 1,
     property_analysis: 2,
     service_mapping: 2
   };
   
   export async function checkAndDeductCredits(
     supabase: any,
     organizationId: string,
     userId: string,
     operationType: string,
     requestId: string,
     leadId?: string
   ) {
     const cost = CREDIT_COSTS[operationType];
     
     // Check if user can perform
     const { data: canPerform } = await supabase.rpc('can_user_perform_operation', {
       p_user_id: userId,
       p_org_id: organizationId,
       p_credits_required: cost
     });
     
     if (!canPerform) {
       throw new Error('Insufficient credits');
     }
     
     // Get current balance
     const { data: balance } = await supabase.rpc('get_org_credit_balance', {
       org_id: organizationId
     });
     
     // Deduct credits
     await supabase.from('credit_ledger').insert({
       organization_id: organizationId,
       user_id: userId,
       operation_type: operationType,
       credits_delta: -cost,
       balance_before: balance,
       balance_after: balance - cost,
       request_id: requestId,
       lead_id: leadId
     });
     
     return balance - cost;
   }
   ```

2. **Update lead endpoints**
   
   **File:** `/supabase/functions/server/routes/leads.ts`
   
   ```typescript
   import { checkAndDeductCredits } from '../services/credits.ts';
   
   // POST /leads/search
   leads.post('/search', async (c) => {
     const userId = c.get('userId');
     const orgId = c.get('organizationId');
     const requestId = crypto.randomUUID();
     const body = await c.req.json();
     
     // Check and deduct credits BEFORE operation
     try {
       const newBalance = await checkAndDeductCredits(
         c.get('supabase'),
         orgId,
         userId,
         'apollo_search',
         requestId
       );
       
       // Perform Apollo search
       const results = await performApolloSearch(body);
       
       return c.json({
         leads: results,
         credits_used: 10,
         remaining_balance: newBalance
       });
       
     } catch (error) {
       if (error.message === 'Insufficient credits') {
         return c.json({
           error: 'insufficient_credits',
           message: 'Your organization does not have enough credits'
         }, 402);
       }
       throw error;
     }
   });
   ```

3. **Update ALL paid endpoints**
   - [ ] /leads/search
   - [ ] /leads/:id/enrich
   - [ ] /leads/:id/geo-enrichment
   - [ ] /leads/:id/property-analysis
   - [ ] /leads/:id/service-mapping

### Deliverables
✅ Credit check before operations
✅ Credits deducted to ledger
✅ 402 error if insufficient

---

## Day 17-18: Credit Dashboard UI

### Tasks

1. **Create Credit Dashboard page**
   
   **File:** `/src/app/pages/CreditDashboardPage.tsx`
   
   (Based on wireframe #8)

2. **Create stat cards**

3. **Create usage chart** (use recharts)

4. **Create top users list**

5. **Test**
   - [ ] Balance displays correctly
   - [ ] Chart shows operation breakdown
   - [ ] Top users ranked by usage

### Deliverables
✅ Credit dashboard displays stats
✅ Usage breakdown chart
✅ Top users list

---

## Day 19: Transaction History

### Tasks

1. **Create Transaction History page**
   
   **File:** `/src/app/pages/TransactionHistoryPage.tsx`
   
   (Based on wireframe #9)

2. **Create filters**

3. **Test**
   - [ ] Shows all transactions for admin
   - [ ] Shows only own transactions for user
   - [ ] Filters work correctly

### Deliverables
✅ Transaction history displays
✅ Filters functional
✅ Pagination works

---

## Day 20-21: Credit Badge & Insufficient Modal

### Tasks

1. **Add credit badge to header**
   
   **File:** `/src/app/components/AppShell.tsx`
   
   ```typescript
   <div className="flex items-center gap-4">
     <CreditBadge balance={organization.credit_balance} />
     <UserMenu />
   </div>
   ```

2. **Create CreditBadge component**
   
   **File:** `/src/app/components/CreditBadge.tsx`
   
   ```typescript
   export function CreditBadge({ balance }: { balance: number }) {
     const color = balance > 500 ? 'green' : balance > 100 ? 'yellow' : 'red';
     
     return (
       <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 
         ${color === 'green' ? 'border-green-300 text-green-700' :
           color === 'yellow' ? 'border-yellow-300 text-yellow-700' :
           'border-red-300 text-red-700'}`}
       >
         <span>💎</span>
         <span className="font-semibold">{balance.toLocaleString()}</span>
       </div>
     );
   }
   ```

3. **Create InsufficientCreditsModal**
   
   **File:** `/src/app/components/InsufficientCreditsModal.tsx`
   
   (Based on wireframe #12)

4. **Show modal on 402 error**

### Deliverables
✅ Credit badge in header
✅ Color-coded by balance
✅ Insufficient modal shows on error

---

## Phase 3 Checklist

- [ ] Credit check middleware
- [ ] All operations deduct credits
- [ ] Credit dashboard page
- [ ] Transaction history page
- [ ] Credit badge in header
- [ ] Insufficient credits modal

**Milestone:** Credits enforced and tracked ✅

---

# 📅 **Phase 4: Polish & Testing (Week 4)**

**Goal:** Production-ready, secure, tested

---

## Day 22-23: Role-Based UI

### Tasks

1. **Hide admin features from users**
   
   ```typescript
   const { membership } = useAuth();
   const isAdmin = membership?.role === 'admin';
   
   {isAdmin && <Link to="/settings/team">Team Management</Link>}
   {isAdmin && <Link to="/settings/credits">Credits</Link>}
   ```

2. **Update navigation**

3. **Test with both roles**
   - [ ] Admin sees all features
   - [ ] User sees limited features

### Deliverables
✅ Admin-only UI hidden from users
✅ Navigation reflects role

---

## Day 24-25: Data Isolation Testing

### Tasks

1. **Create test organizations**
   - Org A with 2 users
   - Org B with 2 users

2. **Test isolation**
   - [ ] User A cannot see Org B's leads
   - [ ] User A cannot see Org B's transactions
   - [ ] User A cannot see Org B's team members

3. **Fix any leaks**

### Deliverables
✅ Complete data isolation verified
✅ No cross-org data access

---

## Day 26: Purchase Credits Flow

### Tasks

1. **Create purchase endpoint (manual for now)**
   
   ```typescript
   // POST /credits/purchase
   credits.post('/purchase', async (c) => {
     const { amount } = await c.req.json();
     const userId = c.get('userId');
     const orgId = c.get('organizationId');
     
     // Check admin
     // ...
     
     // For now, just add credits (later: Stripe)
     const balance = await getOrgCreditBalance(orgId);
     const requestId = crypto.randomUUID();
     
     await supabase.from('credit_ledger').insert({
       organization_id: orgId,
       user_id: userId,
       operation_type: 'credit_purchase',
       credits_delta: amount,
       balance_before: balance,
       balance_after: balance + amount,
       request_id: requestId,
       metadata: { manual_purchase: true }
     });
     
     return c.json({ success: true, new_balance: balance + amount });
   });
   ```

2. **Create Purchase Modal** (wireframe #10)

3. **Test**
   - [ ] Admin can select package
   - [ ] Credits added to balance
   - [ ] Transaction logged

### Deliverables
✅ Manual purchase flow working
✅ Admin can add credits
✅ Transaction recorded

---

## Day 27: Migration Script

### Tasks

1. **Create migration for existing data**
   
   ```sql
   -- Create default org for existing users
   INSERT INTO organizations (name, slug, credit_balance)
   VALUES ('Default Organization', 'default-org', 1000);
   
   -- Add existing users as admins
   INSERT INTO organization_members (organization_id, user_id, role)
   SELECT 
     (SELECT id FROM organizations WHERE slug = 'default-org'),
     id,
     'admin'
   FROM auth.users;
   
   -- Update existing leads
   UPDATE leads 
   SET organization_id = (SELECT id FROM organizations WHERE slug = 'default-org')
   WHERE organization_id IS NULL;
   ```

2. **Test migration**

3. **Document rollback plan**

### Deliverables
✅ Migration script tested
✅ Existing data migrated
✅ Rollback documented

---

## Day 28: End-to-End Testing

### Tasks

1. **Test complete flows**
   
   **Scenario 1: New Organization**
   - [ ] Sign up with Google
   - [ ] Org created
   - [ ] 100 trial credits granted
   - [ ] User is admin
   
   **Scenario 2: Invite User**
   - [ ] Admin invites user
   - [ ] Email sent
   - [ ] User accepts
   - [ ] User joins org
   - [ ] User can use product
   
   **Scenario 3: Credit Usage**
   - [ ] Perform Apollo search
   - [ ] 10 credits deducted
   - [ ] Transaction logged
   - [ ] Balance updated
   - [ ] User sees updated balance
   
   **Scenario 4: Insufficient Credits**
   - [ ] Set balance to 5
   - [ ] Try Apollo search (10 credits)
   - [ ] Modal shows error
   - [ ] Operation blocked
   
   **Scenario 5: Purchase Credits**
   - [ ] Admin purchases 500 credits
   - [ ] Balance increases
   - [ ] Transaction logged

2. **Performance testing**
   - [ ] Ledger queries are fast
   - [ ] No N+1 queries
   - [ ] Page load < 2s

3. **Security testing**
   - [ ] RLS policies enforced
   - [ ] Admin routes protected
   - [ ] API keys not leaked to frontend

### Deliverables
✅ All scenarios pass
✅ Performance acceptable
✅ Security verified

---

## Phase 4 Checklist

- [ ] Role-based UI working
- [ ] Data isolation verified
- [ ] Purchase flow functional
- [ ] Migration script ready
- [ ] End-to-end tests pass
- [ ] Performance tested
- [ ] Security audited

**Milestone:** Production-ready system ✅

---

# 🎉 **Final Deliverables**

After completing all 4 phases, you will have:

✅ **Multi-tenant architecture**
- Organizations with team members
- Role-based access (admin/user)
- Complete data isolation

✅ **Authentication**
- Google OAuth
- Email/password
- Invitation system

✅ **Credit System**
- Ledger-based tracking
- Usage limits per user
- Real-time balance updates
- Transaction history

✅ **UI Pages**
- Login/Signup
- Organization Settings
- Team Management
- Credit Dashboard
- Transaction History
- Accept Invitation

✅ **Security**
- RLS policies
- Role checks
- Org-scoped queries

✅ **Performance**
- Optimized queries
- Materialized views
- Indexed tables

---

# 🚀 **Next Steps (Phase 5 - Future)**

1. **Stripe Integration**
   - Automated payments
   - Subscription plans
   - Invoices

2. **Usage Analytics**
   - Revenue correlation
   - Win rate by usage
   - Cost per deal

3. **Advanced Features**
   - SSO (SAML)
   - Custom roles
   - Audit logs
   - Usage alerts

---

**Ready to start Phase 1?** 🎯

Let me know and I'll help you implement each step!
