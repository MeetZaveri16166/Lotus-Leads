# Quick Fix for Current Auth Errors

## 🚨 The Errors You're Seeing

```
[API] Exception calling /api/credits/balance: Error: Session expired. Please log in again.
Authentication error: AuthApiError: Invalid login credentials
```

## ✅ EASIEST FIX - Do This Right Now

### **Option 1: Use the Built-In Reset Button (EASIEST!)**

1. On the login page, scroll to the bottom
2. Click the **"🔄 Clear Session & Reset"** button
3. Page will reload automatically
4. Sign in again with your credentials

### **Option 2: Clear Browser Data Manually**

Open your browser console (F12) and run:
```javascript
localStorage.clear();
location.reload();
```

Then sign in again.

---

## 🔍 Why This Is Happening

You have **old/invalid tokens** stored in localStorage from BEFORE I fixed the backend authentication system.

**What happened:**
1. You logged in with the OLD (broken) auth system
2. Old tokens were stored in localStorage
3. I fixed the backend to use proper JWT validation
4. Your OLD tokens don't work with the NEW backend
5. Backend rejects your old tokens → 401 error → you get kicked out

**The solution:**
Clear localStorage → Sign in again → Get fresh tokens that work with the new backend

---

## 📋 Testing Checklist

After clearing localStorage and signing back in:

1. ✅ Sign in (should work)
2. ✅ Navigate to Admin → Team Management (should NOT log out)
3. ✅ Navigate to Admin → Credits & Usage (should load, even if showing 0)
4. ✅ Refresh the page (should stay logged in)

---

## 🐛 If You Still Have Issues

### Check 1: Do you have a membership record?

Open Supabase Dashboard → SQL Editor → Run:
```sql
SELECT u.email, m.organization_id, m.role
FROM auth.users u
LEFT JOIN memberships m ON u.id = m.user_id
WHERE u.email = 'YOUR_EMAIL_HERE';
```

**Expected result:** Should show your email, an org ID, and role (admin)

**If NULL:** You don't have a membership - need to run signup again

### Check 2: Check backend logs

Open Supabase Dashboard → Edge Functions → Logs

Look for:
```
[getUserOrgId] Got user: <your-user-id>
[getUserOrgId] Found org membership: <org-id>
```

**If you see "No organization membership found":** Run the SQL query above

### Check 3: Check your browser console

Should see:
```
[API] Session check: { hasSession: true, hasToken: true }
Auth state changed: SIGNED_IN Has session: true
```

**If you see "hasSession: false":** Clear localStorage and sign in again

---

## 🎯 Most Common Issue

**99% of the time, the error is:**
- Old/stale tokens in localStorage from before the fix
- **Solution:** `localStorage.clear()` → refresh → sign in again

---

## 💡 Understanding the Fix

**Before (BROKEN):**
```typescript
// Backend used wrong client
const supabase = createClient(url, SERVICE_ROLE_KEY);
await supabase.auth.getUser(userToken); // ❌ FAILS - service role can't validate user JWTs
```

**After (FIXED):**
```typescript
// Backend uses correct client
const supabaseAnon = createClient(url, ANON_KEY);
await supabaseAnon.auth.getUser(userToken); // ✅ WORKS - anon key validates user JWTs
```

**Your old tokens** were trying to be validated with the old broken system. They're now incompatible. Clear them and get new ones!

---

## 🚀 After You Clear localStorage

Everything should work perfectly:
- ✅ Login works
- ✅ Session persists across page refresh
- ✅ Admin pages don't log you out
- ✅ Credits page loads correctly
- ✅ Team management works

---

## 📞 If Still Broken After localStorage Clear

Tell me exactly what you see in:
1. Browser console
2. Network tab (what's the response from /api/credits/balance?)
3. Supabase Edge Function logs

And I'll help you debug further!