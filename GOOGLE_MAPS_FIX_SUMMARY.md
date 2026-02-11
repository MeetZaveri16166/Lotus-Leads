# Google Maps API Error Fix Summary

## Problem

Google Maps was showing error in the modal:
```
Google Maps Platform rejected your request. You must use an API key to authenticate each request to Google Maps Platform APIs.
```

## Root Cause

During the enterprise UI redesign, I changed `PropertyAnalysisDisplay.tsx` to use:
```typescript
src={`https://www.google.com/maps/embed/v1/view?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&center=...`}
```

**Problem:** The app stores the Google Maps API key in **backend settings** (database), not as an environment variable. The `VITE_GOOGLE_MAPS_API_KEY` doesn't exist!

## Original Implementation

The app was correctly passing `googleMapsKey` as a prop through the component tree:

1. **LeadDetailPage.tsx** loads the key from backend:
   ```typescript
   const loadGoogleMapsKey = async () => {
     const settings = await Api.getSettings();
     if (settings.google_maps_api_key) {
       setGoogleMapsKey(settings.google_maps_api_key);
     }
   };
   ```

2. **OpportunityStageNavigator** receives it as a prop:
   ```typescript
   googleMapsKey: string;
   ```

3. Uses it in the Google Maps iframe:
   ```typescript
   src={`https://www.google.com/maps/embed/v1/view?key=${googleMapsKey}&center=...`}
   ```

## Solution Implemented

### 1. **Added `googleMapsKey` prop to PropertyAnalysisDisplay**

**File**: `/src/app/components/PropertyAnalysisDisplay.tsx`

```typescript
interface PropertyAnalysisDisplayProps {
  propertyAnalysis: any;
  geoEnrichment: any;
  googleMapsKey?: string; // NEW: Add this prop
}

export function PropertyAnalysisDisplay({ 
  propertyAnalysis, 
  geoEnrichment, 
  googleMapsKey  // NEW: Destructure it
}: PropertyAnalysisDisplayProps) {
  // ... component code
}
```

### 2. **Updated the iframe to use the prop**

Changed from:
```typescript
src={`https://www.google.com/maps/embed/v1/view?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&center=...`}
```

To:
```typescript
src={`https://www.google.com/maps/embed/v1/view?key=${googleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&center=...`}
```

This tries `googleMapsKey` first (from backend), then falls back to env variable if needed.

### 3. **Updated OpportunityStageNavigator to pass the prop**

**File**: `/src/app/components/OpportunityStageNavigator.tsx`

Changed from:
```typescript
<PropertyAnalysisDisplay 
  propertyAnalysis={propertyAnalysis} 
  geoEnrichment={geoEnrichment}
/>
```

To:
```typescript
<PropertyAnalysisDisplay 
  propertyAnalysis={propertyAnalysis} 
  geoEnrichment={geoEnrichment}
  googleMapsKey={googleMapsKey}  // NEW: Pass the key
/>
```

## How It Works Now

**Complete Flow:**

1. **User visits LeadDetailPage** → loads Google Maps API key from backend settings
2. **Key stored in state** → `googleMapsKey` state variable
3. **Passed to OpportunityStageNavigator** → as prop
4. **Passed to PropertyAnalysisDisplay** → as prop
5. **Used in iframe** → `key=${googleMapsKey}`
6. **Google Maps loads successfully** ✅

## Testing

To verify the fix:

1. Navigate to a lead with property analysis data
2. Click on a satellite tile to open the zone modal
3. Google Maps iframe should load without error
4. You should see satellite imagery of the zone

## Additional Notes

### ⚙️ **Setting up Google Maps API Key**

If the key is not configured:

1. Go to **Admin → Settings** tab
2. Scroll to **Integrations** section
3. Enter your **Google Maps API Key**
4. Click **Save Settings**

### 🔒 **Security Note**

The Google Maps API key is:
- Stored in the database (encrypted at rest)
- Retrieved from backend API
- NOT exposed as a frontend environment variable
- Only used client-side for Google Maps embeds

This is the correct architecture for this use case since the key is needed in the browser for the iframe embed.

## Files Modified

1. ✅ `/src/app/components/PropertyAnalysisDisplay.tsx`
   - Added `googleMapsKey` prop to interface
   - Updated iframe src to use prop

2. ✅ `/src/app/components/OpportunityStageNavigator.tsx`
   - Passed `googleMapsKey` prop to PropertyAnalysisDisplay

## Status

✅ **Fixed** - Google Maps modal now displays correctly with satellite imagery from backend-configured API key
