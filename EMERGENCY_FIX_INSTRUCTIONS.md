# 🚨 EMERGENCY FIX - Auth Errors

## You're Seeing These Errors:

```
[API] Exception calling /api/credits/balance: Error: Session expired. Please log in again.
Error loading credits: Error: Session expired. Please log in again.
```

---

## ✅ SOLUTION (3 Easy Steps):

### **Option 1: Use the UI (Easiest)**

Look at the bottom-right corner of your screen. You should see a floating **"🔍 Auth Diagnostics"** panel.

1. Click the **"Clear Session & Reload"** button (red button)
2. Wait for page to reload
3. Sign in again

Done! ✅

---

### **Option 2: Use the Login Page Button**

1. Scroll to the bottom of the login page
2. Click **"🔄 Clear Session & Reset"**
3. Sign in again

Done! ✅

---

### **Option 3: Manual Console Fix**

If the buttons aren't working:

1. Open browser console (F12)
2. Run this:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
3. Sign in again

Done! ✅

---

## 🎯 Why This Works

You have **old/invalid tokens** in localStorage from before I fixed the backend. The backend authentication system changed, so those old tokens don't work anymore.

**Clearing localStorage removes the bad tokens** → **signing in again creates fresh valid tokens** → everything works perfectly!

---

## 🔍 How to Verify It Worked

After signing in again, check the Auth Diagnostic panel (bottom-right). It should show:

✅ **Session Status:** Active  
✅ **Access Token:** Present  
✅ **Token Validation:** Valid

If you see all green checkmarks, you're good to go!

---

## 📊 What Should Work Now

After clearing localStorage and signing back in:

✅ Navigate to Admin → Credits & Usage (no errors!)  
✅ Navigate to Admin → Team Management (no errors!)  
✅ Refresh the page (stays logged in!)  
✅ Credits balance loads correctly  
✅ No more "Session expired" errors  

---

## 🐛 Still Not Working?

If you still see errors after clearing localStorage and signing in:

1. **Check the Auth Diagnostic panel** - what does it say?
2. **Check browser console** - what errors do you see?
3. **Check Supabase Edge Function logs** - are there backend errors?

Tell me what you find and I'll help you debug further!

---

## 💡 Quick Summary

**Problem:** Old tokens don't work with new backend  
**Solution:** Clear localStorage → Sign in again → Get fresh tokens  
**Result:** Everything works! 🎉
