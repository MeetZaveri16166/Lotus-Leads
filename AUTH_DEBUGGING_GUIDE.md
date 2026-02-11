# Authentication Debugging Guide

## 🔍 How to Debug Auth Issues in the Future

### **1. Check Browser Console**
Look for these log messages:
```
[API] Session check: { hasSession: true, hasToken: true }
[getUserOrgId] Got user: 12345-uuid
[getUserOrgId] Found org membership: org-67890
```

**Red flags:**
- `No access token provided`
- `Error getting user`
- `No organization membership found`

### **2. Check Backend Logs (Supabase Dashboard)**
Go to: Supabase Dashboard → Edge Functions → Logs

Look for:
```
[getUserOrgId] Got user: 12345-uuid
[getUserOrgId] Found org membership: org-67890
[ADMIN/TEAM] Successfully fetched team members
```

**Red flags:**
- `Error getting user: Invalid JWT`
- `No organization membership found`
- `Unauthorized - no organization`

### **3. Check Network Tab**
Open DevTools → Network → Filter by "make-server"

Look at request headers:
```
Authorization: Bearer eyJhbGci... (should be a LONG JWT token)
```

**Red flags:**
- `Authorization: Bearer undefined`
- `Authorization: Bearer [object Object]`
- Missing Authorization header entirely

### **4. Check localStorage**
Open DevTools → Application → Local Storage

Look for:
```
access_token: "eyJhbGci..." (JWT token)
user_email: "user@example.com"
```

**Red flags:**
- `access_token` is missing
- `access_token` is empty string
- Token looks too short (< 100 characters)

---

## 🚨 Common Auth Errors & Solutions

### **Error: "Unauthorized - no organization"**

**Cause:** User doesn't have a membership record

**Fix:**
1. Check if user signed up correctly
2. For OAuth users, check if they completed org setup
3. Query the `memberships` table manually:
```sql
SELECT * FROM memberships WHERE user_id = 'user-uuid-here';
```

### **Error: "Invalid JWT" or "JWT expired"**

**Cause:** Token is expired or malformed

**Fix:**
1. Check if token exists: `localStorage.getItem('access_token')`
2. Try refreshing session:
```typescript
const { data, error } = await supabase.auth.refreshSession();
```
3. If still fails, sign out and back in

### **Error: "Session expired. Please log in again."**

**Cause:** Token refresh failed

**Fix:**
1. Check Supabase project settings (Auth → Settings)
2. Verify JWT expiry time (default: 3600 seconds = 1 hour)
3. Check if `autoRefreshToken: true` is enabled in client config

### **Error: Getting logged out when navigating**

**Cause:** API endpoint returning 401 due to auth validation failure

**Fix:**
1. Check which endpoint is failing (Network tab)
2. Verify endpoint is using `getUserOrgId()` correctly
3. Make sure endpoint uses `supabaseAnon.auth.getUser()` not `supabase.auth.getUser()`

---

## 🧪 Manual Testing Steps

### **Test 1: Fresh Login**
1. Clear localStorage
2. Clear all cookies
3. Sign in with email/password
4. Check console for: `[API] Session check: { hasSession: true }`
5. Navigate to Admin page
6. Should NOT be logged out

### **Test 2: OAuth Login**
1. Clear localStorage
2. Sign in with Google
3. Complete org setup if prompted
4. Navigate to Admin → Credits
5. Should see credit balance

### **Test 3: Session Persistence**
1. Sign in
2. Refresh page (F5)
3. Should stay logged in
4. Close tab, reopen app
5. Should stay logged in

### **Test 4: Token Refresh**
1. Sign in
2. Wait 1 hour (or change JWT expiry to 1 minute for testing)
3. Make an API call
4. Should auto-refresh token
5. Should NOT be logged out

---

## 🔧 Emergency Fixes

### **"I'm stuck in a login loop!"**

**Quick fix:**
```javascript
// Open browser console and run:
localStorage.clear();
location.reload();
```

Then sign in again.

### **"I can't access the Admin page!"**

**Quick fix:**
1. Check if you're an admin:
```sql
SELECT m.role, u.email 
FROM memberships m
JOIN auth.users u ON m.user_id = u.id
WHERE u.email = 'your-email@example.com';
```

2. If role is 'member', update to 'admin':
```sql
UPDATE memberships 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

### **"getUserOrgId is returning null!"**

**Diagnostic query:**
```sql
-- Check if user exists
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Check if membership exists
SELECT * FROM memberships WHERE user_id = 'user-uuid-from-above';

-- Check if organization exists
SELECT * FROM organizations WHERE id = 'org-id-from-above';
```

---

## 📊 Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  USER SIGNS IN                                                  │
│  - Email/password or Google OAuth                              │
└───────────────────────┬─────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│  SUPABASE AUTH                                                  │
│  - Creates session                                              │
│  - Generates JWT access token                                   │
│  - Returns: { session: { access_token, user: { id, email } } } │
└───────────────────────┬─────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND STORES TOKEN                                          │
│  - localStorage.setItem('access_token', token)                  │
│  - Session persisted in Supabase client                        │
└───────────────────────┬─────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│  USER MAKES API CALL                                            │
│  - GET /admin/team-members                                      │
│  - Headers: { Authorization: 'Bearer JWT_TOKEN' }               │
└───────────────────────┬─────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND VALIDATES                                              │
│  1. Extract token from Authorization header                     │
│  2. supabaseAnon.auth.getUser(token) → validates JWT           │
│  3. supabase.from('memberships').select() → get org_id         │
│  4. Return org-scoped data                                      │
└───────────────────────┬─────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND RECEIVES DATA                                         │
│  - Updates UI                                                   │
│  - User stays logged in                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 What to Check When Something Breaks

**If users can't sign in:**
1. ✅ Check Supabase Auth is enabled
2. ✅ Check email confirmation is disabled (or emails are being sent)
3. ✅ Check OAuth providers are configured
4. ✅ Check redirect URLs are correct

**If users get logged out unexpectedly:**
1. ✅ Check backend endpoints use `supabaseAnon.auth.getUser()`
2. ✅ Check frontend sends correct Authorization header
3. ✅ Check `getUserOrgId()` is not returning null
4. ✅ Check RLS policies don't block service role queries

**If users can't see their team/credits:**
1. ✅ Check membership record exists
2. ✅ Check organization record exists
3. ✅ Check `getUserOrgId()` returns correct org_id
4. ✅ Check backend queries filter by org_id correctly

---

## 💻 Useful SQL Queries for Debugging

### **Check user's auth status:**
```sql
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'user@example.com';
```

### **Check user's organization:**
```sql
SELECT 
  u.email,
  o.name as org_name,
  m.role
FROM auth.users u
JOIN memberships m ON u.id = m.user_id
JOIN organizations o ON m.organization_id = o.id
WHERE u.email = 'user@example.com';
```

### **Check credit balance:**
```sql
SELECT 
  o.name,
  o.credit_balance
FROM organizations o
JOIN memberships m ON o.id = m.organization_id
JOIN auth.users u ON m.user_id = u.id
WHERE u.email = 'user@example.com';
```

### **Check recent credit transactions:**
```sql
SELECT 
  ct.*,
  o.name as org_name
FROM credit_transactions ct
JOIN organizations o ON ct.organization_id = o.id
ORDER BY ct.created_at DESC
LIMIT 20;
```

---

## 🎓 Remember

**Golden Rule:** 
- Frontend uses ANON key + user JWT
- Backend uses ANON key to **validate** JWT, SERVICE ROLE key to **query** database
- NEVER mix them up!

**If you get stuck:**
1. Check browser console logs
2. Check backend logs (Supabase dashboard)
3. Check Network tab (Authorization header)
4. Check localStorage (access_token)
5. Query the database directly (membership exists?)

**Still stuck?**
Read `/AUTHENTICATION_EXPLAINED.md` for the full explanation of how everything works.
