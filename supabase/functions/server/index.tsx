import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { performRealResearch } from "./real_research.tsx";
import { searchCompetitors } from "./competitor_search.tsx";
import { formatCompetitorForPrompt, buildCompetitorInstructions } from "./prompt_helpers.tsx";
import { analyzeTargetSocialPresence } from "./social_intelligence.tsx";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// Mock workspace ID for development
const WORKSPACE_ID = "default-workspace-123";
const MOCK_ORG_ID = "00000000-0000-0000-0000-000000000001"; // Skip all auth - use hardcoded org (valid UUID format)

// Supabase clients:
// 1. Service role client - for database operations (bypasses RLS)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ===== CREDIT TRACKING SYSTEM =====

// Credit costs for different API operations
const CREDIT_COSTS = {
  APOLLO_DISCOVERY: 10,
  APOLLO_ENRICHMENT: 5,
  PERPLEXITY_RESEARCH: 15,
  PERPLEXITY_SOCIAL_INTEL: 20, // 4 platform searches + AI synthesis
  GOOGLE_MAPS_GEOCODING: 3,
  GOOGLE_MAPS_SATELLITE: 5,
  OPENAI_VISION: 8,
};

// Helper to deduct credits from organization balance
// Note: Credits disabled since we removed auth - always returns success for development
async function deductCredits(
  orgId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  console.log(`[CREDITS] Skipping credit deduction (auth disabled): ${amount} credits for ${description}`);
  return { success: true, newBalance: 999999 };
}

// Helper to get user's organization ID - ALWAYS returns mock org (auth disabled)
async function getUserOrgId(accessToken: string | undefined): Promise<string | null> {
  return MOCK_ORG_ID;
}

// Helper to generate IDs
function generateId() {
  return crypto.randomUUID();
}

// Helper to generate slug from organization name
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .substring(0, 40);         // Limit length to leave room for suffix
  
  // Add random 6-character suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

// Helper to determine if property requires area analysis (multiple tiles)
// Uses BOTH property type AND business name heuristics
function isLargeProperty(propertyType: string, businessName: string = "", types: string[] = []): boolean {
  // Explicit large property types
  const largePropertyTypes = [
    "golf_course",
    "park",
    "educational",
    "healthcare",
    "shopping_center",
    "shopping_mall"
  ];
  
  if (largePropertyTypes.includes(propertyType)) {
    return true;
  }
  
  // Name-based detection (case-insensitive)
  const nameLower = businessName.toLowerCase();
  const largePropertyKeywords = [
    "golf", "country club", "golf club", "golf course",
    "university", "college", "campus",
    "hospital", "medical center", "health system",
    "park district", "recreation center",
    "shopping center", "mall", "plaza",
    "athletic club", "sports complex", "stadium"
  ];
  
  for (const keyword of largePropertyKeywords) {
    if (nameLower.includes(keyword)) {
      console.log(`[LARGE PROPERTY DETECTION] Name contains "${keyword}" - using area analysis`);
      return true;
    }
  }
  
  // Type-based detection (check all Google Places types)
  const largePropertyTypeKeywords = [
    "golf_course", "park", "university", "school", "hospital",
    "shopping_mall", "shopping_center", "stadium", "museum"
  ];
  
  for (const type of types) {
    if (largePropertyTypeKeywords.includes(type)) {
      console.log(`[LARGE PROPERTY DETECTION] Type contains "${type}" - using area analysis`);
      return true;
    }
  }
  
  // Default: if we're unsure and it's not clearly small (restaurant, store), use multi-tile
  // This is SAFER - better to over-analyze than miss a large property
  const definitelySmallTypes = [
    "restaurant", "cafe", "store", "retail", "bakery", "bar"
  ];
  
  const isDefinitelySmall = definitelySmallTypes.some(t => 
    propertyType.includes(t) || types.includes(t) || nameLower.includes(t)
  );
  
  if (!isDefinitelySmall) {
    console.log(`[LARGE PROPERTY DETECTION] Ambiguous case - defaulting to area analysis for safety`);
    return true;
  }
  
  return false;
}

// Helper to generate grid of satellite image URLs covering a bounding box
function generateSatelliteGrid(
  centerLat: number,
  centerLng: number,
  propertyType: string,
  googleMapsKey: string,
  businessName: string = ""
): { urls: string[]; gridSize: string } {
  // Determine grid size based on property type
  const gridConfig: Record<string, { rows: number; cols: number; offsetDegrees: number }> = {
    golf_course: { rows: 3, cols: 3, offsetDegrees: 0.004 }, // ~9 tiles, large area
    park: { rows: 2, cols: 2, offsetDegrees: 0.003 }, // ~4 tiles, medium-large
    educational: { rows: 2, cols: 2, offsetDegrees: 0.003 },
    healthcare: { rows: 2, cols: 2, offsetDegrees: 0.003 },
    shopping_center: { rows: 2, cols: 2, offsetDegrees: 0.002 },
    office: { rows: 2, cols: 2, offsetDegrees: 0.002 }
  };
  
  // Smart default for large properties with unknown type
  let config = gridConfig[propertyType];
  
  if (!config) {
    // Check if business name suggests a specific large property type
    const nameLower = businessName.toLowerCase();
    if (nameLower.includes("golf") || nameLower.includes("country club") || nameLower.includes("golf club") || 
        nameLower.includes(" club") || nameLower.includes("athletic club")) {
      config = { rows: 3, cols: 3, offsetDegrees: 0.004 }; // Golf course grid
      console.log(`[GRID GENERATION] Business name suggests golf/country club - using 3x3 grid`);
    } else if (nameLower.includes("university") || nameLower.includes("campus") || nameLower.includes("college")) {
      config = { rows: 2, cols: 2, offsetDegrees: 0.003 }; // Campus grid
      console.log(`[GRID GENERATION] Business name suggests campus - using 2x2 grid`);
    } else if (nameLower.includes("hospital") || nameLower.includes("medical center")) {
      config = { rows: 2, cols: 2, offsetDegrees: 0.003 }; // Hospital campus grid
      console.log(`[GRID GENERATION] Business name suggests hospital - using 2x2 grid`);
    } else {
      // Default for unknown large properties: 2x2 grid
      config = { rows: 2, cols: 2, offsetDegrees: 0.003 };
      console.log(`[GRID GENERATION] Unknown large property type - using default 2x2 grid`);
    }
  }
  
  const { rows, cols, offsetDegrees } = config;
  
  const imageUrls: string[] = [];
  const zoom = 18;
  const size = "400x400";
  
  // Generate grid of coordinates
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Calculate offset from center
      const latOffset = (row - (rows - 1) / 2) * offsetDegrees;
      const lngOffset = (col - (cols - 1) / 2) * offsetDegrees;
      
      const tileLat = centerLat + latOffset;
      const tileLng = centerLng + lngOffset;
      
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${tileLat},${tileLng}&zoom=${zoom}&size=${size}&maptype=satellite&key=${googleMapsKey}`;
      imageUrls.push(url);
      console.log(`[GRID GENERATION] Tile ${row * cols + col + 1} URL: ${url.replace(googleMapsKey, 'REDACTED')}`);
    }
  }
  
  return {
    urls: imageUrls,
    gridSize: `${rows}x${cols}`
  };
}

// Helper: Get directional tag for a tile in a grid
function getDirectionalTag(row: number, col: number, rows: number, cols: number): string {
  // Single tile = Center
  if (rows === 1 && cols === 1) return "C";
  
  // 2x2 grid: NW, NE, SW, SE
  if (rows === 2 && cols === 2) {
    if (row === 0 && col === 0) return "NW";
    if (row === 0 && col === 1) return "NE";
    if (row === 1 && col === 0) return "SW";
    if (row === 1 && col === 1) return "SE";
  }
  
  // 3x3 grid: NW, N, NE, W, C, E, SW, S, SE
  if (rows === 3 && cols === 3) {
    if (row === 0 && col === 0) return "NW";
    if (row === 0 && col === 1) return "N";
    if (row === 0 && col === 2) return "NE";
    if (row === 1 && col === 0) return "W";
    if (row === 1 && col === 1) return "C";
    if (row === 1 && col === 2) return "E";
    if (row === 2 && col === 0) return "SW";
    if (row === 2 && col === 1) return "S";
    if (row === 2 && col === 2) return "SE";
  }
  
  // Fallback
  return `R${row}C${col}`;
}

// NEW: Generate satellite grid based on AI recommendation
function generateIntelligentSatelliteGrid(
  centerLat: number,
  centerLng: number,
  captureMode: string,
  zoomLevel: number,
  googleMapsKey: string
): { urls: string[]; gridSize: string; zoom: number; tiles: Array<{ url: string; tag: string; lat: number; lng: number }> } {
  // UPDATED: Capped at 3x3 maximum (9 tiles) - removed 4x4 and 5x5 options
  const strategyConfig: Record<string, { rows: number; cols: number; offsetDegrees: number }> = {
    single_point: { rows: 1, cols: 1, offsetDegrees: 0 },
    focused_2x2: { rows: 2, cols: 2, offsetDegrees: 0.002 },
    standard_3x3: { rows: 3, cols: 3, offsetDegrees: 0.003 }
  };
  
  const config = strategyConfig[captureMode] || strategyConfig.single_point;
  const { rows, cols, offsetDegrees } = config;
  
  const imageUrls: string[] = [];
  const tiles: Array<{ url: string; tag: string; lat: number; lng: number }> = [];
  const size = "400x400";
  
  console.log(`[INTELLIGENT GRID] Generating ${rows}x${cols} grid at zoom ${zoomLevel}`);
  
  // Generate grid of coordinates
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Calculate offset from center
      const latOffset = (row - (rows - 1) / 2) * offsetDegrees;
      const lngOffset = (col - (cols - 1) / 2) * offsetDegrees;
      
      const tileLat = centerLat + latOffset;
      const tileLng = centerLng + lngOffset;
      
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${tileLat},${tileLng}&zoom=${zoomLevel}&size=${size}&maptype=satellite&key=${googleMapsKey}`;
      const tag = getDirectionalTag(row, col, rows, cols);
      
      imageUrls.push(url);
      tiles.push({ url, tag, lat: tileLat, lng: tileLng });
      
      console.log(`[INTELLIGENT GRID] Tile ${row * cols + col + 1} (${tag}): ${tileLat.toFixed(6)}, ${tileLng.toFixed(6)}`);
    }
  }
  
  return {
    urls: imageUrls,
    gridSize: `${rows}x${cols}`,
    zoom: zoomLevel,
    tiles
  };
}

// Helper to query OpenAI for Apollo API research
async function researchApolloAPI(openaiApiKey: string, question: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert on Apollo.io's API. Provide accurate, specific endpoint information with exact URLs, parameter names, and example request bodies. Focus on PAID account functionality for revealing contact data."
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.1,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error("[OPENAI RESEARCH] Error:", error);
      return null;
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("[OPENAI RESEARCH] Exception:", error);
    return null;
  }
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint  
app.get("/make-server-2f1627d1/health", (c) => {
  return c.json({ 
    status: "ok", 
    version: "1.0.1",
    timestamp: new Date().toISOString(),
    fixed: "duplicate_state_variable"
  });
});

// Debug endpoint to check auth
app.get("/make-server-2f1627d1/debug/auth", async (c) => {
  const authHeader = c.req.header("Authorization");
  const accessToken = authHeader?.split(" ")[1];
  
  console.log('[DEBUG/AUTH] ========== AUTH DEBUG ==========');
  console.log('[DEBUG/AUTH] Auth header present:', !!authHeader);
  console.log('[DEBUG/AUTH] Token:', accessToken?.substring(0, 30));
  
  if (!accessToken) {
    return c.json({ error: "No token provided", hasAuthHeader: !!authHeader });
  }
  
  try {
    // Try to get user with anon client
    const { data: { user }, error } = await supabaseAnon.auth.getUser(accessToken);
    
    console.log('[DEBUG/AUTH] User lookup result:', { userId: user?.id, error: error?.message });
    
    if (error || !user) {
      return c.json({ 
        error: "Token validation failed", 
        message: error?.message,
        tokenPrefix: accessToken?.substring(0, 30)
      });
    }
    
    // Try to get membership
    const { data: memberships, error: membershipError } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", user.id);
    
    console.log('[DEBUG/AUTH] Membership lookup:', { 
      found: memberships?.length || 0, 
      error: membershipError?.message,
      memberships 
    });

    // Get organization if membership exists
    let organization = null;
    if (memberships && memberships.length > 0) {
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", memberships[0].organization_id)
        .single();
      organization = org;
    }

    // Count total memberships
    const { count } = await supabase
      .from("memberships")
      .select("*", { count: 'exact', head: true });
    
    console.log('[DEBUG/AUTH] ==========================================');
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      memberships: memberships || [],
      organization: organization,
      totalMembershipsInDB: count,
      membershipError: membershipError?.message || null,
    });
  } catch (error: any) {
    console.error('[DEBUG/AUTH] Exception:', error);
    return c.json({ error: "Exception", message: error.message }, 500);
  }
});

// ===== AUTHENTICATION =====

// Sign up new admin user and create organization
app.post("/make-server-2f1627d1/signup", async (c) => {
  try {
    const { email, password, name, organizationName } = await c.req.json();

    if (!email || !password || !name || !organizationName) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log(`[SIGNUP] ========== STARTING SIGNUP ==========`);
    console.log(`[SIGNUP] Email: ${email}`);
    console.log(`[SIGNUP] Name: ${name}`);
    console.log(`[SIGNUP] Org Name: ${organizationName}`);

    // Create user with Supabase Auth (admin API to auto-confirm email)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (userError) {
      console.error("[SIGNUP] ❌ User creation FAILED:", userError);
      return c.json({ error: userError.message }, 400);
    }

    if (!userData.user) {
      console.error("[SIGNUP] ❌ User creation returned no user");
      return c.json({ error: "User creation failed" }, 500);
    }

    const userId = userData.user.id;
    console.log(`[SIGNUP] ✅ User created successfully with ID: ${userId}`);

    // Create organization
    const orgId = generateId();
    const orgSlug = generateSlug(organizationName);
    const { error: orgError } = await supabase
      .from("organizations")
      .insert({
        id: orgId,
        name: organizationName,
        slug: orgSlug,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (orgError) {
      console.error("[SIGNUP] Organization creation error:", orgError);
      // Clean up user if org creation fails
      await supabase.auth.admin.deleteUser(userId);
      return c.json({ 
        error: "Failed to create organization", 
        details: orgError.message,
        code: orgError.code,
        hint: orgError.hint
      }, 500);
    }

    console.log(`[SIGNUP] Organization created with ID: ${orgId}`);

    // Create membership (user is admin)
    const membershipId = generateId();
    console.log(`[SIGNUP] Creating membership ${membershipId} for user ${userId} in org ${orgId}`);
    const { data: membershipData, error: memberError } = await supabase
      .from("memberships")
      .insert({
        id: membershipId,
        user_id: userId,
        organization_id: orgId,
        role: "admin",
        created_at: new Date().toISOString(),
      })
      .select();

    if (memberError) {
      console.error("[SIGNUP] ❌ Membership creation FAILED:", memberError);
      console.error("[SIGNUP] Error details:", JSON.stringify(memberError, null, 2));
      console.error("[SIGNUP] Attempted values:", { membershipId, userId, orgId });
      return c.json({ 
        error: "Failed to create membership",
        details: memberError.message,
        code: memberError.code,
        hint: memberError.hint,
        userId,
        orgId
      }, 500);
    }

    console.log(`[SIGNUP] ✅ Membership created successfully:`, membershipData);

    // Create organization wallet with starting credits
    console.log(`[SIGNUP] Creating wallet for org ${orgId}`);
    const { data: walletData, error: walletError } = await supabase
      .from("organization_wallets")
      .insert({
        organization_id: orgId,
        balance: 100000, // 100,000 starting credits
      })
      .select();

    if (walletError) {
      console.error("[SIGNUP] Wallet creation error:", walletError);
      console.error("[SIGNUP] Wallet error details:", JSON.stringify(walletError, null, 2));
      return c.json({ 
        error: "Failed to create wallet",
        details: walletError.message,
        code: walletError.code,
        hint: walletError.hint
      }, 500);
    }

    console.log(`[SIGNUP] Wallet created successfully:`, walletData);

    // Create billing account (optional, simplified)
    const { error: billingError } = await supabase
      .from("billing_accounts")
      .insert({
        id: generateId(),
        organization_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (billingError) {
      console.error("[SIGNUP] Billing account creation error:", billingError);
      console.error("[SIGNUP] This is non-critical, continuing...");
    }

    console.log(`[SIGNUP] ========== SIGNUP COMPLETE ==========`);
    console.log(`[SIGNUP] ✅ User: ${email} (${userId})`);
    console.log(`[SIGNUP] ✅ Org: ${organizationName} (${orgId})`);
    console.log(`[SIGNUP] ✅ Membership: ${membershipId}`);
    console.log(`[SIGNUP] ==========================================`);

    return c.json({
      success: true,
      userId,
      organizationId: orgId,
      membershipId,
      message: "Account created successfully",
    });
  } catch (error: any) {
    console.error("[SIGNUP] Unexpected error during signup:", error);
    return c.json({ error: error.message || "Signup failed" }, 500);
  }
});

// Check if user has an organization (for OAuth users)
app.post("/make-server-2f1627d1/check-user-org", async (c) => {
  try {
    const { userId } = await c.req.json();

    if (!userId) {
      return c.json({ error: "Missing userId" }, 400);
    }

    // Check if user has a membership
    const { data: membership, error } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    return c.json({
      hasOrganization: !!membership && !error,
    });
  } catch (error: any) {
    console.error("[CHECK-USER-ORG] Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Setup organization for OAuth user (Google, etc.)
app.post("/make-server-2f1627d1/setup-oauth-org", async (c) => {
  try {
    const { userId, email, name, organizationName, companyName, industry, services, skip } = await c.req.json();

    if (!userId || !email || !organizationName) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log(`[OAUTH-ORG-SETUP] Setting up org for OAuth user: ${email}, Org: ${organizationName}`);

    // Create organization
    const orgId = generateId();
    const orgSlug = generateSlug(organizationName);
    const { error: orgError } = await supabase
      .from("organizations")
      .insert({
        id: orgId,
        name: organizationName,
        slug: orgSlug,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (orgError) {
      console.error("[OAUTH-ORG-SETUP] Organization creation error:", orgError);
      return c.json({ error: "Failed to create organization" }, 500);
    }

    console.log(`[OAUTH-ORG-SETUP] Organization created with ID: ${orgId}`);

    // Create membership (user is admin)
    const { error: memberError } = await supabase
      .from("memberships")
      .insert({
        id: generateId(),
        user_id: userId,
        organization_id: orgId,
        role: "admin",
        created_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error("[OAUTH-ORG-SETUP] Membership creation error:", memberError);
      return c.json({ error: "Failed to create membership" }, 500);
    }

    // Create organization wallet with starting credits
    const { error: walletError } = await supabase
      .from("organization_wallets")
      .insert({
        organization_id: orgId,
        balance: 100000, // 100,000 starting credits
      });

    if (walletError) {
      console.error("[OAUTH-ORG-SETUP] Wallet creation error:", walletError);
      console.error("[OAUTH-ORG-SETUP] Wallet error details:", JSON.stringify(walletError, null, 2));
      return c.json({ 
        error: "Failed to create wallet",
        details: walletError.message,
        code: walletError.code,
        hint: walletError.hint
      }, 500);
    }

    // Create billing account (optional, simplified)
    const { error: billingError } = await supabase
      .from("billing_accounts")
      .insert({
        id: generateId(),
        organization_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (billingError) {
      console.error("[OAUTH-ORG-SETUP] Billing account creation error:", billingError);
      console.error("[OAUTH-ORG-SETUP] This is non-critical, continuing...");
    }

    // Create business profile if data provided
    if (!skip && (companyName || industry || services)) {
      console.log(`[OAUTH-ORG-SETUP] Creating business profile`);
      const { error: profileError } = await supabase
        .from("business_profiles")
        .insert({
          id: generateId(),
          organization_id: orgId,
          company_name: companyName || null,
          industry: industry || null,
          services: services ? [services] : [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("[OAUTH-ORG-SETUP] Business profile creation error:", profileError);
        console.error("[OAUTH-ORG-SETUP] This is non-critical, continuing...");
      } else {
        console.log(`[OAUTH-ORG-SETUP] Business profile created`);
      }
    }

    console.log(`[OAUTH-ORG-SETUP] Successfully created organization. User: ${email}, Org: ${organizationName}`);

    return c.json({
      success: true,
      organizationId: orgId,
      message: "Organization created successfully",
    });
  } catch (error: any) {
    console.error("[OAUTH-ORG-SETUP] Unexpected error:", error);
    return c.json({ error: error.message || "Organization setup failed" }, 500);
  }
});

// ===== ADMIN ENDPOINTS =====

// Get team members for organization
// Note: Auth removed - returning empty members list
app.get("/make-server-2f1627d1/admin/team-members", async (c) => {
  console.log('[ADMIN/TEAM] Auth disabled - returning empty members list');
  return c.json({ members: [] });
});

// Get credit balance and transaction history
// Note: Auth removed - returning mock unlimited credits
app.get("/make-server-2f1627d1/admin/credits", async (c) => {
  console.log('[ADMIN/CREDITS] Auth disabled - returning unlimited credits');
  return c.json({ 
    balance: 999999, 
    transactions: [] 
  });
});

// Invite user to organization
// Note: Auth removed - this endpoint is disabled
app.post("/make-server-2f1627d1/admin/invite-user", async (c) => {
  console.log('[ADMIN/INVITE] Auth disabled - team management not available');
  return c.json({ error: "Team management disabled (auth removed)" }, 400);
});

// Remove team member
// Note: Auth removed - this endpoint is disabled
app.delete("/make-server-2f1627d1/admin/remove-member/:membershipId", async (c) => {
  console.log('[ADMIN/REMOVE] Auth disabled - team management not available');
  return c.json({ error: "Team management disabled (auth removed)" }, 400);
});

// ===== API SETTINGS =====

app.get("/make-server-2f1627d1/api/settings", async (c) => {
  // Use WORKSPACE_ID directly since we removed auth
  console.log('[API Settings] Loading settings for workspace:', WORKSPACE_ID);

  try {
    const settings = await kv.get(`api_settings:${WORKSPACE_ID}`);
    
    if (!settings) {
      return c.json({
        enrichment_provider: "mock",
        enrichment_api_key: "",
        email_provider: "mock",
        email_api_key: "",
        email_from_address: "",
        ai_provider: "mock",
        ai_api_key: "",
        ai_model: "",
        google_maps_api_key: "",
        google_custom_search_id: "", // ✅ ADDED
        perplexity_api_key: "",
        gmail_client_id: "",
        gmail_client_secret: "",
        gmail_refresh_token: "",
        outlook_client_id: "",
        outlook_client_secret: "",
        outlook_refresh_token: "",
      });
    }
    
    return c.json(settings);
  } catch (error: any) {
    console.error("Error fetching API settings:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-2f1627d1/api/settings", async (c) => {
  // Use WORKSPACE_ID directly since we removed auth
  console.log('[API Settings] Saving settings for workspace:', WORKSPACE_ID);

  try {
    const body = await c.req.json();
    console.log('[API Settings] Received settings payload:', JSON.stringify(body, null, 2));
    
    const settings = {
      enrichment_provider: body.enrichment_provider || "mock",
      enrichment_api_key: body.enrichment_api_key || "",
      email_provider: body.email_provider || "mock",
      email_api_key: body.email_api_key || "",
      email_from_address: body.email_from_address || "",
      ai_provider: body.ai_provider || "mock",
      ai_api_key: body.ai_api_key || "",
      ai_model: body.ai_model || "",
      google_maps_api_key: body.google_maps_api_key || "",
      google_custom_search_id: body.google_custom_search_id || "", // ✅ ADDED: Custom Search Engine ID
      perplexity_api_key: body.perplexity_api_key || "",
      gmail_client_id: body.gmail_client_id || "",
      gmail_client_secret: body.gmail_client_secret || "",
      gmail_refresh_token: body.gmail_refresh_token || "",
      outlook_client_id: body.outlook_client_id || "",
      outlook_client_secret: body.outlook_client_secret || "",
      outlook_refresh_token: body.outlook_refresh_token || "",
    };
    
    console.log('[API Settings] Saving settings:', {
      ...settings,
      ai_api_key: settings.ai_api_key ? '***SET***' : 'NOT SET',
      enrichment_api_key: settings.enrichment_api_key ? '***SET***' : 'NOT SET',
    });
    
    await kv.set(`api_settings:${WORKSPACE_ID}`, settings);
    
    console.log('[API Settings] ✅ Settings saved successfully');
    
    return c.json(settings);
  } catch (error: any) {
    console.error("Error updating API settings:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== CREDITS & USAGE =====

// Get credit balance for user's organization
// Note: Auth removed - returning unlimited credits
app.get("/make-server-2f1627d1/api/credits/balance", async (c) => {
  console.log('[CREDITS/BALANCE] Auth disabled - returning unlimited credits');
  return c.json({ balance: 999999 });
});

// Get credit transaction history for user's organization
// Note: Auth removed - returning empty transactions
app.get("/make-server-2f1627d1/api/credits/transactions", async (c) => {
  console.log('[CREDITS/TRANSACTIONS] Auth disabled - returning empty transactions');
  return c.json([]);
});

// ===== BUSINESS PROFILE =====

app.get("/make-server-2f1627d1/api/business-profile", async (c) => {
  console.log('[BUSINESS PROFILE] GET request received');
  
  try {
    const authHeader = c.req.header("Authorization");
    const accessToken = authHeader?.split(" ")[1];
    
    console.log('[BUSINESS PROFILE] Auth header present:', !!authHeader);
    
    const orgId = await getUserOrgId(accessToken);
    console.log('[BUSINESS PROFILE] OrgId from getUserOrgId:', orgId);
    
    if (!orgId) {
      console.log('[BUSINESS PROFILE] User not associated with organization - returning null');
      return c.json(null);
    }

    // Query business_profiles table by organization_id
    const { data: profile, error } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("organization_id", orgId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[BUSINESS PROFILE] Error fetching profile:', error);
      return c.json({ error: error.message }, 500);
    }
    
    if (!profile) {
      console.log('[BUSINESS PROFILE] No profile found, returning null');
      return c.json(null);
    }
    
    console.log('[BUSINESS PROFILE] Returning profile');
    return c.json(profile);
  } catch (error: any) {
    console.error("[BUSINESS PROFILE] Error fetching business profile:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-2f1627d1/api/business-profile", async (c) => {
  console.log('[BUSINESS PROFILE] POST request received');
  
  try {
    const authHeader = c.req.header("Authorization");
    const accessToken = authHeader?.split(" ")[1];
    
    const orgId = await getUserOrgId(accessToken);
    console.log('[BUSINESS PROFILE] OrgId from getUserOrgId:', orgId);
    
    if (!orgId) {
      console.log('[BUSINESS PROFILE] User not associated with organization - cannot save profile');
      return c.json({ error: "No organization found. Please sign up first." }, 400);
    }

    const body = await c.req.json();
    
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("organization_id", orgId)
      .limit(1)
      .maybeSingle();

    const profileData = {
      organization_id: orgId,
      company_name: body.company_name || null,
      industry: body.industry || null,
      services: body.services || [],
      pain_points: body.pain_points || [],
      ideal_customer: body.ideal_customer || null,
      outreach_tone: body.outreach_tone || "consultative",
      extra_context: body.extra_context || {},
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existingProfile) {
      // Update existing profile
      console.log('[BUSINESS PROFILE] Updating existing profile:', existingProfile.id);
      const { data, error } = await supabase
        .from("business_profiles")
        .update(profileData)
        .eq("id", existingProfile.id)
        .select()
        .single();

      if (error) {
        console.error('[BUSINESS PROFILE] Update error:', error);
        return c.json({ error: error.message }, 500);
      }
      result = data;
    } else {
      // Create new profile
      console.log('[BUSINESS PROFILE] Creating new profile');
      const { data, error } = await supabase
        .from("business_profiles")
        .insert({
          id: generateId(),
          ...profileData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[BUSINESS PROFILE] Insert error:', error);
        return c.json({ error: error.message }, 500);
      }
      result = data;
    }

    console.log('[BUSINESS PROFILE] Profile saved successfully');
    return c.json(result);
  } catch (error: any) {
    console.error("Error upserting business profile:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// ICP SEARCH ENDPOINTS
// ========================================
  
// Save ICP Search for reuse
app.post("/make-server-2f1627d1/api/icp-searches", async (c) => {
  try {
    const body = await c.req.json();
    const { 
      name, 
      description, 
      job_titles, 
      seniorities, 
      industries, 
      company_sizes, 
      country, 
      city, 
      state, 
      zip_code 
    } = body;
    
    if (!name) {
      return c.json({ error: "Search name is required" }, 400);
    }
    
    const searchId = generateId();
    const icpSearch = {
      id: searchId,
      name,
      description: description || null,
      job_titles: job_titles || [],
      seniorities: seniorities || [],
      industries: industries || [],
      company_sizes: company_sizes || [],
      country: country || null,
      city: city || null,
      state: state || null,
      zip_code: zip_code || null,
      created_at: new Date().toISOString(),
      last_run_at: null,
      last_run_count: 0,
    };
    
    await kv.set(`icp_search:${searchId}`, icpSearch);
    console.log(`[ICP SEARCH] Saved search: ${name} (${searchId})`);
    
    return c.json(icpSearch);
  } catch (error: any) {
    console.error("[ICP SEARCH] Error saving search:", error);
    return c.json({ error: error.message }, 500);
  }
});
  
// List all saved ICP searches
app.get("/make-server-2f1627d1/api/icp-searches", async (c) => {
  try {
    const searches = await kv.getByPrefix("icp_search:");
    console.log(`[ICP SEARCH] Retrieved ${searches.length} saved searches`);
    
    // Sort by created_at descending
    searches.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    return c.json(searches);
  } catch (error: any) {
    console.error("[ICP SEARCH] Error listing searches:", error);
    return c.json({ error: error.message }, 500);
  }
});
  
// Get single ICP search by ID
app.get("/make-server-2f1627d1/api/icp-searches/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const search = await kv.get(`icp_search:${id}`);
    
    if (!search) {
      return c.json({ error: "Search not found" }, 404);
    }
    
    return c.json(search);
  } catch (error: any) {
    console.error("[ICP SEARCH] Error getting search:", error);
    return c.json({ error: error.message }, 500);
  }
});
  
// Update last run timestamp and count for an ICP search
app.post("/make-server-2f1627d1/api/icp-searches/:id/record-run", async (c) => {
  try {
    const { id } = c.req.param();
    const { result_count } = await c.req.json();
    
    const search = await kv.get(`icp_search:${id}`);
    if (!search) {
      return c.json({ error: "Search not found" }, 404);
    }
    
    search.last_run_at = new Date().toISOString();
    search.last_run_count = result_count || 0;
    
    await kv.set(`icp_search:${id}`, search);
    console.log(`[ICP SEARCH] Updated run stats for: ${search.name}`);
    
    return c.json(search);
  } catch (error: any) {
    console.error("[ICP SEARCH] Error recording run:", error);
    return c.json({ error: error.message }, 500);
  }
});
  
// Delete an ICP search
app.delete("/make-server-2f1627d1/api/icp-searches/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await kv.del(`icp_search:${id}`);
    console.log(`[ICP SEARCH] Deleted search: ${id}`);
    return c.json({ success: true });
  } catch (error: any) {
    console.error("[ICP SEARCH] Error deleting search:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// ICP RUN ENDPOINTS
// ========================================

app.post("/make-server-2f1627d1/api/icp-runs", async (c) => {
  try {
    const body = await c.req.json();
    
    const icpRun = {
      id: generateId(),
      name: body.name || "ICP Run",
      filters: body.filters || {},
      status: "draft",
    };
    
    await kv.set(`icp_run:${icpRun.id}`, icpRun);
    
    return c.json({
      id: icpRun.id,
      name: icpRun.name,
      filters: icpRun.filters,
      status: icpRun.status,
    });
  } catch (error: any) {
    console.error("Error creating ICP run:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-2f1627d1/api/icp-runs/:id/discover", async (c) => {
  try {
    const icpRunId = c.req.param("id");
    const body = await c.req.json();
    
    console.log(`[ICP DISCOVERY] Starting discovery for ICP run ${icpRunId}`);
    
    // Update ICP run status
    const icpRun = await kv.get(`icp_run:${icpRunId}`);
    if (!icpRun) {
      console.error(`[ICP DISCOVERY] ICP run ${icpRunId} not found`);
      return c.json({ error: "ICP run not found" }, 404);
    }
    icpRun.status = "running";
    await kv.set(`icp_run:${icpRunId}`, icpRun);
    
    console.log(`[ICP DISCOVERY] ICP run filters:`, icpRun.filters);
    
    // Get API settings to check if Apollo is configured
    const settings = await kv.get(`api_settings:${WORKSPACE_ID}`) || {};
    const useApollo = settings.enrichment_provider === "apollo" && settings.enrichment_api_key;
    
    let discoveredLeads = [];
    
    if (useApollo) {
      console.log(`[ICP DISCOVERY] Using Apollo API for discovery`);
      
      // Get user's organization for credit tracking
      const authHeader = c.req.header("Authorization");
      const accessToken = authHeader?.split(" ")[1];
      const orgId = await getUserOrgId(accessToken);
      
      try {
        // Track credit usage (non-blocking - for reporting only)
        if (orgId) {
          deductCredits(
            orgId,
            CREDIT_COSTS.APOLLO_DISCOVERY,
            "Apollo Lead Discovery API call"
          ).catch(err => console.log('[CREDITS] Tracking failed (non-critical):', err));
        }
        
        // Build Apollo API search parameters
        const searchParams: any = {
          page: 1,
          per_page: 25,
        };
        
        // Person titles
        if (icpRun.filters?.titles && icpRun.filters.titles.length > 0) {
          searchParams.person_titles = icpRun.filters.titles;
        }
        
        // Location/Geography
        if (icpRun.filters?.geo) {
          searchParams.person_locations = [icpRun.filters.geo];
        }
        
        // Industries - use q_keywords for industry search
        if (icpRun.filters?.industries && icpRun.filters.industries.length > 0) {
          searchParams.q_organization_keyword_tags = icpRun.filters.industries;
        }
        
        // Company size - convert to Apollo format
        if (icpRun.filters?.companySize) {
          // Parse size like "1-200" and convert to Apollo ranges
          const sizeStr = icpRun.filters.companySize;
          if (sizeStr.includes('-')) {
            const [min, max] = sizeStr.split('-').map(s => parseInt(s.trim()));
            searchParams.organization_num_employees_ranges = [`${min},${max}`];
          }
        }
        
        console.log(`[APOLLO API] Search parameters:`, JSON.stringify(searchParams, null, 2));
        
        // Call Apollo People Search API
        const apolloResponse = await fetch("https://api.apollo.io/v1/mixed_people/api_search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "X-Api-Key": settings.enrichment_api_key,
          },
          body: JSON.stringify(searchParams),
        });
        
        if (!apolloResponse.ok) {
          const errorText = await apolloResponse.text();
          console.error(`[APOLLO API] Error response (${apolloResponse.status}):`, errorText);
          throw new Error(`Apollo API error: ${apolloResponse.status} - ${errorText}`);
        }
        
        const apolloData = await apolloResponse.json();
        console.log(`[APOLLO API] Found ${apolloData.people?.length || 0} people`);
        console.log(`[APOLLO API] Sample person data (first result):`, JSON.stringify(apolloData.people?.[0], null, 2));
        
        if (apolloData.people && apolloData.people.length > 0) {
          discoveredLeads = apolloData.people.map((person: any) => {
            // With paid plan + reveal params, Apollo returns full contact data in search
            const lastName = person.last_name || person.last_name_obfuscated || null;
            
            const org = person.organization || {};
            
            const lead = {
              first_name: person.first_name || null,
              last_name: lastName,
              title: person.title || null,
              company_name: org.name || null,
              company_domain: org.primary_domain || null,
              linkedin_url: person.linkedin_url || null,
              // Person location
              city: person.city || null,
              state: person.state || null,
              country: person.country || null,
              // Company address
              company_city: org.city || null,
              company_state: org.state || null,
              company_country: org.country || null,
              company_zip: org.postal_code || null,
              // Store Apollo IDs for enrichment
              apollo_id: person.id || null,
              organization_id: org.id || null,
              // Contact info revealed from search (if paid plan)
              email: person.email || person.personal_emails?.[0] || null,
              phone: person.phone_numbers?.[0]?.sanitized_number || 
                     person.phone_numbers?.[0]?.raw_number || 
                     person.mobile_phone || null,
            };
            console.log(`[APOLLO API] Mapped lead: ${lead.first_name} ${lead.last_name} - ${lead.title} at ${lead.company_name}`);
            console.log(`[APOLLO API] Contact info: ${lead.email || 'no email'} / ${lead.phone || 'no phone'}`);
            return lead;
          });
        }
      } catch (apolloError: any) {
        console.error(`[APOLLO API] Error calling Apollo:`, apolloError);
        console.log(`[ICP DISCOVERY] Falling back to mock data due to Apollo error`);
        // Fall through to mock data
      }
    }
    
    // If Apollo not configured or failed, use mock data
    if (discoveredLeads.length === 0) {
      console.log(`[ICP DISCOVERY] Using mock discovery data`);
      discoveredLeads = [
        { first_name: "John", last_name: "Smith", title: "Owner", company_name: "Green Landscaping Co", company_domain: "greenlandscaping.com", city: "Austin", state: "TX", country: "US" },
        { first_name: "Sarah", last_name: "Johnson", title: "Operations Manager", company_name: "Precision Irrigation", company_domain: "precision-irrigation.com", city: "Phoenix", state: "AZ", country: "US" },
        { first_name: "Mike", last_name: "Davis", title: "Owner", company_name: "Lawn Care Plus", company_domain: "lawncareplusllc.com", city: "Denver", state: "CO", country: "US" },
        { first_name: "Emily", last_name: "Brown", title: "GM", company_name: "Irrigation Solutions LLC", company_domain: "irrigationsolutions.com", city: "Tampa", state: "FL", country: "US" },
        { first_name: "David", last_name: "Wilson", title: "Owner", company_name: "Landscape Design Pro", company_domain: "landscapedesignpro.com", city: "Seattle", state: "WA", country: "US" },
      ];
    }
    
    // Save discovered leads with deduplication
    console.log(`[ICP DISCOVERY] Saving ${discoveredLeads.length} leads to database`);
    
    // Get existing Apollo IDs for deduplication
    const allExistingLeads = await kv.getByPrefix("lead:");
    const existingApolloIds = new Set();
    for (const existingLead of allExistingLeads) {
      if (existingLead.apollo_id) {
        existingApolloIds.add(existingLead.apollo_id);
      }
    }
    console.log(`[ICP DISCOVERY] Found ${existingApolloIds.size} existing Apollo IDs for deduplication`);
    
    let savedCount = 0;
    let skippedCount = 0;
    
    for (const leadData of discoveredLeads) {
      // Skip if duplicate Apollo ID
      if (leadData.apollo_id && existingApolloIds.has(leadData.apollo_id)) {
        console.log(`[ICP DISCOVERY] ⚠️ Skipping duplicate: ${leadData.first_name} ${leadData.last_name} (Apollo ID: ${leadData.apollo_id})`);
        skippedCount++;
        continue;
      }
      
      const lead = {
        id: generateId(),
        icp_run_id: icpRunId,
        status: "discovered",
        first_name: leadData.first_name,
        last_name: leadData.last_name,
        title: leadData.title,
        company_name: leadData.company_name,
        company_domain: leadData.company_domain,
        linkedin_url: leadData.linkedin_url,
        city: leadData.city,
        state: leadData.state,
        country: leadData.country,
        // Store Apollo ID so we can enrich later
        apollo_id: leadData.apollo_id || null,
        created_at: new Date().toISOString(),
      };
      await kv.set(`lead:${lead.id}`, lead);
      
      // Add to set to prevent duplicates within this batch
      if (lead.apollo_id) {
        existingApolloIds.add(lead.apollo_id);
      }
      
      savedCount++;
      console.log(`[ICP DISCOVERY] ✅ Saved lead: ${lead.first_name} ${lead.last_name} at ${lead.company_name}`);
    }
    
    console.log(`[ICP DISCOVERY] Summary: ${savedCount} saved, ${skippedCount} duplicates skipped`);
    
    icpRun.status = "complete";
    icpRun.discovered_count = savedCount;
    await kv.set(`icp_run:${icpRunId}`, icpRun);
    
    console.log(`[ICP DISCOVERY] Discovery complete. ${discoveredLeads.length} leads discovered.`);
    
    return c.json({ success: true, discovered_count: discoveredLeads.length });
  } catch (error: any) {
    console.error("Error discovering ICP run:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== LEADS =====

app.get("/make-server-2f1627d1/api/leads", async (c) => {
  try {
    const statusFilter = c.req.query("status");
    const enrichmentStatusFilter = c.req.query("enrichment_status");
    const icpRunIdFilter = c.req.query("icpRunId");
    
    console.log('[LEADS] Fetching leads with filters:', { statusFilter, enrichmentStatusFilter, icpRunIdFilter });
    
    let leads = [];
    let enrichments = [];
    
    try {
      leads = await kv.getByPrefix("lead:");
      console.log('[LEADS] Fetched leads count:', leads?.length || 0);
    } catch (kvError: any) {
      console.error('[LEADS] Error fetching leads from KV:', kvError);
      return c.json({ error: `Database error: ${kvError.message}` }, 500);
    }
    
    // Apply filters
    if (statusFilter) {
      leads = leads.filter((lead: any) => lead.status === statusFilter);
    }
    
    if (enrichmentStatusFilter) {
      leads = leads.filter((lead: any) => lead.enrichment_status === enrichmentStatusFilter);
    }
    
    if (icpRunIdFilter) {
      leads = leads.filter((lead: any) => lead.icp_run_id === icpRunIdFilter);
    }
    
    // Get enrichments for all leads
    try {
      enrichments = await kv.getByPrefix("enrichment:");
      console.log('[LEADS] Fetched enrichments count:', enrichments?.length || 0);
    } catch (kvError: any) {
      console.error('[LEADS] Error fetching enrichments from KV:', kvError);
      // Continue without enrichments
      enrichments = [];
    }
    
    const enrichmentMap: any = {};
    enrichments.forEach((enr: any) => {
      enrichmentMap[enr.lead_id] = enr;
    });
    
    const result = leads.map(lead => ({
      id: lead.id,
      status: lead.status,
      qualification_level: lead.qualification_level,
      first_name: lead.first_name,
      last_name: lead.last_name,
      title: lead.title,
      company_name: lead.company_name,
      company_domain: lead.company_domain,
      company_city: lead.company_city,
      company_state: lead.company_state,
      company_country: lead.company_country,
      linkedin_url: lead.linkedin_url,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      apollo_id: lead.apollo_id,
      organization_id: lead.organization_id,
      email: lead.email,
      phone: lead.phone,
      icp_run_id: lead.icp_run_id,
      created_at: lead.created_at,
      enriched_at: lead.enriched_at,
      enrichment_status: lead.enrichment_status,
      enrichment: enrichmentMap[lead.id] ? {
        email: enrichmentMap[lead.id].email,
        phone: enrichmentMap[lead.id].phone,
        status: enrichmentMap[lead.id].status,
      } : null,
    }));
    
    console.log('[LEADS] Returning results count:', result.length);
    return c.json(result);
  } catch (error: any) {
    console.error("[LEADS] Error listing leads:", error);
    console.error("[LEADS] Error stack:", error.stack);
    return c.json({ error: error.message || "Failed to fetch leads" }, 500);
  }
});

// Get single lead by ID
app.get("/make-server-2f1627d1/api/leads/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const lead = await kv.get(`lead:${id}`);
    
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }
    
    // 🔍 DIAGNOSTIC: Check what format satellite_tiles are in
    if (lead.property_analysis?.analysis_metadata?.satellite_tiles) {
      const tiles = lead.property_analysis.analysis_metadata.satellite_tiles;
      console.log(`[LEAD GET] 🔍 Satellite tiles in response: ${tiles.length} tiles`);
      console.log(`[LEAD GET] 🔍 First tile format: ${tiles[0]?.substring(0, 50)}...`);
      console.log(`[LEAD GET] 🔍 Is base64? ${tiles[0]?.startsWith('data:image')}`);
      console.log(`[LEAD GET] 🔍 Is Google URL? ${tiles[0]?.startsWith('https://maps.googleapis.com')}`);
    }
    
    return c.json(lead);
  } catch (error: any) {
    console.error("Error getting lead:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// OLD ENRICHMENT ENDPOINT REMOVED
// Use POST /api/leads/:id/enrich instead (2-part enrichment flow)
// ========================================

// Update lead status and qualification level
app.patch("/make-server-2f1627d1/api/leads/:id/status", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { status, qualification_level } = body;
    
    console.log(`[LEAD STATUS UPDATE] Lead ID: ${id}`);
    console.log(`[LEAD STATUS UPDATE] Payload:`, { status, qualification_level });
    
    // Get existing lead
    const lead = await kv.get(`lead:${id}`);
    if (!lead) {
      console.error(`[LEAD STATUS UPDATE] ❌ Lead not found: ${id}`);
      return c.json({ error: "Lead not found" }, 404);
    }
    
    console.log(`[LEAD STATUS UPDATE] Current values - status: "${lead.status}", qualification: "${lead.qualification_level}"`);
    
    // Validate status if provided
    const validStatuses = ["new", "contacted", "qualified", "proposal", "won", "lost"];
    if (status && !validStatuses.includes(status)) {
      console.error(`[LEAD STATUS UPDATE] ❌ Invalid status: ${status}`);
      return c.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, 400);
    }
    
    // Validate qualification level if provided
    const validLevels = ["cold", "warm", "hot"];
    if (qualification_level && !validLevels.includes(qualification_level)) {
      console.error(`[LEAD STATUS UPDATE] ❌ Invalid qualification_level: ${qualification_level}`);
      return c.json({ error: `Invalid qualification_level. Must be one of: ${validLevels.join(", ")}` }, 400);
    }
    
    // Build updated lead
    const now = new Date().toISOString();
    const updated = {
      ...lead,
      ...(status && { status }),
      ...(qualification_level !== undefined && { qualification_level }),
      status_updated_at: now,
      status_updated_by: "Rahul Surana", // Hardcoded for now
      updated_at: now,
    };
    
    console.log(`[LEAD STATUS UPDATE] New values - status: "${updated.status}", qualification: "${updated.qualification_level}"`);
    
    // Save to database
    await kv.set(`lead:${id}`, updated);
    console.log(`[LEAD STATUS UPDATE] ✅ Saved to database successfully`);
    
    // Log activity for status/qualification changes
    if (status && status !== lead.status) {
      const activity = {
        id: generateId(),
        lead_id: id,
        type: "status_change",
        description: `Status changed from "${lead.status || 'none'}" to "${status}"`,
        metadata: {
          old_status: lead.status,
          new_status: status,
        },
        user: "Rahul Surana",
        timestamp: now,
      };
      await kv.set(`activity:${activity.id}`, activity);
      console.log(`[LEAD STATUS UPDATE] ✅ Activity logged: status change`);
    }
    
    if (qualification_level !== undefined && qualification_level !== lead.qualification_level) {
      const activity = {
        id: generateId(),
        lead_id: id,
        type: "qualification_change",
        description: `Qualification changed from "${lead.qualification_level || 'none'}" to "${qualification_level}"`,
        metadata: {
          old_qualification: lead.qualification_level,
          new_qualification: qualification_level,
        },
        user: "Rahul Surana",
        timestamp: now,
      };
      await kv.set(`activity:${activity.id}`, activity);
      console.log(`[LEAD STATUS UPDATE] ✅ Activity logged: qualification change`);
    }
    
    console.log(`[LEAD STATUS UPDATE] ✅ Returning updated lead to frontend`);
    return c.json(updated);
  } catch (error: any) {
    console.error("[LEAD STATUS UPDATE] ❌ Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-2f1627d1/api/leads/:id", async (c) => {
  try {
    const leadId = c.req.param("id");
    
    // Delete the lead
    await kv.del(`lead:${leadId}`);
    
    // Also delete associated enrichment if it exists
    await kv.del(`enrichment:${leadId}`);
    
    console.log(`[LEADS] Deleted lead ${leadId} and associated enrichment`);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-2f1627d1/api/leads/bulk-delete", async (c) => {
  try {
    const body = await c.req.json();
    const { leadIds } = body;
    
    if (!leadIds || !Array.isArray(leadIds)) {
      return c.json({ error: "leadIds array required" }, 400);
    }
    
    console.log(`[LEADS] Bulk deleting ${leadIds.length} leads`);
    
    for (const leadId of leadIds) {
      // Delete the lead
      await kv.del(`lead:${leadId}`);
      
      // Also delete associated enrichment if it exists
      await kv.del(`enrichment:${leadId}`);
    }
    
    console.log(`[LEADS] Bulk delete complete for ${leadIds.length} leads`);
    
    return c.json({ success: true, deletedCount: leadIds.length });
  } catch (error: any) {
    console.error("Error bulk deleting leads:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-2f1627d1/api/leads/search", async (c) => {
  try {
    const body = await c.req.json();
    const { titles, seniorities, industries, company_size, country, city, state, zip_code, page } = body;
    
    console.log(`[LEAD SEARCH] Searching with filters:`, JSON.stringify(body, null, 2));
    
    // Get API settings to check if Apollo is configured
    const settings = await kv.get(`api_settings:${WORKSPACE_ID}`) || {};
    const useApollo = settings.enrichment_provider === "apollo" && settings.enrichment_api_key;
    
    let leads = [];
    let hasMore = false;
    const currentPage = page || 1;
    
    if (useApollo) {
      console.log(`[LEAD SEARCH] Using Apollo API for search`);
      
      // ========================================
      // DEDUPLICATION: Get existing Apollo IDs from database
      // ========================================
      const allExistingLeads = await kv.getByPrefix("lead:");
      const existingApolloIds = new Set();
      const closedStatuses = ["won", "lost"]; // Statuses considered "closed"
      
      for (const lead of allExistingLeads) {
        if (lead.apollo_id) {
          // Only exclude if lead is enriched AND not closed
          if (lead.enrichment_status === "enriched" && !closedStatuses.includes(lead.status)) {
            existingApolloIds.add(lead.apollo_id);
          }
        }
      }
      
      console.log(`[DEDUP] Found ${existingApolloIds.size} existing enriched leads to exclude`);
      
      try {
        // We may need to fetch multiple pages to get enough unique results
        let uniqueLeads = [];
        let apolloPage = currentPage;
        const targetLeadsPerPage = 25;
        const maxPagesToFetch = 5; // Safety limit to avoid infinite loop
        let pagesChecked = 0;
        
        while (uniqueLeads.length < targetLeadsPerPage && pagesChecked < maxPagesToFetch) {
          pagesChecked++;
          
          // Build Apollo API search parameters
          const searchParams: any = {
            page: apolloPage,
            per_page: 25,
          };
          
          // Job titles
          if (titles && titles.length > 0) {
            searchParams.person_titles = titles;
          }
          
          // Seniorities
          if (seniorities && seniorities.length > 0) {
            searchParams.person_seniorities = seniorities;
          }
          
          // Industries
          if (industries && industries.length > 0) {
            searchParams.q_organization_keyword_tags = industries;
          }
          
          // Company size
          if (company_size && company_size.length > 0) {
            searchParams.organization_num_employees_ranges = company_size;
          }
          
          // Location - combine city, state, country into Apollo's format
          // Apollo expects: ["City, State, Country"] or ["State, Country"]
          const locationParts = [];
          if (city) {
            locationParts.push(city);
          }
          if (state) {
            locationParts.push(state);
          }
          if (country) {
            locationParts.push(country);
          }
          
          if (locationParts.length > 0) {
            const locationString = locationParts.join(", ");
            searchParams.person_locations = [locationString];
          }
          
          console.log(`[APOLLO API] Page ${apolloPage} - Search parameters:`, JSON.stringify(searchParams, null, 2));
          
          // Call Apollo People Search API
          const apolloResponse = await fetch("https://api.apollo.io/v1/mixed_people/api_search", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              "X-Api-Key": settings.enrichment_api_key,
            },
            body: JSON.stringify(searchParams),
          });
          
          if (!apolloResponse.ok) {
            const errorText = await apolloResponse.text();
            console.error(`[APOLLO API] Error response (${apolloResponse.status}):`, errorText);
            throw new Error(`Apollo API error: ${apolloResponse.status} - ${errorText}`);
          }
          
          const apolloData = await apolloResponse.json();
          console.log(`[APOLLO API] Page ${apolloPage} - Found ${apolloData.people?.length || 0} people`);
          
          // Check if there are more pages available
          hasMore = apolloData.pagination?.total_pages > apolloPage;
          
          if (apolloData.people && apolloData.people.length > 0) {
            // Map and filter Apollo results
            const pageLeads = apolloData.people
              .map((person: any) => {
                const org = person.organization || {};
                
                return {
                  apollo_id: person.id || null,
                  organization_id: org.id || org.primary_domain || org.website_url || null,
                  full_name: `${person.first_name || ''} ${person.last_name || person.last_name_obfuscated || ''}`.trim(),
                  email: person.email || person.personal_emails?.[0] || null,
                  company_name: org.name || null,
                  company_city: org.city || null,
                  company_state: org.state || null,
                  company_country: org.country || null,
                  phone: person.phone_numbers?.[0]?.sanitized_number || 
                         person.phone_numbers?.[0]?.raw_number || 
                         person.mobile_phone || null,
                  linkedin: person.linkedin_url || null,
                  title: person.title || null,
                  first_name: person.first_name || null,
                  last_name: person.last_name || person.last_name_obfuscated || null,
                  company_domain: org.primary_domain || org.website_url || null,
                };
              })
              .filter((lead: any) => {
                // Filter out duplicates
                if (lead.apollo_id && existingApolloIds.has(lead.apollo_id)) {
                  console.log(`[DEDUP] ❌ Filtered duplicate: ${lead.full_name} (Apollo ID: ${lead.apollo_id})`);
                  return false;
                }
                return true;
              });
            
            console.log(`[APOLLO API] Page ${apolloPage} - After deduplication: ${pageLeads.length} unique leads`);
            
            // Add unique leads to our collection
            uniqueLeads.push(...pageLeads);
            
            // If we don't have enough leads and there are more pages, fetch next page
            if (uniqueLeads.length < targetLeadsPerPage && hasMore) {
              apolloPage++;
              console.log(`[APOLLO API] Need more leads (${uniqueLeads.length}/${targetLeadsPerPage}), fetching page ${apolloPage}...`);
            } else {
              break;
            }
          } else {
            // No more people found
            break;
          }
        }
        
        leads = uniqueLeads.slice(0, targetLeadsPerPage); // Cap at target
        
        console.log(`[LEAD SEARCH] ✅ Returning ${leads.length} unique leads (checked ${pagesChecked} pages)`);
        if (leads.length > 0) {
          console.log(`[LEAD SEARCH] First lead sample:`, JSON.stringify(leads[0], null, 2));
        }
        
      } catch (apolloError: any) {
        console.error(`[APOLLO API] Error calling Apollo:`, apolloError);
        console.log(`[LEAD SEARCH] Falling back to mock data due to Apollo error`);
        // Fall through to mock data
      }
    }
    
    // If Apollo not configured or failed, use mock data
    if (leads.length === 0) {
      console.log(`[LEAD SEARCH] Using mock search data`);
      leads = [
        {
          full_name: "Jane Doe",
          email: "jane@abclandscaping.com",
          company_name: "ABC Landscaping",
          phone: "+14155551234",
          linkedin: "https://linkedin.com/in/janedoe"
        },
        {
          full_name: "John Smith",
          email: "john.smith@greenscapes.com",
          company_name: "GreenScapes Inc",
          phone: "+14155555678",
          linkedin: "https://linkedin.com/in/johnsmith"
        },
        {
          full_name: "Sarah Johnson",
          email: "sarah@irrigationpro.com",
          company_name: "Irrigation Pro",
          phone: "+14155559012",
          linkedin: "https://linkedin.com/in/sarahjohnson"
        },
      ];
      hasMore = currentPage < 3; // Mock pagination
    }
    
    console.log(`[LEAD SEARCH] Returning ${leads.length} leads, page ${currentPage}, has_more: ${hasMore}`);
    
    return c.json({
      leads,
      page: currentPage,
      has_more: hasMore,
    });
  } catch (error: any) {
    console.error("Error searching leads:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Save search results as leads
app.post("/make-server-2f1627d1/api/leads/save-from-search", async (c) => {
  try {
    const body = await c.req.json();
    const { leads: searchResults } = body;
    
    if (!searchResults || !Array.isArray(searchResults)) {
      return c.json({ error: "leads array required" }, 400);
    }
    
    console.log(`[SAVE LEADS] Attempting to save ${searchResults.length} search results as leads`);
    
    // ========================================
    // DEDUPLICATION: Check existing Apollo IDs
    // ========================================
    const allExistingLeads = await kv.getByPrefix("lead:");
    const existingApolloIds = new Set();
    
    for (const lead of allExistingLeads) {
      if (lead.apollo_id) {
        existingApolloIds.add(lead.apollo_id);
      }
    }
    
    console.log(`[SAVE LEADS] Found ${existingApolloIds.size} existing Apollo IDs in database`);
    
    const savedLeads = [];
    const skippedDuplicates = [];
    
    for (const searchResult of searchResults) {
      // Check for duplicate Apollo ID
      if (searchResult.apollo_id && existingApolloIds.has(searchResult.apollo_id)) {
        const fullName = `${searchResult.first_name || ''} ${searchResult.last_name || ''}`.trim();
        console.log(`[SAVE LEADS] ⚠️ Skipping duplicate: ${fullName} (Apollo ID: ${searchResult.apollo_id})`);
        skippedDuplicates.push({
          name: fullName,
          apollo_id: searchResult.apollo_id,
          company: searchResult.company_name
        });
        continue;
      }
      
      const lead = {
        id: generateId(),
        status: "discovered",
        first_name: searchResult.first_name || null,
        last_name: searchResult.last_name || null,
        title: searchResult.title || null,
        company_name: searchResult.company_name || null,
        company_domain: searchResult.company_domain || null,
        company_city: searchResult.company_city || null,
        company_state: searchResult.company_state || null,
        company_country: searchResult.company_country || null,
        linkedin_url: searchResult.linkedin || null,
        apollo_id: searchResult.apollo_id || null,
        organization_id: searchResult.organization_id || null,
        email: searchResult.email || null,
        phone: searchResult.phone || null,
        created_at: new Date().toISOString(),
      };
      
      await kv.set(`lead:${lead.id}`, lead);
      savedLeads.push(lead);
      
      // Add to our in-memory set to prevent duplicates within this batch
      if (lead.apollo_id) {
        existingApolloIds.add(lead.apollo_id);
      }
      
      console.log(`[SAVE LEADS] ✅ Saved: ${lead.first_name} ${lead.last_name} at ${lead.company_name}`);
    }
    
    console.log(`[SAVE LEADS] Summary: ${savedLeads.length} saved, ${skippedDuplicates.length} duplicates skipped`);
    
    return c.json({ 
      success: true, 
      count: savedLeads.length, 
      leads: savedLeads,
      skipped: skippedDuplicates.length,
      duplicates: skippedDuplicates
    });
  } catch (error: any) {
    console.error("Error saving search results as leads:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ========================================
// LEAD ENRICHMENT ENDPOINTS
// ========================================

/**
 * BULK ENRICHMENT - Enrich multiple leads at once
 */
app.post("/make-server-2f1627d1/api/leads/enrich", async (c) => {
  try {
    const body = await c.req.json();
    const { leadIds } = body;
    
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return c.json({ error: "leadIds array required" }, 400);
    }
    
    console.log(`[BULK ENRICHMENT] Starting enrichment for ${leadIds.length} leads`);
    
    // Get API settings from KV store
    const settings = await kv.get(`api_settings:${WORKSPACE_ID}`) || {};
    const apolloKey = settings.enrichment_api_key;
    
    if (!apolloKey) {
      return c.json({ error: "Apollo API key not configured. Please configure it in Settings." }, 500);
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    // Enrich each lead sequentially (avoid rate limits)
    for (const leadId of leadIds) {
      try {
        console.log(`[BULK ENRICHMENT] Enriching lead ${leadId}...`);
        
        // Get the lead from KV store
        const lead = await kv.get(`lead:${leadId}`);
        if (!lead) {
          console.error(`[BULK ENRICHMENT] Lead ${leadId} not found`);
          results.failed++;
          results.errors.push(`Lead ${leadId} not found`);
          continue;
        }
        
        const apolloPersonId = lead.apollo_id;
        const organizationId = lead.organization_id;
        const companyDomain = lead.company_domain;
        
        if (!apolloPersonId) {
          console.error(`[BULK ENRICHMENT] Lead ${leadId} missing Apollo person ID`);
          results.failed++;
          results.errors.push(`Lead ${leadId} missing Apollo ID`);
          continue;
        }
        
        // STEP 1: Reveal Person
        console.log(`[BULK ENRICHMENT] Step 1: Revealing person for lead ${leadId}`);
        
        const revealResponse = await fetch("https://api.apollo.io/v1/people/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "X-Api-Key": apolloKey,
          },
          body: JSON.stringify({ id: apolloPersonId }),
        });
        
        if (!revealResponse.ok) {
          const errorText = await revealResponse.text();
          console.error(`[BULK ENRICHMENT] Person reveal failed for lead ${leadId}:`, errorText);
          results.failed++;
          results.errors.push(`Lead ${leadId}: Apollo person match failed`);
          continue;
        }
        
        const revealData = await revealResponse.json();
        const person = revealData.person || {};
        const personOrg = person.organization || {};
        
        const enrichedPersonData = {
          full_name: `${person.first_name || ""} ${person.last_name || ""}`.trim() || lead.full_name,
          first_name: person.first_name || lead.first_name,
          last_name: person.last_name || lead.last_name,
          email: person.email || lead.email,
          phone: person.phone_numbers?.[0]?.sanitized_number || lead.phone,
          linkedin_url: person.linkedin_url || lead.linkedin_url,
          title: person.title || lead.title,
        };
        
        // STEP 2: Enrich Organization
        console.log(`[BULK ENRICHMENT] Step 2: Enriching organization for lead ${leadId}`);
        
        const finalOrgId = organizationId || personOrg.id;
        const finalDomain = companyDomain || personOrg.primary_domain || personOrg.website_url;
        
        let enrichedOrgData: any = {};
        let apolloOrgSuccess = false;
        
        // Build org payload - need at least org_id OR domain
        const orgPayload: any = {};
        if (finalOrgId && String(finalOrgId).trim().length > 0) {
          orgPayload.organization_id = String(finalOrgId).trim();
        }
        
        if (finalDomain && typeof finalDomain === 'string' && finalDomain.trim().length > 0) {
          // Clean domain - remove http/https and trailing slash
          let cleanDomain = finalDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
          
          if (cleanDomain && cleanDomain.length > 0 && !cleanDomain.includes('undefined') && cleanDomain !== 'null') {
            orgPayload.domain = cleanDomain;
          } else {
            console.warn(`[BULK ENRICHMENT] Domain became empty or invalid after cleaning: "${finalDomain}"`);
          }
        }
        
        // Only make Apollo org request if we have valid payload with required fields
        if (orgPayload.organization_id || orgPayload.domain) {
          console.log(`[BULK ENRICHMENT] Organization payload:`, JSON.stringify(orgPayload));
            
            const orgResponse = await fetch("https://api.apollo.io/v1/organizations/enrich", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "X-Api-Key": apolloKey,
              },
              body: JSON.stringify(orgPayload),
            });
            
            if (orgResponse.ok) {
              const orgData = await orgResponse.json();
              const organization = orgData.organization || {};
              enrichedOrgData = {
                company_name: organization.name || lead.company_name,
                company_website: organization.website_url || lead.company_domain,
                company_street: organization.street_address,
                company_city: organization.city || lead.company_city,
                company_state: organization.state || lead.company_state,
                company_postal_code: organization.postal_code,
                company_country: organization.country || lead.company_country,
                company_domain: organization.primary_domain || companyDomain,
              };
              apolloOrgSuccess = true;
              console.log(`[BULK ENRICHMENT] ✅ Organization enrichment complete`);
          } else {
            const errorText = await orgResponse.text();
            console.error(`[BULK ENRICHMENT] Organization enrich failed:`, errorText);
          }
        } else {
          console.log(`[BULK ENRICHMENT] ⚠️ Skipping organization enrichment - no org ID or domain available`);
        }
        
        // Combine enriched data
        let fullyEnrichedLead = {
          ...lead,
          ...enrichedPersonData,
          ...enrichedOrgData,
          enriched_at: new Date().toISOString(),
          enrichment_status: apolloOrgSuccess ? "complete" : "partial",
          status: "enriched", // Move to enriched tab
        };
        
        // STEP 3: OpenAI Company Research (if configured)
        const companyName = fullyEnrichedLead.company_name;
        if (companyName && settings.ai_api_key && settings.ai_provider === 'openai') {
          try {
            console.log(`[BULK ENRICHMENT] Step 3: OpenAI research for lead ${leadId} company: ${companyName}`);
            
            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${settings.ai_api_key}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: 'You are a business research assistant. When given a company name, you provide accurate information including website, phone, description, and full address. Respond ONLY with valid JSON in this exact format: {\"website\": \"https://example.com\", \"phone\": \"+1-555-555-5555\", \"description\": \"Brief description of what the company does\", \"street\": \"123 Main St\", \"city\": \"City Name\", \"state\": \"ST\", \"zip\": \"12345\", \"country\": \"Country\"}. If you cannot find information for a field, use null.'
                  },
                  {
                    role: 'user',
                    content: `Research this company and provide complete information: ${companyName}`
                  }
                ],
                temperature: 0.3,
                max_tokens: 600,
              }),
            });
            
            if (openaiResponse.ok) {
              const openaiData = await openaiResponse.json();
              const aiResponse = openaiData.choices[0]?.message?.content;
              
              if (aiResponse) {
                try {
                  const enrichmentData = JSON.parse(aiResponse);
                  
                  // Update company data with AI findings (only if Apollo didn't already provide it)
                  fullyEnrichedLead.company_website = fullyEnrichedLead.company_website || enrichmentData.website;
                  fullyEnrichedLead.company_phone = fullyEnrichedLead.company_phone || enrichmentData.phone;
                  fullyEnrichedLead.company_description = enrichmentData.description || fullyEnrichedLead.company_description;
                  
                  // Update address fields (only if Apollo didn't provide them)
                  fullyEnrichedLead.company_street = fullyEnrichedLead.company_street || enrichmentData.street;
                  fullyEnrichedLead.company_city = fullyEnrichedLead.company_city || enrichmentData.city;
                  fullyEnrichedLead.company_state = fullyEnrichedLead.company_state || enrichmentData.state;
                  fullyEnrichedLead.company_postal_code = fullyEnrichedLead.company_postal_code || enrichmentData.zip;
                  fullyEnrichedLead.company_country = fullyEnrichedLead.company_country || enrichmentData.country;
                  
                  // Mark as complete if AI enrichment added company data
                  fullyEnrichedLead.enrichment_status = "complete";
                  
                  console.log(`[BULK ENRICHMENT] ✅ AI enrichment complete for lead ${leadId}`);
                  console.log(`[BULK ENRICHMENT] AI added: phone=${!!enrichmentData.phone}, desc=${!!enrichmentData.description}, address=${!!enrichmentData.street}`);
                } catch (parseError) {
                  console.error(`[BULK ENRICHMENT] Failed to parse AI response for lead ${leadId}`);
                }
              }
            }
          } catch (aiError: any) {
            console.error(`[BULK ENRICHMENT] AI enrichment error for lead ${leadId}:`, aiError);
            // Continue anyway - Apollo enrichment already succeeded
          }
        } else {
          console.log(`[BULK ENRICHMENT] Skipping AI enrichment for lead ${leadId} - not configured or no company name`);
        }
        
        // Save enriched lead
        await kv.set(`lead:${leadId}`, fullyEnrichedLead);
        results.success++;
        console.log(`[BULK ENRICHMENT] ✅ Lead ${leadId} enriched successfully`);
        
      } catch (error: any) {
        console.error(`[BULK ENRICHMENT] Error enriching lead ${leadId}:`, error);
        results.failed++;
        results.errors.push(`Lead ${leadId}: ${error.message}`);
      }
    }
    
    console.log(`[BULK ENRICHMENT] Complete: ${results.success} succeeded, ${results.failed} failed`);
    
    return c.json({
      success: true,
      results: {
        total: leadIds.length,
        succeeded: results.success,
        failed: results.failed,
        errors: results.errors,
      }
    });
    
  } catch (error: any) {
    console.error("[BULK ENRICHMENT] Fatal error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * 2-PART ENRICHMENT FLOW (SINGLE LEAD)
 * 
 * Step 1: Reveal Person (unlocks personal data)
 *   - Endpoint: POST /v1/people/reveal
 *   - Returns: full_name, email, phone, linkedin_url
 * 
 * Step 2: Enrich Organization (unlocks company address)
 *   - Endpoint: POST /v1/organizations/enrich
 *   - Requires: organization_id OR domain
 *   - Returns: company_name, website_url, street_address, city, state, postal_code, country
 */
app.post("/make-server-2f1627d1/api/leads/:id/enrich", async (c) => {
  try {
    const { id } = c.req.param();
    
    // Get API settings from KV store (not environment variables)
    const settings = await kv.get(`api_settings:${WORKSPACE_ID}`) || {};
    const apolloKey = settings.enrichment_api_key;
    
    if (!apolloKey) {
      return c.json({ error: "Apollo API key not configured. Please configure it in Settings." }, 500);
    }
    
    console.log(`[ENRICHMENT] Starting 2-part enrichment for lead: ${id}`);
    
    // Get the lead from KV store
    const lead = await kv.get(`lead:${id}`);
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }
    
    const apolloPersonId = lead.apollo_id;
    const organizationId = lead.organization_id;
    const companyDomain = lead.company_domain;
    
    if (!apolloPersonId) {
      return c.json({ error: "Lead missing Apollo person ID - cannot enrich" }, 400);
    }
    
    // STEP 1: Reveal Person (unlocks personal data)
    console.log(`[ENRICHMENT] Step 1: Revealing person data for Apollo ID: ${apolloPersonId}`);
    
    const revealPayload = {
      id: apolloPersonId,
    };
    
    console.log(`[ENRICHMENT] Step 1 - Request payload:`, JSON.stringify(revealPayload, null, 2));
    
    const revealResponse = await fetch("https://api.apollo.io/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apolloKey,
      },
      body: JSON.stringify(revealPayload),
    });
    
    console.log(`[ENRICHMENT] Step 1 - Response status: ${revealResponse.status}`);
    console.log(`[ENRICHMENT] Step 1 - Response headers:`, Object.fromEntries(revealResponse.headers.entries()));
    
    if (!revealResponse.ok) {
      const errorText = await revealResponse.text();
      console.error(`[ENRICHMENT] Step 1 failed - Status: ${revealResponse.status}`);
      console.error(`[ENRICHMENT] Step 1 failed - Error text:`, errorText);
      
      // Try to parse as JSON for more details
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = JSON.stringify(errorJson, null, 2);
        console.error(`[ENRICHMENT] Step 1 failed - Parsed error:`, errorDetail);
      } catch (e) {
        console.error(`[ENRICHMENT] Step 1 failed - Could not parse error as JSON`);
      }
      
      return c.json({ 
        error: `Apollo people match failed (${revealResponse.status}): ${errorText || 'No error message'}`,
        apollo_id: apolloPersonId,
        status: revealResponse.status
      }, revealResponse.status);
    }
    
    const revealData = await revealResponse.json();
    console.log(`[ENRICHMENT] Step 1 complete - Response:`, JSON.stringify(revealData, null, 2));
    console.log(`[ENRICHMENT] Step 1 complete - Person revealed`);
    
    // Extract person data - /v1/people/match returns a single person object, not an array
    const person = revealData.person || {};
    
    // Also extract organization data from person response if available
    const personOrg = person.organization || {};
    console.log(`[ENRICHMENT] Organization data from person response:`, JSON.stringify(personOrg, null, 2));
    
    const enrichedPersonData = {
      full_name: `${person.first_name || ""} ${person.last_name || ""}`.trim() || lead.full_name,
      first_name: person.first_name || lead.first_name,
      last_name: person.last_name || lead.last_name,
      email: person.email || lead.email,
      phone: person.phone_numbers?.[0]?.sanitized_number || lead.phone,
      linkedin_url: person.linkedin_url || lead.linkedin_url,
      title: person.title || lead.title,
    };
    
    // STEP 2: Enrich Organization (unlocks company address)
    console.log(`[ENRICHMENT] Step 2: Enriching organization...`);
    console.log(`[ENRICHMENT] Lead has organization_id: ${organizationId || 'NONE'}`);
    console.log(`[ENRICHMENT] Lead has company_domain: ${companyDomain || 'NONE'}`);
    console.log(`[ENRICHMENT] Person org ID from Step 1: ${personOrg.id || 'NONE'}`);
    console.log(`[ENRICHMENT] Person org domain from Step 1: ${personOrg.primary_domain || 'NONE'}`);
    
    let orgPayload: any = {};
    
    // Prefer organization_id from lead, fallback to person org, then domain
    const finalOrgId = organizationId || personOrg.id;
    const finalDomain = companyDomain || personOrg.primary_domain || personOrg.website_url;
    
    let enrichedOrgData: any = {};
    let apolloOrgSuccess = false;
    
    // Build org payload - need at least org_id OR domain
    if (finalOrgId && String(finalOrgId).trim().length > 0) {
      orgPayload.organization_id = String(finalOrgId).trim();
      console.log(`[ENRICHMENT] Using organization_id: ${finalOrgId}`);
    }
    
    if (finalDomain && typeof finalDomain === 'string' && finalDomain.trim().length > 0) {
      // Clean domain - remove http/https and trailing slash
      let cleanDomain = finalDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
      
      if (cleanDomain && cleanDomain.length > 0 && !cleanDomain.includes('undefined') && cleanDomain !== 'null') {
        orgPayload.domain = cleanDomain;
        console.log(`[ENRICHMENT] Using domain fallback: ${cleanDomain}`);
      } else {
        console.warn(`[ENRICHMENT] Domain became empty or invalid after cleaning: "${finalDomain}"`);
      }
    }
    
    // Only make Apollo org request if we have valid payload with required fields
    if (orgPayload.organization_id || orgPayload.domain) {
      try {
        console.log(`[ENRICHMENT] Making Apollo org request with payload:`, JSON.stringify(orgPayload));
          const orgResponse = await fetch("https://api.apollo.io/v1/organizations/enrich", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              "X-Api-Key": apolloKey,
            },
            body: JSON.stringify(orgPayload),
          });
        
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          console.log(`[ENRICHMENT] Step 2 complete - Organization enriched`);
          
          // Extract organization data
          const organization = orgData.organization || {};
          enrichedOrgData = {
            company_name: organization.name || lead.company_name,
            company_website: organization.website_url || lead.company_domain,
            company_street: organization.street_address,
            company_city: organization.city || lead.company_city,
            company_state: organization.state || lead.company_state,
            company_postal_code: organization.postal_code,
            company_country: organization.country || lead.company_country,
            company_domain: organization.primary_domain || companyDomain,
          };
          apolloOrgSuccess = true;
        } else {
          const errorText = await orgResponse.text();
          console.error(`[ENRICHMENT] Step 2 failed - Organization enrich error:`, errorText);
        }
      } catch (orgError: any) {
        console.error(`[ENRICHMENT] Organization enrichment exception:`, orgError);
      }
    } else {
      console.warn(`[ENRICHMENT] No organization_id or domain available - skipping Apollo org enrichment`);
    }
    
    // Combine all enriched data (person + org if available)
    let fullyEnrichedLead = {
      ...lead,
      ...enrichedPersonData,
      ...enrichedOrgData,
      enriched_at: new Date().toISOString(),
      enrichment_status: apolloOrgSuccess ? "complete" : "partial",
      status: "enriched", // Move to enriched tab
    };
    
    console.log(`[ENRICHMENT] ✅ Apollo enrichment ${apolloOrgSuccess ? 'complete' : 'partial'} for lead ${id}`);
    
    // Step 3: OpenAI Company Research
    const companyName = fullyEnrichedLead.company_name;
    if (companyName && settings.ai_api_key && settings.ai_provider === 'openai') {
      try {
        console.log(`[AI ENRICHMENT] 🤖 Starting OpenAI research for company: ${companyName}`);
        
        // Call OpenAI to research the company
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.ai_api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a business research assistant. When given a company name, you provide accurate information including website, phone, description, and full address. Respond ONLY with valid JSON in this exact format: {\"website\": \"https://example.com\", \"phone\": \"+1-555-555-5555\", \"description\": \"Brief description of what the company does\", \"street\": \"123 Main St\", \"city\": \"City Name\", \"state\": \"ST\", \"zip\": \"12345\", \"country\": \"Country\"}. If you cannot find information for a field, use null.'
              },
              {
                role: 'user',
                content: `Research this company and provide complete information: ${companyName}`
              }
            ],
            temperature: 0.3,
            max_tokens: 600,
          }),
        });
        
        console.log(`[AI ENRICHMENT] OpenAI response status: ${openaiResponse.status}`);
        
        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          const aiResponse = openaiData.choices[0]?.message?.content;
          
          console.log(`[AI ENRICHMENT] Raw AI response:`, aiResponse);
          
          if (aiResponse) {
            try {
              const enrichmentData = JSON.parse(aiResponse);
              console.log(`[AI ENRICHMENT] ✅ AI found:`, enrichmentData);
              
              // Update company data with AI findings (only if Apollo didn't already provide it)
              fullyEnrichedLead.company_website = fullyEnrichedLead.company_website || enrichmentData.website;
              fullyEnrichedLead.company_phone = fullyEnrichedLead.company_phone || enrichmentData.phone;
              fullyEnrichedLead.company_description = enrichmentData.description || fullyEnrichedLead.company_description;
              
              // Update address fields (only if Apollo didn't provide them)
              fullyEnrichedLead.company_street = fullyEnrichedLead.company_street || enrichmentData.street;
              fullyEnrichedLead.company_city = fullyEnrichedLead.company_city || enrichmentData.city;
              fullyEnrichedLead.company_state = fullyEnrichedLead.company_state || enrichmentData.state;
              fullyEnrichedLead.company_postal_code = fullyEnrichedLead.company_postal_code || enrichmentData.zip;
              fullyEnrichedLead.company_country = fullyEnrichedLead.company_country || enrichmentData.country;
              
              console.log(`[AI ENRICHMENT] Saving updated lead with description: ${fullyEnrichedLead.company_description ? 'YES' : 'NO'}`);
              console.log(`[AI ENRICHMENT] Saving updated lead with phone: ${fullyEnrichedLead.company_phone ? 'YES' : 'NO'}`);
              console.log(`[AI ENRICHMENT] Saving updated lead with address: ${fullyEnrichedLead.company_street ? 'YES' : 'NO'}`);
              
              // Mark as complete if AI enrichment added company data
              fullyEnrichedLead.enrichment_status = "complete";
              
              await kv.set(`lead:${id}`, fullyEnrichedLead);
              console.log(`[AI ENRICHMENT] ✅ OpenAI enrichment complete for lead ${id}`);
            } catch (parseError) {
              console.error(`[AI ENRICHMENT] Failed to parse AI response:`, aiResponse);
            }
          }
        } else {
          const errorText = await openaiResponse.text();
          console.error(`[AI ENRICHMENT] OpenAI API error:`, errorText);
        }
      } catch (aiError: any) {
        console.error(`[AI ENRICHMENT] Error during AI enrichment:`, aiError);
        // Continue anyway - Apollo enrichment already succeeded
      }
    } else {
      if (!companyName) {
        console.log(`[AI ENRICHMENT] Skipping - no company name available`);
      } else {
        console.log(`[AI ENRICHMENT] Skipping - OpenAI API key not configured`);
      }
      // Save lead even if AI enrichment was skipped
      await kv.set(`lead:${id}`, fullyEnrichedLead);
    }
    
    console.log(`[ENRICHMENT] ✅ Complete! Lead ${id} enrichment status: ${fullyEnrichedLead.enrichment_status}`);
    
    return c.json(fullyEnrichedLead);
    
  } catch (error: any) {
    console.error("[ENRICHMENT] Fatal error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== GEO ENRICHMENT (Stage 1: Business Opportunity Insight) =====

/**
 * Stage 1: Geo Enrichment
 * Geocodes lead address and fetches satellite imagery
 * 
 * GET /api/leads/:id/geo-enrichment
 * Returns: { image_url, lat, lng, city, state, region }
 */
app.get("/make-server-2f1627d1/api/leads/:id/geo-enrichment", async (c) => {
  try {
    const { id } = c.req.param();
    console.log(`[GEO ENRICHMENT] Starting for lead ${id}`);
    
    // Get user's organization for credit tracking
    const authHeader = c.req.header("Authorization");
    const accessToken = authHeader?.split(" ")[1];
    const orgId = await getUserOrgId(accessToken);
    
    // Get lead data
    const lead = await kv.get(`lead:${id}`);
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }
    
    // Get Google Maps API key from settings
    const settings = await kv.get(`api_settings:${WORKSPACE_ID}`);
    const googleMapsKey = settings?.google_maps_api_key;
    
    if (!googleMapsKey) {
      console.error("[GEO ENRICHMENT] Google Maps API key not configured");
      return c.json({ error: "Google Maps API key not configured in settings" }, 400);
    }
    
    // Track credit usage (non-blocking - for reporting only)
    if (orgId) {
      deductCredits(
        orgId,
        CREDIT_COSTS.GOOGLE_MAPS_GEOCODING,
        `Google Maps Geocoding for lead: ${lead.first_name} ${lead.last_name}`
      ).catch(err => console.log('[CREDITS] Tracking failed (non-critical):', err));
    }
    
    // Build address string
    const addressParts = [
      lead.company_street,
      lead.company_city,
      lead.company_state,
      lead.company_postal_code,
      lead.company_country
    ].filter(Boolean);
    
    if (addressParts.length === 0) {
      console.error("[GEO ENRICHMENT] No address data available for lead");
      return c.json({ error: "No address data available for this lead" }, 400);
    }
    
    const fullAddress = addressParts.join(", ");
    console.log(`[GEO ENRICHMENT] Geocoding address: ${fullAddress}`);
    
    // Step 1: Geocode the address
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleMapsKey}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    if (!geocodeResponse.ok) {
      const errorText = await geocodeResponse.text();
      console.error("[GEO ENRICHMENT] Geocoding API error:", errorText);
      return c.json({ error: "Failed to geocode address" }, 500);
    }
    
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status !== "OK" || !geocodeData.results || geocodeData.results.length === 0) {
      console.error("[GEO ENRICHMENT] Geocoding failed:", geocodeData.status);
      return c.json({ error: `Geocoding failed: ${geocodeData.status}` }, 400);
    }
    
    const result = geocodeData.results[0];
    const location = result.geometry.location;
    const lat = location.lat;
    const lng = location.lng;
    
    console.log(`[GEO ENRICHMENT] Geocoded to: ${lat}, ${lng}`);
    
    // Extract location components
    let city = lead.company_city || "";
    let state = lead.company_state || "";
    let country = lead.company_country || "";
    
    // Parse address components from geocoding result
    for (const component of result.address_components) {
      if (component.types.includes("locality")) {
        city = component.long_name;
      }
      if (component.types.includes("administrative_area_level_1")) {
        state = component.short_name;
      }
      if (component.types.includes("country")) {
        country = component.long_name;
      }
    }
    
    // Determine region (simplified - US-focused for now)
    let region = "Unknown";
    const stateToRegion: Record<string, string> = {
      // Northeast
      "ME": "Northeast", "NH": "Northeast", "VT": "Northeast", "MA": "Northeast",
      "RI": "Northeast", "CT": "Northeast", "NY": "Northeast", "NJ": "Northeast", "PA": "Northeast",
      // Midwest
      "OH": "Midwest", "MI": "Midwest", "IN": "Midwest", "IL": "Midwest", "WI": "Midwest",
      "MN": "Midwest", "IA": "Midwest", "MO": "Midwest", "ND": "Midwest", "SD": "Midwest",
      "NE": "Midwest", "KS": "Midwest",
      // South
      "DE": "South", "MD": "South", "DC": "South", "VA": "South", "WV": "South",
      "NC": "South", "SC": "South", "GA": "South", "FL": "South", "KY": "South",
      "TN": "South", "AL": "South", "MS": "South", "AR": "South", "LA": "South",
      "OK": "South", "TX": "South",
      // West
      "MT": "West", "ID": "West", "WY": "West", "CO": "West", "NM": "West",
      "AZ": "West", "UT": "West", "NV": "West", "WA": "West", "OR": "West",
      "CA": "West", "AK": "West", "HI": "West"
    };
    
    if (country === "United States" || country === "USA") {
      region = stateToRegion[state] || "Unknown";
    }
    
    // Step 2: Get satellite image using Static Maps API
    const zoom = 19; // High zoom for property details
    const size = "600x400"; // Image dimensions
    const mapType = "satellite";
    
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&maptype=${mapType}&key=${googleMapsKey}`;
    
    console.log(`[GEO ENRICHMENT] Generated satellite image URL`);
    
    // Step 3: Fetch Google Places data for business intelligence
    let businessIntelligence = null;
    
    try {
      console.log(`[GEO ENRICHMENT] Fetching Google Places data...`);
      
      // Find Place from Text to get place_id
      const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(fullAddress)}&inputtype=textquery&fields=place_id,name,types&key=${googleMapsKey}`;
      
      const findPlaceResponse = await fetch(findPlaceUrl);
      const findPlaceData = await findPlaceResponse.json();
      
      if (findPlaceData.status === "OK" && findPlaceData.candidates && findPlaceData.candidates.length > 0) {
        const placeId = findPlaceData.candidates[0].place_id;
        console.log(`[GEO ENRICHMENT] Found place_id: ${placeId}`);
        
        // Get detailed place information
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,types,website,formatted_phone_number,editorial_summary,photos,opening_hours&key=${googleMapsKey}`;
        
        const placeDetailsResponse = await fetch(placeDetailsUrl);
        const placeDetailsData = await placeDetailsResponse.json();
        
        if (placeDetailsData.status === "OK" && placeDetailsData.result) {
          const place = placeDetailsData.result;
          console.log(`[GEO ENRICHMENT] Fetched place details for: ${place.name}`);
          
          // Extract key business data
          businessIntelligence = {
            place_id: placeId,
            business_name: place.name,
            rating: place.rating,
            total_reviews: place.user_ratings_total,
            categories: place.types || [],
            website: place.website,
            phone: place.formatted_phone_number,
            description: place.editorial_summary?.overview || null,
            reviews: (place.reviews || []).slice(0, 10).map((review: any) => ({
              author: review.author_name,
              rating: review.rating,
              text: review.text,
              time: review.time,
              relative_time: review.relative_time_description
            })),
            photos: (place.photos || []).slice(0, 5).map((photo: any) => ({
              reference: photo.photo_reference,
              width: photo.width,
              height: photo.height
            })),
            opening_hours: place.opening_hours?.weekday_text || []
          };
          
          console.log(`[GEO ENRICHMENT] Business intelligence extracted: ${businessIntelligence.total_reviews} reviews, ${businessIntelligence.reviews.length} detailed reviews`);
          
          // Step 4: Analyze with OpenAI for conversation intelligence
          const openaiApiKey = settings?.ai_api_key;
          if (openaiApiKey && businessIntelligence.reviews.length > 0) {
            console.log(`[GEO ENRICHMENT] Running OpenAI analysis for conversation intelligence...`);
            
            try {
              const analysisPrompt = `You are a sales intelligence analyst. Analyze this business to help sales reps build authentic, personal connections.

Business: ${businessIntelligence.business_name}
Location: ${city}, ${state}
Category: ${businessIntelligence.categories.join(", ")}
Rating: ${businessIntelligence.rating}★ (${businessIntelligence.total_reviews} reviews)
Description: ${businessIntelligence.description || "N/A"}
Website: ${businessIntelligence.website || "N/A"}

Customer Reviews (sample):
${businessIntelligence.reviews.map((r: any, i: number) => `${i+1}. [${r.rating}★] ${r.text.substring(0, 300)}...`).join("\n\n")}

Extract actionable sales intelligence in JSON format:

{
  "unique_features": ["Specific amenities, signature offerings, or standout characteristics mentioned"],
  "customer_love": ["Direct quotes or testimonials about what customers appreciate most"],
  "services_offered": ["List of services, offerings, or specialties identified"],
  "values_culture": ["Signals about company personality: family-owned, sustainability, excellence, community"],
  "conversation_starters": ["5 authentic, personalized opening lines a sales rep can use"],
  "pain_points": ["Problems or frustrations mentioned in reviews - sales opportunities"],
  "opportunity_insights": ["Why this business is a good fit for lawn/irrigation services"],
  "decision_maker_context": ["What the decision maker likely cares about based on business type"]
}

Be specific and use real details from the data. Make conversation starters natural and personalized.`;

              const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                  model: "gpt-4o",
                  messages: [
                    { role: "system", content: "You are a sales intelligence analyst. Extract structured, actionable insights from business data. Always respond with valid JSON." },
                    { role: "user", content: analysisPrompt }
                  ],
                  response_format: { type: "json_object" },
                  temperature: 0.3
                })
              });
              
              if (openaiResponse.ok) {
                const openaiData = await openaiResponse.json();
                const aiAnalysis = JSON.parse(openaiData.choices[0].message.content);
                businessIntelligence.ai_insights = aiAnalysis;
                console.log(`[GEO ENRICHMENT] ✅ OpenAI analysis complete`);
              } else {
                const errorText = await openaiResponse.text();
                console.error(`[GEO ENRICHMENT] OpenAI analysis failed:`, errorText);
              }
            } catch (aiError) {
              console.error(`[GEO ENRICHMENT] OpenAI analysis error:`, aiError);
              // Continue without AI insights
            }
          } else {
            if (!openaiApiKey) {
              console.log(`[GEO ENRICHMENT] Skipping OpenAI analysis - API key not configured`);
            } else {
              console.log(`[GEO ENRICHMENT] Skipping OpenAI analysis - no reviews available`);
            }
          }
        } else {
          console.log(`[GEO ENRICHMENT] Place details not found: ${placeDetailsData.status}`);
        }
      } else {
        console.log(`[GEO ENRICHMENT] Place not found via Find Place API: ${findPlaceData.status}`);
      }
    } catch (placesError) {
      console.error(`[GEO ENRICHMENT] Error fetching Places data:`, placesError);
      // Continue without business intelligence
    }
    
    // Store enrichment data on lead object (without API key)
    const geoEnrichmentData = {
      image_url: staticMapUrl,
      lat,
      lng,
      city,
      state,
      region,
      country,
      full_address: result.formatted_address,
      business_intelligence: businessIntelligence,
      enriched_at: new Date().toISOString()
    };
    
    lead.geo_enrichment = geoEnrichmentData;
    await kv.set(`lead:${id}`, lead);
    
    console.log(`[GEO ENRICHMENT] ✅ Complete for lead ${id}`);
    
    // Return with API key for immediate use (not stored)
    return c.json({
      ...geoEnrichmentData,
      google_maps_key: googleMapsKey
    });
    
  } catch (error: any) {
    console.error("[GEO ENRICHMENT] Fatal error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== STAGE 2: PROPERTY ANALYSIS (INTELLIGENT) =====

app.post("/make-server-2f1627d1/api/leads/:id/property-analysis", async (c) => {
  try {
    const { id } = c.req.param();
    console.log(`[PROPERTY ANALYSIS] Starting for lead ${id}`);
    
    // Get lead data
    const lead = await kv.get(`lead:${id}`);
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }
    
    // Check if geo enrichment exists
    if (!lead.geo_enrichment || !lead.geo_enrichment.image_url) {
      return c.json({ error: "Geo enrichment required. Run Stage 1 first." }, 400);
    }
    
    // Get API keys from settings
    const settings = await kv.get(`api_settings:${WORKSPACE_ID}`);
    console.log(`[PROPERTY ANALYSIS] Settings object:`, settings);
    console.log(`[PROPERTY ANALYSIS] Settings keys:`, settings ? Object.keys(settings) : 'null');
    
    const googleMapsKey = settings?.google_maps_api_key;
    const openaiKey = settings?.ai_api_key; // Use ai_api_key to match settings structure
    
    console.log(`[PROPERTY ANALYSIS] Google Maps Key exists:`, !!googleMapsKey);
    console.log(`[PROPERTY ANALYSIS] OpenAI Key exists:`, !!openaiKey);
    
    if (!googleMapsKey) {
      return c.json({ 
        error: "Google Maps API key not configured in settings. Please go to Settings and add your Google Maps API key under 'Business Opportunity Insight' section." 
      }, 400);
    }
    
    if (!openaiKey) {
      return c.json({ 
        error: "OpenAI API key not configured in settings. Please go to Settings and add your OpenAI API key under 'AI/LLM Provider' section." 
      }, 400);
    }
    
    console.log(`[PROPERTY ANALYSIS] Keys validated`);
    
    // ===== NEW: STAGE 0 - INTELLIGENT PRE-ANALYSIS =====
    console.log(`[PROPERTY ANALYSIS] 🧠 STAGE 0: Starting AI-guided pre-analysis...`);
    
    const companyName = lead.company_name || "";
    const address = lead.geo_enrichment.full_address || "";
    const lat = lead.geo_enrichment.lat;
    const lng = lead.geo_enrichment.lng;
    const city = lead.geo_enrichment?.city || "";
    const state = lead.geo_enrichment?.state || "";
    const region = lead.geo_enrichment?.region || determineRegion(state);
    
    // Capture overview image for pre-analysis (wider view)
    const overviewZoom = 18; // Slightly wider than normal to see context
    const overviewSize = "600x400";
    const overviewUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${overviewZoom}&size=${overviewSize}&maptype=satellite&key=${googleMapsKey}`;
    
    console.log(`[PROPERTY ANALYSIS] 📸 Capturing overview image at zoom ${overviewZoom}...`);
    
    const overviewResponse = await fetch(overviewUrl);
    if (!overviewResponse.ok) {
      console.error(`[PROPERTY ANALYSIS] Failed to fetch overview image: ${overviewResponse.status}`);
      return c.json({ error: `Failed to fetch overview image: ${overviewResponse.statusText}` }, 500);
    }
    
    const overviewBuffer = await overviewResponse.arrayBuffer();
    const overviewUint8 = new Uint8Array(overviewBuffer);
    let overviewBinaryString = '';
    const chunkSize = 8192;
    
    for (let i = 0; i < overviewUint8.length; i += chunkSize) {
      const chunk = overviewUint8.slice(i, i + chunkSize);
      overviewBinaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const overviewBase64 = btoa(overviewBinaryString);
    const overviewDataUrl = `data:image/png;base64,${overviewBase64}`;
    
    console.log(`[PROPERTY ANALYSIS] ✅ Overview image captured`);
    
    // Create intelligent pre-analysis prompt
    const preAnalysisPrompt = `You are an AI property intelligence analyst analyzing satellite imagery to determine optimal property analysis strategies.

PROPERTY CONTEXT:
- Business: ${companyName}
- Address: ${address}
- City/State: ${city}, ${state}
- Coordinates: ${lat}, ${lng}

TASKS:

1. IDENTIFY PRIMARY PROPERTY at center - what type? (residential/commercial/golf_course/park/campus/mall/etc)
2. ESTIMATE SIZE: small (<1 acre), medium (1-5 acres), large (>5 acres)
3. LIST KEY FEATURES to analyze (turf, trees, parking, buildings, etc)
4. ASSESS CONTEXT: urban/suburban/rural, property density, risk of capturing neighbors
5. RECOMMEND CAPTURE STRATEGY (be conservative - we cap at 3x3 for cost control):
   - single_point: <1 acre OR fits completely in one image
   - focused_2x2: 1-3 acres, needs moderate coverage
   - standard_3x3: >3 acres OR very large properties (golf courses, parks, campuses)
   
   IMPORTANT: Default to single_point unless you're CERTAIN the property needs multi-tile coverage.
   Urban/suburban properties should almost always be single_point unless exceptionally large.
6. IDENTIFY visible boundaries and what to focus on vs ignore

Return JSON:
{
  "property_identification": {
    "primary_type": "type",
    "description": "what you see",
    "boundaries_visible": true/false
  },
  "size_analysis": {
    "estimated_size_category": "small|medium|large|very_large",
    "estimated_acres": "estimate",
    "reasoning": "why"
  },
  "features_to_analyze": ["feature1", "feature2"],
  "context_assessment": {
    "setting": "urban|suburban|rural",
    "adjacent_properties_risk": "high|medium|low"
  },
  "recommended_strategy": {
    "capture_mode": "single_point|focused_2x2|standard_3x3|wide_4x4|xlarge_5x5",
    "zoom_level": 17-20,
    "reasoning": "why",
    "warnings": []
  },
  "analysis_focus": {
    "what_to_look_for": "focus areas",
    "what_to_ignore": "what to avoid"
  }
}`;

    console.log(`[PROPERTY ANALYSIS] 🤖 Sending overview to GPT-4 Vision...`);
    
    const preAnalysisResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI property intelligence analyst. Analyze satellite imagery to determine optimal analysis strategies. Always respond with valid JSON."
          },
          {
            role: "user",
            content: [
              { type: "text", text: preAnalysisPrompt },
              { type: "image_url", image_url: { url: overviewDataUrl, detail: "high" } }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });
    
    if (!preAnalysisResponse.ok) {
      const errorText = await preAnalysisResponse.text();
      console.error(`[PROPERTY ANALYSIS] Pre-analysis failed:`, errorText);
      return c.json({ error: `AI pre-analysis failed: ${errorText}` }, 500);
    }
    
    const preAnalysisData = await preAnalysisResponse.json();
    const preAnalysis = JSON.parse(preAnalysisData.choices[0].message.content);
    
    console.log(`[PROPERTY ANALYSIS] 🎯 AI Recommendation: ${preAnalysis.recommended_strategy.capture_mode}`);
    console.log(`[PROPERTY ANALYSIS] 📏 Estimated size: ${preAnalysis.size_analysis.estimated_acres}`);
    console.log(`[PROPERTY ANALYSIS] ⚠️ Warnings: ${preAnalysis.recommended_strategy.warnings?.join(', ') || 'None'}`);
    
    // ===== END STAGE 0 =====
    
    // Step 1: Google Places API - Property Type Detection (enhanced with AI context)
    console.log(`[PROPERTY ANALYSIS] Searching Places API for: ${companyName} at ${lat},${lng}`);
    
    let propertyType = "unknown";
    let publicData: any = null;
    
    // Try to find place by text search
    const placesSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(companyName + " " + address)}&key=${googleMapsKey}`;
    
    const placesResponse = await fetch(placesSearchUrl);
    const placesData = await placesResponse.json();
    
    if (placesData.status === "OK" && placesData.results && placesData.results.length > 0) {
      const place = placesData.results[0];
      const placeId = place.place_id;
      
      console.log(`[PROPERTY ANALYSIS] Found place: ${place.name}, ID: ${placeId}`);
      
      // Get detailed place information
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,types,formatted_address,business_status,opening_hours&key=${googleMapsKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      if (detailsData.status === "OK" && detailsData.result) {
        const details = detailsData.result;
        const types = details.types || [];
        
        // Intelligent property type detection
        if (types.includes("golf_course")) {
          propertyType = "golf_course";
        } else if (types.includes("shopping_mall") || types.includes("shopping_center")) {
          propertyType = "shopping_center";
        } else if (types.includes("park")) {
          propertyType = "park";
        } else if (types.includes("school") || types.includes("university")) {
          propertyType = "educational";
        } else if (types.includes("hospital")) {
          propertyType = "healthcare";
        } else if (types.includes("office_building") || types.includes("premise")) {
          propertyType = "office";
        } else if (types.includes("lodging") || types.includes("hotel")) {
          propertyType = "hospitality";
        } else if (types.includes("apartment") || types.includes("housing")) {
          propertyType = "residential_multi";
        } else {
          propertyType = "commercial_general";
        }
        
        publicData = {
          name: details.name,
          rating: details.rating || null,
          reviews_count: details.user_ratings_total || 0,
          types: types,
          business_status: details.business_status,
          formatted_address: details.formatted_address
        };
        
        console.log(`[PROPERTY ANALYSIS] Detected type: ${propertyType}`);
      }
    } else {
      console.log(`[PROPERTY ANALYSIS] No place found, will analyze as generic property`);
    }
    
    // Step 1.5: REAL RESEARCH - Web search + Review analysis
    console.log(`[PROPERTY ANALYSIS] 🔍 Starting REAL RESEARCH...`);
    let realResearchData: any = null;
    
    try {
      const googleMapsKey = settings?.google_maps_api_key || "";
      const customSearchEngineId = settings?.google_custom_search_id || "";
      const city = lead.geo_enrichment?.city || "";
      const researchPlaceId = placesData?.results?.[0]?.place_id || null;
      
      if (companyName && googleMapsKey) {
        realResearchData = await performRealResearch({
          companyName,
          city,
          googleMapsKey,
          customSearchEngineId,
          placeId: researchPlaceId
        });
        
        console.log(`[PROPERTY ANALYSIS] ✅ Research complete: ${realResearchData.web_search_results.length} web results, ${realResearchData.enhanced_places.recent_reviews?.length || 0} reviews`);
      } else {
        console.log(`[PROPERTY ANALYSIS] ⚠️ Skipping research: missing companyName or API key`);
      }
    } catch (researchError: any) {
      console.error(`[PROPERTY ANALYSIS] Research error:`, researchError.message);
    }
    
    // Step 1.75: SOCIAL INTELLIGENCE - Analyze target's social media presence
    console.log(`[PROPERTY ANALYSIS] 📱 Starting Social Intelligence Analysis...`);
    let socialIntelligence: any = null;
    
    try {
      const perplexityKey = settings?.perplexity_api_key || "";
      
      // DEBUG: Log what we have
      console.log(`[PROPERTY ANALYSIS] 🔑 Perplexity key from settings:`, perplexityKey ? `${perplexityKey.substring(0, 10)}...` : 'MISSING');
      console.log(`[PROPERTY ANALYSIS] 🔑 OpenAI key from settings:`, openaiKey ? `${openaiKey.substring(0, 10)}...` : 'MISSING');
      console.log(`[PROPERTY ANALYSIS] 📍 Company info: ${companyName} in ${city}, ${state}`);
      
      if (companyName && city && state && perplexityKey && openaiKey) {
        socialIntelligence = await analyzeTargetSocialPresence({
          companyName,
          city,
          state,
          perplexityKey,
          openaiKey
        });
        
        console.log(`[PROPERTY ANALYSIS] ✅ Social Intelligence complete: ${socialIntelligence.presence_score}/4 platforms found`);
        console.log(`[PROPERTY ANALYSIS] 💡 AI Summary: ${socialIntelligence.ai_insights.summary}`);
      } else {
        console.log(`[PROPERTY ANALYSIS] ⚠️ Skipping social intelligence: missing API key or company info`);
        console.log(`  - Company: ${companyName ? '✓' : '✗'}`);
        console.log(`  - City: ${city ? '✓' : '✗'}`);
        console.log(`  - State: ${state ? '✓' : '✗'}`);
        console.log(`  - Perplexity Key: ${perplexityKey ? '✓' : '✗'}`);
        console.log(`  - OpenAI Key: ${openaiKey ? '✓' : '✗'}`);
      }
    } catch (socialError: any) {
      console.error(`[PROPERTY ANALYSIS] Social intelligence error:`, socialError.message);
      // Continue without social intelligence - not critical
    }
    
    // Step 2: Generate PROPERTY-FIRST OpenAI Vision prompt
    let visionPrompt = "";
    
    // Determine season for context (region, state, city already declared in pre-analysis section above)
    const month = new Date().getMonth() + 1;
    const season = determineSeason(month, region);
    
    // Add business context AND pre-analysis insights
    let contextPrefix = "";
    if (publicData) {
      contextPrefix = `BUSINESS CONTEXT:
- Business Name: ${publicData.name}
- Business Type: ${publicData.types.join(", ")}
- Address: ${publicData.formatted_address}
- City/State: ${city}, ${state}
- Region: ${region}
- Current Season: ${season}

`;
    }
    
    // ADD PRE-ANALYSIS CONTEXT
    contextPrefix += `🧠 AI PRE-ANALYSIS GUIDANCE:
Our AI pre-screened this property and found:
- Property Type: ${preAnalysis.property_identification.primary_type}
- Estimated Size: ${preAnalysis.size_analysis.estimated_acres}
- Key Features: ${preAnalysis.features_to_analyze.join(", ")}
- Analysis Focus: ${preAnalysis.analysis_focus.what_to_look_for}
${preAnalysis.analysis_focus.what_to_ignore ? `- What to IGNORE: ${preAnalysis.analysis_focus.what_to_ignore}` : ''}
${preAnalysis.recommended_strategy.warnings && preAnalysis.recommended_strategy.warnings.length > 0 ? `- ⚠️ Warnings: ${preAnalysis.recommended_strategy.warnings.join("; ")}` : ''}

⚠️ CRITICAL: This is PROPERTY INTELLIGENCE, not business intelligence.
Your job is to analyze what you can SEE on the property, not make assumptions about the business.
Focus specifically on the features identified in the pre-analysis above.

`;
    
    // UNIVERSAL PROPERTY-FIRST PROMPT (replaces all property-type specific prompts)
    visionPrompt = `${contextPrefix}

You are an AI property analyst for landscaping and irrigation sales.
Your job is to analyze a real property using satellite imagery and infer physical features, risks, and service needs.
You must base your analysis on what is VISUALLY OBSERVABLE from the property, not generic business descriptions.

🎯 CORE PRINCIPLES:
1. DESCRIBE WHAT YOU SEE - Reference visible features (turf, trees, parking lots, patios, fairways, fields, entrances)
2. TIE INSIGHTS TO FEATURES - Every recommendation must connect to an observable element
3. EXPLAIN TECHNICAL ESTIMATES - All numbers (zone counts, acreage) must explain WHY based on visible layout
4. USE REGION + SEASON - Reference ${region} climate and ${season} season in your reasoning
5. AVOID GENERIC LANGUAGE - Never say "probably" or "likely values" - use "based on the visible..." instead

📋 ANALYSIS TASKS:

1️⃣ WHAT WE OBSERVED FROM THE PROPERTY
List 4-6 specific physical features you can see:
- Turf coverage (large continuous areas? small patches?)
- Tree placement (tree-lined perimeter? scattered? dense?)
- Hardscape features (parking lot adjacent? patio visible? walkways?)
- Layout characteristics (fairways? fields? entrance landscaping?)
- Water features (ponds? fountains? irrigation visible?)
- Property scale (compact? sprawling? multi-acre?)

2️⃣ PROPERTY PROFILE
- Setting: suburban | urban | rural
- Turf coverage: low | medium | high
- Tree density: low | medium | high
- Hardscape ratio: low | medium | high
- Estimated property scale: small (under 1 acre) | medium (1-5 acres) | large (5+ acres)

3️⃣ MAINTENANCE INTELLIGENCE
- Mowing intensity: low | medium | high (explain why based on turf layout)
- Irrigation system scale: small | medium | large (explain based on visible zones)
- Likely irrigation type: spray | rotor | drip | mixed
- Common risk areas: List 2-4 specific risks YOU CAN SEE
  Example: "Tree shade zones in northwest corner" NOT "maintaining appearance"

4️⃣ TECHNICAL ESTIMATES (with reasoning)
- Approx lot size: qualitative (e.g., "1-3 acres based on visible boundaries")
- Approx turf area sqft: range (e.g., "25,000-40,000 sqft based on continuous turf sections")
- Estimated irrigation zones: range (e.g., "4-8 zones due to separation of turf areas and tree coverage")
- Estimated mowing hours per week: range (e.g., "6-10 hours based on turf continuity and density")

5️⃣ PROPERTY-DRIVEN RISKS & OPPORTUNITIES
Instead of "they care about customer experience", identify:
- RISKS this property creates (e.g., "Large turf area → uneven coverage risk")
- OPPORTUNITIES this property enables (e.g., "Tree-lined entrance → premium curb appeal opportunity")

6️⃣ FEATURE → PROBLEM → SERVICE MAPPING
For each recommended service, trace it to a visible feature:
Example:
- Feature: "Large continuous turf near main entrance"
- Problem: "High water demand + visible dry patches in corners"
- Service: "Irrigation zone optimization"

DO NOT recommend services without citing physical evidence.

{
  "observed_features": [
    "specific feature 1 with location (e.g., 'large continuous turf near main entrance')",
    "specific feature 2 with location",
    "specific feature 3 with location",
    "specific feature 4 with location"
  ],
  "property_profile": {
    "setting": "suburban | urban | rural",
    "turf_coverage": "low | medium | high",
    "tree_density": "low | medium | high",
    "hardscape_ratio": "low | medium | high",
    "estimated_property_scale": "small | medium | large"
  },
  "maintenance_intelligence": {
    "mowing_intensity": "low | medium | high",
    "mowing_intensity_reasoning": "explain why based on visible turf layout",
    "irrigation_system_scale": "small | medium | large",
    "irrigation_reasoning": "explain based on visible separation and zones",
    "likely_irrigation_type": "spray | rotor | drip | mixed",
    "common_risk_areas": [
      "specific risk with location (e.g., 'tree shade in NW corner creating dry patches')",
      "another risk tied to visible feature"
    ]
  },
  "technical_estimates": {
    "approx_lot_size": "qualitative estimate (e.g., '1-3 acres based on visible boundaries')",
    "approx_turf_area_sqft": "range (e.g., '25,000-40,000 sqft based on continuous turf sections')",
    "estimated_irrigation_zones": "range (e.g., '4-8 zones due to separation of turf areas and tree coverage')",
    "estimated_mowing_hours_per_week": "range (e.g., '6-10 hours based on turf continuity and density')",
    "reasoning_notes": [
      "Estimates based on visible turf size and layout",
      "Zone count inferred from separation of turf areas and tree coverage"
    ]
  },
  "property_risks": [
    {
      "feature": "specific visible feature (e.g., 'large turf area near parking lot')",
      "risk": "what could go wrong (e.g., 'uneven water coverage')",
      "impact": "why it matters for this property (e.g., 'dry patches visible to customers')"
    }
  ],
  "property_opportunities": [
    {
      "feature": "specific visible feature (e.g., 'tree-lined entrance')",
      "opportunity": "what this enables (e.g., 'premium curb appeal')",
      "value": "why it matters for this property (e.g., 'first impression for visitors')"
    }
  ],
  "service_recommendations": [
    {
      "service": "service name",
      "feature": "visible feature that drives this need",
      "problem": "specific problem this solves",
      "reasoning": "why recommended based on property observation"
    }
  ],
  "conversation_starters": [
    "starter 1 - reference visible features (e.g., 'Based on the large turf areas near your entrance and parking lot, curb appeal directly impacts first impressions')",
    "starter 2 - reference visible features",
    "starter 3 - reference visible features"
  ],
  "region_season_context": "One sentence explaining why ${region} + ${season} matters for this property"
}`;
    
    // INJECT REAL RESEARCH DATA if available (for personalized conversation starters)
    if (realResearchData && (realResearchData.web_search_results?.length > 0 || realResearchData.enhanced_places?.recent_reviews?.length > 0)) {
      visionPrompt += "\n\n=== 🔍 REAL RESEARCH DATA (USE THIS FOR PERSONALIZED CONVERSATION STARTERS) ===\n";
      
      // Web search results (news, events, awards)
      if (realResearchData.web_search_results?.length > 0) {
        visionPrompt += "\n📰 RECENT NEWS & EVENTS (last 12 months):\n";
        realResearchData.web_search_results.forEach((result: any, idx: number) => {
          visionPrompt += `${idx + 1}. "${result.title}"\n   ${result.snippet}\n   Source: ${result.source}\n\n`;
        });
        visionPrompt += "\n✅ USE THESE REAL EVENTS IN YOUR CONVERSATION STARTERS!\n";
        visionPrompt += 'Example: "I saw you hosted [actual event] last month—incredible community support!"\n\n';
      }
      
      // Customer reviews  
      if (realResearchData.enhanced_places?.recent_reviews?.length > 0) {
        const reviews = realResearchData.enhanced_places.recent_reviews;
        const reviewAnalysis = realResearchData.enhanced_places.review_analysis || {};
        
        visionPrompt += `\n⭐ CUSTOMER REVIEWS ANALYSIS (${reviews.length} recent reviews):\n`;
        visionPrompt += `- Outdoor mentions: ${reviewAnalysis.outdoor_mentions || 0}\n`;
        visionPrompt += `- Appearance mentions: ${reviewAnalysis.appearance_mentions || 0}\n`;
        visionPrompt += `- Recent praise themes: ${reviewAnalysis.recent_praise || 0}\n\n`;
        
        visionPrompt += `Sample customer quotes:\n`;
        reviews.slice(0, 3).forEach((review: any, idx: number) => {
          visionPrompt += `${idx + 1}. "${review.text?.substring(0, 150) || ''}..." (${review.rating}⭐)\n`;
        });
        
        visionPrompt += `\n✅ USE REVIEW DATA IN CONVERSATION STARTERS!\n`;
        visionPrompt += 'Example: "8 customers mentioned your patio in recent reviews—clearly a customer favorite!"\n\n';
      }
      
      visionPrompt += "\n🎯 CRITICAL INSTRUCTION FOR CONVERSATION STARTERS:\n";
      visionPrompt += "- DO NOT use generic language like 'probably' or 'likely values'\n";
      visionPrompt += "- DO reference specific events, dates, and customer review themes from above\n";
      visionPrompt += "- DO sound like a sales rep who actually researched this company\n";
      visionPrompt += 'Example: "I saw you hosted the Children\'s Hospital fundraiser last month" (specific!)\n';
      visionPrompt += 'NOT: "Your business probably values community involvement" (generic!)\n\n';
    } else if (realResearchData) {
      console.log(`[PROPERTY ANALYSIS] ℹ️ No research results to add to prompt`);
    }
    
    // Step 3: USE AI RECOMMENDATION for intelligent capture strategy
    const businessName = publicData?.name || companyName || "";
    const aiCaptureMode = preAnalysis.recommended_strategy.capture_mode;
    const aiZoomLevel = preAnalysis.recommended_strategy.zoom_level;
    
    console.log(`[PROPERTY ANALYSIS] 🎯 Using AI-recommended strategy: ${aiCaptureMode} at zoom ${aiZoomLevel}`);
    
    let imageDataUrls: string[] = [];
    let satelliteTileUrls: string[] = []; // Original Google Maps URLs for UI display
    let tileMetadata: Array<{ url: string; tag: string; lat: number; lng: number }> = []; // NEW: Store with directional tags
    let analysisMode = aiCaptureMode === "single_point" ? "single-point" : "multi-tile";
    let gridSize = "1x1";
    
    if (aiCaptureMode !== "single_point") {
      // MULTI-TILE ANALYSIS: Generate intelligent grid based on AI recommendation
      analysisMode = "multi-tile";
      console.log(`[PROPERTY ANALYSIS] 🌍 AI recommends multi-tile analysis - generating intelligent grid...`);
      
      const grid = generateIntelligentSatelliteGrid(lat, lng, aiCaptureMode, aiZoomLevel, googleMapsKey);
      gridSize = grid.gridSize;
      satelliteTileUrls = grid.urls; // Store for metadata
      tileMetadata = grid.tiles; // NEW: Store tile metadata with directional tags (NW, N, NE, W, C, E, SW, S, SE)
      
      console.log(`[PROPERTY ANALYSIS] Generated ${grid.urls.length} tile URLs (${gridSize} grid at zoom ${grid.zoom})`);
      
      // Fetch and convert all tiles to base64
      for (let i = 0; i < grid.urls.length; i++) {
        const tileUrl = grid.urls[i];
        console.log(`[PROPERTY ANALYSIS] Fetching tile ${i + 1}/${grid.urls.length}...`);
        
        const tileResponse = await fetch(tileUrl);
        
        // 🔍 CRITICAL: Log response headers to diagnose blue tiles
        console.log(`[PROPERTY ANALYSIS] 🔍 Tile ${i + 1} status: ${tileResponse.status}`);
        console.log(`[PROPERTY ANALYSIS] 🔍 Tile ${i + 1} x-goog-maps-api-error: ${tileResponse.headers.get('x-goog-maps-api-error')}`);
        
        if (!tileResponse.ok) {
          console.error(`[PROPERTY ANALYSIS] ❌ Failed to fetch tile ${i + 1}: ${tileResponse.status} ${tileResponse.statusText}`);
          const errorText = await tileResponse.text();
          console.error(`[PROPERTY ANALYSIS] Error response: ${errorText.substring(0, 500)}`);
          continue; // Skip failed tiles
        }
        
        const contentType = tileResponse.headers.get('content-type');
        console.log(`[PROPERTY ANALYSIS] Tile ${i + 1} content-type: ${contentType}`);
        
        const tileBuffer = await tileResponse.arrayBuffer();
        console.log(`[PROPERTY ANALYSIS] 🔍 Tile ${i + 1} size: ${tileBuffer.byteLength} bytes`);
        
        // 🔍 DEBUG: Check if this is a placeholder/error image
        if (tileBuffer.byteLength < 1000) {
          console.warn(`[PROPERTY ANALYSIS] ⚠️ Tile ${i + 1} is suspiciously small (${tileBuffer.byteLength} bytes) - likely an error/placeholder`);
        }
        const uint8Array = new Uint8Array(tileBuffer);
        let binaryString = '';
        const chunkSize = 8192;
        
        for (let j = 0; j < uint8Array.length; j += chunkSize) {
          const chunk = uint8Array.slice(j, j + chunkSize);
          binaryString += String.fromCharCode.apply(null, Array.from(chunk));
        }
        
        const base64Image = btoa(binaryString);
        const imageDataUrl = `data:image/png;base64,${base64Image}`;
        imageDataUrls.push(imageDataUrl);
        
        console.log(`[PROPERTY ANALYSIS] Tile ${i + 1} converted (${base64Image.length} chars)`);
      }
      
      console.log(`[PROPERTY ANALYSIS] ✅ All ${imageDataUrls.length} tiles ready for analysis`);
      
      // Update prompt for large property analysis
      visionPrompt = `You are an AI property analyst for large outdoor properties (golf courses, parks, universities, campuses).
You are analyzing multiple satellite images representing different parts of the same property.
Your job is to infer landscaping and irrigation complexity based on visible layout and zone variation.
You must reason across all images together, not treat them as one small lot.
Base conclusions only on visible physical features.
Return ONLY valid JSON. No prose outside JSON.

You are analyzing a LARGE PROPERTY using ${imageDataUrls.length} satellite image tiles (${gridSize} grid).

Context:
Property name: ${publicData?.name || companyName}
Property type: ${propertyType}
City/State: ${city}, ${state}
Region: ${region}
Current season: ${season}

🧠 AI PRE-ANALYSIS GUIDANCE:
Our AI pre-screened this property and found:
- Property Type: ${preAnalysis.property_identification.primary_type}
- Estimated Size: ${preAnalysis.size_analysis.estimated_acres}
- Key Features: ${preAnalysis.features_to_analyze.join(", ")}
- Analysis Focus: ${preAnalysis.analysis_focus.what_to_look_for}
${preAnalysis.analysis_focus.what_to_ignore ? `- What to IGNORE: ${preAnalysis.analysis_focus.what_to_ignore}` : ''}
${preAnalysis.recommended_strategy.warnings && preAnalysis.recommended_strategy.warnings.length > 0 ? `- ⚠️ Warnings: ${preAnalysis.recommended_strategy.warnings.join("; ")}` : ''}

Focus specifically on the features identified above and avoid analyzing adjacent properties.

Tasks:
1. Review all provided satellite image tiles as parts of one property.
2. Identify distinct zone types visible across images:
   - fairways or fields
   - greens or sports turf
   - open lawns
   - tree-heavy zones
   - parking and road-adjacent turf
   - water features
3. Estimate overall scale (small campus, medium campus, very large campus).
4. Infer irrigation system complexity (low, medium, high) based on:
   - number of distinct turf zones
   - presence of trees and water
   - separation of turf areas
5. Infer mowing and maintenance intensity.
6. Identify property-driven risks (runoff, shaded turf, overspray, uneven watering).
7. Do NOT assume brand of irrigation equipment.
8. Do NOT use marketing or business language.
9. Base all conclusions on physical layout.

${realResearchData && (realResearchData.web_search_results?.length > 0 || realResearchData.enhanced_places?.recent_reviews?.length > 0) ? `
=== 🔍 REAL RESEARCH DATA (USE FOR CONVERSATION STARTERS) ===

${realResearchData.web_search_results?.length > 0 ? `
📰 RECENT NEWS & EVENTS:
${realResearchData.web_search_results.slice(0, 5).map((r: any, i: number) => `${i + 1}. "${r.title}"\n   ${r.snippet}`).join('\n')}

✅ USE THESE REAL EVENTS IN CONVERSATION STARTERS!
` : ''}

${realResearchData.enhanced_places?.recent_reviews?.length > 0 ? `
⭐ CUSTOMER REVIEWS (${realResearchData.enhanced_places.recent_reviews.length} recent):
${realResearchData.enhanced_places.recent_reviews.slice(0, 3).map((r: any, i: number) => `${i + 1}. "${r.text?.substring(0, 100)}..." (${r.rating}⭐)`).join('\n')}

✅ USE REVIEW DATA IN CONVERSATION STARTERS!
` : ''}

🎯 CRITICAL: Reference specific events, dates, and themes - NOT generic assumptions!
` : ''}

Output format (JSON ONLY):

{
  "observed_features": [
    "zone 1: large open turf areas visible in tiles 1-3",
    "zone 2: tree-lined fairways in tiles 4-6",
    "zone 3: parking-adjacent turf in tile 2",
    "water features visible in tiles 5,7"
  ],
  "property_profile": {
    "setting": "urban | suburban | rural",
    "overall_scale": "small_campus | medium_campus | large_campus | very_large_campus",
    "turf_coverage": "low | medium | high",
    "tree_density": "low | medium | high",
    "hardscape_ratio": "low | medium | high",
    "water_features_present": true | false
  },
  "maintenance_intelligence": {
    "mowing_intensity": "low | medium | high",
    "mowing_intensity_reasoning": "explain based on visible turf zones across tiles",
    "irrigation_system_complexity": "low | medium | high",
    "irrigation_reasoning": "explain based on zone separation and features",
    "likely_irrigation_type": "spray_rotor | mixed | drip_heavy",
    "common_risk_areas": [
      "specific risk with location (e.g., 'tree shade zones in northwest tiles')",
      "another risk tied to visible feature"
    ]
  },
  "technical_estimates": {
    "approx_total_turf_area": "range in acres (e.g., '5-15 acres based on multiple zones')",
    "estimated_irrigation_zones": "range (e.g., '15-40 zones due to visible separation')",
    "estimated_mowing_hours_per_week": "range (e.g., '20-40 hours based on zone size')",
    "maintenance_staffing_level": "small crew | medium crew | large crew",
    "reasoning_notes": [
      "Scale inferred from number of distinct turf zones across ${imageDataUrls.length} images",
      "Zone count inferred from visible separation of fields and fairways",
      "Mowing time inferred from total turf area and complexity"
    ]
  },
  "property_risks": [
    {
      "feature": "specific visible feature across tiles",
      "risk": "what could go wrong",
      "impact": "why it matters for this large property"
    }
  ],
  "property_opportunities": [
    {
      "feature": "specific visible feature",
      "opportunity": "what this enables",
      "value": "enterprise-level service opportunity"
    }
  ],
  "service_recommendations": [
    {
      "service": "service name",
      "feature": "visible feature from tile analysis",
      "problem": "specific problem this solves",
      "reasoning": "why recommended based on multi-zone observation"
    }
  ],
  "conversation_starters": [
    "starter 1 - reference visible zones OR real research data",
    "starter 2 - reference visible zones OR real research data",
    "starter 3 - reference visible zones OR real research data"
  ],
  "region_season_context": "One sentence explaining why ${region} + ${season} matters for this large property"
}`;
    } else {
      // SMALL PROPERTY: Single image analysis (existing logic)
      console.log(`[PROPERTY ANALYSIS] 📍 Small property - using single-point analysis`);
      
      satelliteTileUrls = [lead.geo_enrichment.image_url]; // Store original URL
      
      const imageResponse = await fetch(lead.geo_enrichment.image_url);
      if (!imageResponse.ok) {
        console.error(`[PROPERTY ANALYSIS] Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
        return c.json({ error: `Failed to fetch satellite image: ${imageResponse.statusText}` }, 500);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const uint8Array = new Uint8Array(imageBuffer);
      let binaryString = '';
      const chunkSize = 8192;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Image = btoa(binaryString);
      const imageDataUrl = `data:image/png;base64,${base64Image}`;
      imageDataUrls.push(imageDataUrl);
      
      console.log(`[PROPERTY ANALYSIS] Image converted to base64 (${base64Image.length} chars)`);
    }
    
    // Step 4: Call OpenAI Vision API with base64 image(s)
    console.log(`[PROPERTY ANALYSIS] Calling OpenAI Vision API...`);
    console.log(`[PROPERTY ANALYSIS] Analysis mode: ${analysisMode}`);
    console.log(`[PROPERTY ANALYSIS] Images to analyze: ${imageDataUrls.length}`);
    console.log(`[PROPERTY ANALYSIS] Using model: gpt-4o`);
    
    // Build content array with text + all images
    const userContent: any[] = [
      {
        type: "text",
        text: visionPrompt
      }
    ];
    
    // Add all images to the content
    imageDataUrls.forEach((imageUrl, index) => {
      userContent.push({
        type: "image_url",
        image_url: {
          url: imageUrl,
          detail: "high"
        }
      });
    });
    
    const systemMessage = analysisMode === "multi-tile" 
      ? "You are an AI property analyst for large outdoor properties. You analyze multiple satellite images representing different parts of the same property to assess landscaping and irrigation complexity. Always respond with valid JSON."
      : "You are a professional landscape contractor with expertise in property analysis. You analyze satellite and aerial imagery to provide detailed property assessments. Always respond with valid JSON containing your analysis.";
    
    const requestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: userContent
        }
      ],
      max_tokens: analysisMode === "multi-tile" ? 3000 : 2000, // More tokens for large properties
      temperature: 0.3,
      response_format: { type: "json_object" }
    };
    
    console.log(`[PROPERTY ANALYSIS] Request structure:`, JSON.stringify({
      model: requestBody.model,
      analysisMode: analysisMode,
      gridSize: gridSize,
      messageCount: requestBody.messages.length,
      contentItems: userContent.length,
      imageCount: imageDataUrls.length,
      hasTextContent: userContent[0].type === 'text'
    }));
    
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`[PROPERTY ANALYSIS] OpenAI API error: ${errorText}`);
      return c.json({ error: `OpenAI API error: ${errorText}` }, 500);
    }
    
    const openaiData = await openaiResponse.json();
    console.log(`[PROPERTY ANALYSIS] OpenAI full response:`, JSON.stringify(openaiData, null, 2));
    
    const aiResponse = openaiData.choices[0].message.content;
    
    console.log(`[PROPERTY ANALYSIS] OpenAI response received`);
    console.log(`[PROPERTY ANALYSIS] Raw AI response:`, aiResponse);
    console.log(`[PROPERTY ANALYSIS] AI response length:`, aiResponse?.length);
    
    // Parse the JSON response
    let visionAnalysis;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log(`[PROPERTY ANALYSIS] Cleaned response:`, cleanedResponse);
      visionAnalysis = JSON.parse(cleanedResponse);
      console.log(`[PROPERTY ANALYSIS] Successfully parsed vision analysis`);
    } catch (parseError: any) {
      console.error(`[PROPERTY ANALYSIS] Failed to parse AI response. Parse error:`, parseError.message);
      console.error(`[PROPERTY ANALYSIS] Raw response that failed:`, aiResponse);
      return c.json({ 
        error: "Failed to parse AI response", 
        details: parseError.message,
        rawResponse: aiResponse?.substring(0, 500)
      }, 500);
    }
    
    // Step 5: Combine public data + AI analysis
    const propertyAnalysis = {
      property_type: propertyType,
      public_data: publicData,
      vision_analysis: visionAnalysis,
      pre_analysis: preAnalysis, // ✅ Include AI pre-screening results
      real_research: realResearchData, // ✅ Include real research data if available
      social_intelligence: socialIntelligence, // ✅ NEW: Social media presence analysis
      analysis_metadata: {
        mode: analysisMode,
        grid_size: gridSize,
        tile_count: imageDataUrls.length,
        satellite_tiles: imageDataUrls, // ✅ Use base64 data URLs instead of Google Maps URLs to avoid API restrictions
        tile_metadata: tileMetadata.map((tile, idx) => ({ ...tile, url: imageDataUrls[idx] || tile.url })), // NEW: Include directional tags with each tile
        ai_recommended_strategy: aiCaptureMode,
        ai_recommended_zoom: aiZoomLevel,
        analyzed_at: new Date().toISOString()
      },
      analyzed_at: new Date().toISOString()
    };
    
    // Store on lead object
    lead.property_analysis = propertyAnalysis;
    await kv.set(`lead:${id}`, lead);
    
    console.log(`[PROPERTY ANALYSIS] ✅ Complete for lead ${id}`);
    
    return c.json(propertyAnalysis);
    
  } catch (error: any) {
    console.error("[PROPERTY ANALYSIS] Fatal error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== STAGE 3: SERVICE MAPPING (INTELLIGENT) =====

app.post("/make-server-2f1627d1/api/leads/:id/service-mapping", async (c) => {
  try {
    const { id } = c.req.param();
    console.log(`[SERVICE MAPPING] Starting for lead ${id}`);
    
    // Get lead data
    const lead = await kv.get(`lead:${id}`);
    if (!lead) {
      return c.json({ error: "Lead not found" }, 404);
    }
    
    // Validate Stage 1 exists
    if (!lead.geo_enrichment) {
      return c.json({ error: "Geo enrichment required. Run Stage 1 first." }, 400);
    }
    
    // Validate Stage 2 exists
    if (!lead.property_analysis) {
      return c.json({ error: "Property analysis required. Run Stage 2 first." }, 400);
    }
    
    // Get API keys
    const settings = await kv.get(`api_settings:${WORKSPACE_ID}`);
    const openaiKey = settings?.ai_api_key;
    const googleMapsKey = settings?.google_maps_api_key;
    const customSearchEngineId = settings?.google_custom_search_id;
    
    // *** CRITICAL DEBUG: Log what API keys we have ***
    console.log(`[SERVICE MAPPING] 🔑 API Keys check:`);
    console.log(`  - OpenAI: ${openaiKey ? '✓ Present' : '✗ Missing'}`);
    console.log(`  - Google Maps: ${googleMapsKey ? '✓ Present' : '✗ Missing'}`);
    console.log(`  - Custom Search ID: ${customSearchEngineId ? `✓ ${customSearchEngineId}` : '✗ Missing'}`);
    
    if (!openaiKey) {
      return c.json({ 
        error: "OpenAI API key not configured in settings. Please go to Settings and add your OpenAI API key under 'AI/LLM Provider' section." 
      }, 400);
    }
    
    // Get location info for competitor search
    const city = lead.geo_enrichment.city || "";
    const state = lead.geo_enrichment.state || "";
    const propertyLat = lead.geo_enrichment.latitude || null;
    const propertyLng = lead.geo_enrichment.longitude || null;
    
    // STEP 1: Search for real local competitors using Google Places API
    let competitorSearchResults: any[] = [];
    if (googleMapsKey && city && state) {
      competitorSearchResults = await searchCompetitors(googleMapsKey, city, state, propertyLat, propertyLng);
    } else {
      console.log(`[SERVICE MAPPING] ⚠️ Skipping competitor search - missing API key or location info`);
    }
    
    // OLD CODE - keeping for reference, can be removed later:
    /*
    if (googleMapsKey && customSearchEngineId && city && state) {
      try {
        console.log(`[SERVICE MAPPING] 🔍 Searching for local competitors in ${city}, ${state}...`);
        const searchStartTime = Date.now();
        
        // Optimized: Combine search terms into ONE query for speed
        const searchQuery = `landscape lawn care irrigation services ${city} ${state}`;
        
        try {
          const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleMapsKey}&cx=${customSearchEngineId}&q=${encodeURIComponent(searchQuery)}&num=10`;
          console.log(`[SERVICE MAPPING] 🔍 Search URL (key hidden): https://www.googleapis.com/customsearch/v1?key=***&cx=${customSearchEngineId}&q=${encodeURIComponent(searchQuery)}&num=10`);
          console.log(`[SERVICE MAPPING] 🔍 Using CSE ID: ${customSearchEngineId}`);
          console.log(`[SERVICE MAPPING] 🔍 API Key starts with: ${googleMapsKey?.substring(0, 10)}...`);
          
          // Add timeout protection
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Search timeout')), 8000)
          );
          
          const fetchPromise = fetch(searchUrl).then(r => r.json());
          const searchData = await Promise.race([fetchPromise, timeoutPromise]) as any;
          
          if (searchData.error) {
            console.log(`[SERVICE MAPPING] ⚠️ Search API error: ${searchData.error.message}`);
            console.log(`[SERVICE MAPPING] 🔍 Full error object:`, JSON.stringify(searchData.error, null, 2));
            console.log(`[SERVICE MAPPING] 🔍 Error status:`, searchData.error.status);
            console.log(`[SERVICE MAPPING] 🔍 Error code:`, searchData.error.code);
            
            // Provide helpful guidance based on error type
            if (searchData.error.message.includes('blocked')) {
              console.log(`[SERVICE MAPPING] 🔧 FIX: Your Google Maps API key has restrictions.`);
              console.log(`[SERVICE MAPPING] 🔧 Go to: https://console.cloud.google.com/apis/credentials`);
              console.log(`[SERVICE MAPPING] 🔧 Edit your API key and either:`);
              console.log(`[SERVICE MAPPING] 🔧   1. Select "Don't restrict key", OR`);
              console.log(`[SERVICE MAPPING] 🔧   2. Add "Custom Search API" to the allowed APIs list`);
            } else if (searchData.error.message.includes('not been used') || searchData.error.message.includes('disabled')) {
              console.log(`[SERVICE MAPPING] 🔧 FIX: Enable the Custom Search API`);
              console.log(`[SERVICE MAPPING] 🔧 Go to: ${searchData.error.message.match(/https:\/\/[^\s]+/)?.[0] || 'Google Cloud Console'}`);
            } else if (searchData.error.message.includes('quota')) {
              console.log(`[SERVICE MAPPING] 🔧 FIX: API quota exceeded. Wait or increase quota.`);
            }
          } else if (searchData.items) {
            console.log(`[SERVICE MAPPING] Found ${searchData.items.length} results for local competitors`);
            competitorSearchResults.push(...searchData.items.map((item: any) => ({
              title: item.title,
              link: item.link,
              snippet: item.snippet,
              query: searchQuery
            })));
          }
        } catch (searchError: any) {
          console.error(`[SERVICE MAPPING] Error searching:`, searchError.message);
        }
        
        const searchDuration = ((Date.now() - searchStartTime) / 1000).toFixed(1);
        console.log(`[SERVICE MAPPING] ✅ Found ${competitorSearchResults.length} total competitor search results in ${searchDuration}s`);
      } catch (error: any) {
        console.error(`[SERVICE MAPPING] Error during competitor search:`, error.message);
        // Continue without search results - will fall back to GPT knowledge
      }
    } else {
      console.log(`[SERVICE MAPPING] ⚠️ Skipping competitor search - missing API keys or location info`);
    }
    */
    
    // Get business profile to understand what services we offer
    // FIXED: Fetch from Postgres database, not KV store
    let businessProfile = null;
    try {
      const { data: profile } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("organization_id", MOCK_ORG_ID)
        .limit(1)
        .maybeSingle();
      
      businessProfile = profile;
    } catch (error: any) {
      console.log(`[SERVICE MAPPING] ⚠️ Could not fetch business profile:`, error.message);
    }
    
    console.log(`[SERVICE MAPPING] Business profile:`, businessProfile ? `${businessProfile.company_name} (loaded)` : 'undefined');
    
    // Determine current season based on date and region
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    // Use the state variable already declared above (removed duplicate const)
    const region = lead.geo_enrichment.region || determineRegion(state);
    const season = determineSeason(month, region);
    
    console.log(`[SERVICE MAPPING] State: ${state}, Current month: ${month}, Region: ${region}, Season: ${season}`);
    
    // Extract key property data
    const propertyType = lead.property_analysis.property_type;
    const visionAnalysis = lead.property_analysis.vision_analysis;
    const publicData = lead.property_analysis.public_data;
    const geoData = lead.geo_enrichment;
    const analysisMetadata = lead.property_analysis.analysis_metadata; // NEW: Get tile metadata
    const preAnalysis = lead.property_analysis.pre_analysis; // NEW: Get pre-analysis data
    
    // Build context-aware prompt
    const prompt = buildServiceMappingPrompt({
      propertyType,
      visionAnalysis,
      publicData,
      geoData,
      season,
      region,
      businessProfile,
      companyName: lead.company_name || "this property",
      analysisMetadata, // NEW: Include analysis metadata with tile tags
      preAnalysis, // NEW: Include pre-analysis data
      competitorSearchResults // Include all competitors (up to 5 from Google Places API)
    });
    
    // *** CRITICAL DEBUG: Log what competitor data we're sending to GPT ***
    console.log(`[SERVICE MAPPING] 🔍 DEBUG - Competitor search results count: ${competitorSearchResults.length}`);
    if (competitorSearchResults.length > 0) {
      console.log(`[SERVICE MAPPING] ✅ Passing ${competitorSearchResults.length} REAL competitors to GPT:`);
      competitorSearchResults.slice(0, 3).forEach((comp: any, idx: number) => {
        console.log(`  ${idx + 1}. ${comp.title} - ${comp.website || comp.google_maps_link || 'no website'}`);
      });
    } else {
      console.log(`[SERVICE MAPPING] ⚠️ WARNING: No competitor search results! GPT will hallucinate.`);
    }
    
    console.log(`[SERVICE MAPPING] Calling OpenAI with service mapping prompt...`);
    console.log(`[SERVICE MAPPING] 📊 Prompt size: ${prompt.length} characters, ${competitorSearchResults.length} competitors`);
    const openaiStartTime = Date.now();
    
    // Call OpenAI with timeout protection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI timeout - request took too long')), 90000) // Increased to 90 seconds for large prompts
    );
    
    const openaiPromise = fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a sales expert for landscape and property maintenance services. You analyze property data and create targeted service recommendations with compelling sales angles. CRITICAL: Always respond with VALID, PARSEABLE JSON only. Never include unescaped quotes in text fields. When including review quotes, paraphrase them or use single quotes internally. Keep responses concise to avoid token limits."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
        max_tokens: 8000 // Increased to handle 5 competitors with reviews and comprehensive analysis
      })
    });
    
    let openaiResponse;
    try {
      openaiResponse = await Promise.race([openaiPromise, timeoutPromise]) as Response;
    } catch (timeoutError: any) {
      console.error(`[SERVICE MAPPING] ⚠️ OpenAI request timeout:`, timeoutError.message);
      return c.json({ error: `OpenAI request timeout: ${timeoutError.message}` }, 504);
    }
    
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`[SERVICE MAPPING] OpenAI API error: ${errorText}`);
      return c.json({ error: `OpenAI API error: ${errorText}` }, 500);
    }
    
    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;
    const openaiDuration = ((Date.now() - openaiStartTime) / 1000).toFixed(1);
    
    console.log(`[SERVICE MAPPING] ⏱️ OpenAI completed in ${openaiDuration}s`);
    console.log(`[SERVICE MAPPING] Raw AI response length:`, aiResponse.length);
    
    // Parse response
    let serviceMapping;
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      serviceMapping = JSON.parse(cleanedResponse);
      console.log(`[SERVICE MAPPING] Successfully parsed service mapping`);
    } catch (parseError: any) {
      console.error(`[SERVICE MAPPING] ❌ Failed to parse AI response:`, parseError.message);
      console.error(`[SERVICE MAPPING] 🔍 Error position:`, parseError.message.match(/position \\d+/)?.[0]);
      console.error(`[SERVICE MAPPING] 📄 Response preview (first 500 chars):`, aiResponse.substring(0, 500));
      console.error(`[SERVICE MAPPING] 📄 Response preview (last 500 chars):`, aiResponse.substring(aiResponse.length - 500));
      
      // Try to find the error location
      const positionMatch = parseError.message.match(/position (\\d+)/);
      if (positionMatch) {
        const errorPos = parseInt(positionMatch[1]);
        const contextStart = Math.max(0, errorPos - 100);
        const contextEnd = Math.min(aiResponse.length, errorPos + 100);
        console.error(`[SERVICE MAPPING] 🎯 Context around error position ${errorPos}:`);
        console.error(aiResponse.substring(contextStart, contextEnd));
      }
      
      // Attempt to repair common JSON issues before giving up
      console.log(`[SERVICE MAPPING] 🔧 Attempting JSON repair...`);
      try {
        let repairedResponse = aiResponse.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim();
        
        // Common fixes:
        // 1. Replace smart quotes with regular quotes
        repairedResponse = repairedResponse
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2018\u2019]/g, "'");
        
        // 2. Fix common trailing comma issues
        repairedResponse = repairedResponse.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        
        // 3. Fix unterminated strings by finding unescaped quotes
        // This attempts to escape any unescaped quotes within string values
        const lines = repairedResponse.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Match lines with string values that might have unescaped quotes
          if (line.includes('":') && line.includes('"')) {
            // Simple heuristic: if we have an odd number of quotes after the colon, there's likely an issue
            const colonIndex = line.indexOf('":');
            if (colonIndex !== -1) {
              const afterColon = line.substring(colonIndex + 2);
              const quoteCount = (afterColon.match(/"/g) || []).length;
              // If odd number of quotes (excluding the closing quote), we have unescaped quotes
              if (quoteCount % 2 !== 0) {
                console.log(`[SERVICE MAPPING] 🔧 Found potential unescaped quote on line ${i + 1}`);
              }
            }
          }
        }
        repairedResponse = lines.join('\n');
        
        // 4. If response got cut off mid-JSON, try to close it
        const openBraces = (repairedResponse.match(/{/g) || []).length;
        const closeBraces = (repairedResponse.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
          console.log(`[SERVICE MAPPING] 🔧 Detected ${openBraces - closeBraces} unclosed braces - attempting to close JSON`);
          // If we have an unterminated string, try to close it first
          if (repairedResponse.match(/"[^"]*$/)) {
            console.log(`[SERVICE MAPPING] 🔧 Detected unterminated string at end - closing it`);
            repairedResponse += '"';
          }
          repairedResponse += '}'.repeat(openBraces - closeBraces);
        }
        
        // 5. Handle unterminated strings at the end specifically
        // Check if the last non-whitespace character suggests an unterminated string
        const trimmed = repairedResponse.trim();
        if (!trimmed.endsWith('}') && !trimmed.endsWith(']') && !trimmed.endsWith('"')) {
          console.log(`[SERVICE MAPPING] 🔧 Response appears truncated mid-value - attempting repair`);
          // Try to intelligently close the value
          if (trimmed.match(/:\s*"[^"]*$/)) {
            console.log(`[SERVICE MAPPING] 🔧 Closing unterminated string value`);
            repairedResponse = trimmed + '"';
          }
        }
        
        serviceMapping = JSON.parse(repairedResponse);
        console.log(`[SERVICE MAPPING] ✅ JSON repair successful!`);
      } catch (repairError: any) {
        console.error(`[SERVICE MAPPING] ❌ JSON repair failed:`, repairError.message);
        
        // Log more context for debugging
        const positionMatch = repairError.message.match(/position (\d+)/);
        if (positionMatch) {
          const errorPos = parseInt(positionMatch[1]);
          const contextStart = Math.max(0, errorPos - 200);
          const contextEnd = Math.min(aiResponse.length, errorPos + 200);
          console.error(`[SERVICE MAPPING] 🎯 Extended context around error (position ${errorPos}):`);
          console.error(aiResponse.substring(contextStart, contextEnd));
        }
        
        return c.json({ 
          error: "Failed to parse AI response", 
          details: parseError.message,
          hint: "The AI returned malformed JSON even after repair attempts. This may be due to review text with unescaped quotes or token limit truncation. The response has been reduced to 5 competitors. Check the logs for details."
        }, 500);
      }
    }
    
    // Add metadata
    const serviceMappingData = {
      ...serviceMapping,
      analyzed_at: new Date().toISOString()
    };
    
    // *** CRITICAL DEBUG: Show what competitors GPT returned ***
    const competitors = serviceMappingData?.competition_assessment?.competitors || [];
    console.log(`[SERVICE MAPPING] 📊 GPT returned ${competitors.length} competitors:`);
    competitors.slice(0, 3).forEach((comp: any, idx: number) => {
      console.log(`  ${idx + 1}. ${comp.company_name} - ${comp.business_address?.street || 'No address'}`);
    });
    
    // Store on lead object
    lead.service_mapping = serviceMappingData;
    await kv.set(`lead:${id}`, lead);
    
    console.log(`[SERVICE MAPPING] ✅ Complete for lead ${id}`);
    
    return c.json(serviceMappingData);
    
  } catch (error: any) {
    console.error("[SERVICE MAPPING] Fatal error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Helper function to determine region from state
function determineRegion(state: string): string {
  const stateUpper = state.toUpperCase();
  
  // Northeast
  if (["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"].includes(stateUpper)) {
    return "Northeast";
  }
  
  // Southeast
  if (["DE", "MD", "VA", "WV", "NC", "SC", "GA", "FL", "KY", "TN", "AL", "MS", "AR", "LA"].includes(stateUpper)) {
    return "Southeast";
  }
  
  // Midwest
  if (["OH", "IN", "IL", "MI", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"].includes(stateUpper)) {
    return "Midwest";
  }
  
  // Southwest
  if (["TX", "OK", "NM", "AZ"].includes(stateUpper)) {
    return "Southwest";
  }
  
  // West
  if (["MT", "WY", "CO", "UT", "ID", "NV", "CA", "OR", "WA", "AK", "HI"].includes(stateUpper)) {
    return "West";
  }
  
  return "Unknown";
}

// Helper function to determine season based on month and region
function determineSeason(month: number, region: string): string {
  // Month is 0-indexed (0=Jan, 11=Dec)
  
  // Northern regions have distinct seasons
  if (["Northeast", "Midwest", "West"].includes(region)) {
    if (month >= 2 && month <= 4) return "Spring";      // Mar-May
    if (month >= 5 && month <= 7) return "Summer";      // Jun-Aug
    if (month >= 8 && month <= 10) return "Fall";       // Sep-Nov
    return "Winter";                                     // Dec-Feb
  }
  
  // Southern regions have milder winters
  if (["Southeast", "Southwest"].includes(region)) {
    if (month >= 2 && month <= 5) return "Spring";      // Mar-Jun
    if (month >= 6 && month <= 8) return "Summer";      // Jul-Sep
    if (month >= 9 && month <= 11) return "Fall";       // Oct-Dec
    return "Winter";                                     // Jan-Feb
  }
  
  return "Spring"; // Default
}

// Helper function to get month name
function getMonthName(month: number): string {
  const months = ["January", "February", "March", "April", "May", "June", 
                  "July", "August", "September", "October", "November", "December"];
  return months[month - 1] || "Unknown";
}

// Helper function to determine climate zone and seasonal characteristics
function getClimateAndSeasonInfo(state: string, currentMonth: number) {
  // Define climate zones and their characteristics
  const climateData: Record<string, any> = {
    // Northern states - short growing season, significant snow
    'ME': { zone: 'Northern (Cold)', mowing_weeks: 20, growing_season: 'May - September', peak_season: 'June-August', slow_season: 'May & September', snow_potential: 'High (60-80 inches/year)', snow_season: 'November - April', snow_weeks: 20, bundle_timing: 'Late July - August', bundle_reasoning: 'Lock in winter contracts while actively providing summer service' },
    'NH': { zone: 'Northern (Cold)', mowing_weeks: 20, growing_season: 'May - September', peak_season: 'June-August', slow_season: 'May & September', snow_potential: 'High (60-80 inches/year)', snow_season: 'November - April', snow_weeks: 20, bundle_timing: 'Late July - August', bundle_reasoning: 'Lock in winter contracts while actively providing summer service' },
    'VT': { zone: 'Northern (Cold)', mowing_weeks: 20, growing_season: 'May - September', peak_season: 'June-August', slow_season: 'May & September', snow_potential: 'High (70-90 inches/year)', snow_season: 'November - April', snow_weeks: 22, bundle_timing: 'Late July - August', bundle_reasoning: 'Lock in winter contracts while actively providing summer service' },
    'MN': { zone: 'Northern (Cold)', mowing_weeks: 22, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'High (45-60 inches/year)', snow_season: 'November - March', snow_weeks: 18, bundle_timing: 'August - September', bundle_reasoning: 'Secure winter snow removal before first snowfall' },
    'WI': { zone: 'Northern (Cold)', mowing_weeks: 23, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'High (40-50 inches/year)', snow_season: 'November - March', snow_weeks: 18, bundle_timing: 'August - September', bundle_reasoning: 'Bundle summer and winter services for year-round contracts' },
    'MI': { zone: 'Northern (Moderate)', mowing_weeks: 24, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'High (30-60 inches/year)', snow_season: 'November - March', snow_weeks: 16, bundle_timing: 'August - September', bundle_reasoning: 'Establish year-round relationship during active season' },
    'NY': { zone: 'Northern (Moderate)', mowing_weeks: 25, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate to High (25-80 inches/year)', snow_season: 'November - March', snow_weeks: 15, bundle_timing: 'August - September', bundle_reasoning: 'Lock in winter services while demonstrating summer quality' },
    'MA': { zone: 'Northern (Moderate)', mowing_weeks: 26, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate (40-50 inches/year)', snow_season: 'December - March', snow_weeks: 14, bundle_timing: 'August - September', bundle_reasoning: 'Bundle services before winter season begins' },
    'CT': { zone: 'Northern (Moderate)', mowing_weeks: 26, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate (30-40 inches/year)', snow_season: 'December - March', snow_weeks: 13, bundle_timing: 'August - September', bundle_reasoning: 'Secure annual contracts in late summer' },
    'RI': { zone: 'Northern (Moderate)', mowing_weeks: 26, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate (30-40 inches/year)', snow_season: 'December - March', snow_weeks: 13, bundle_timing: 'August - September', bundle_reasoning: 'Bundle summer and winter for consistent revenue' },
    'PA': { zone: 'Northern (Moderate)', mowing_weeks: 27, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate (20-40 inches/year)', snow_season: 'December - March', snow_weeks: 12, bundle_timing: 'August - September', bundle_reasoning: 'Transition from summer to winter services seamlessly' },
    'IL': { zone: 'Midwest (Moderate)', mowing_weeks: 27, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate (20-35 inches/year)', snow_season: 'December - March', snow_weeks: 12, bundle_timing: 'August - September', bundle_reasoning: 'Year-round property care package approach' },
    'IN': { zone: 'Midwest (Moderate)', mowing_weeks: 28, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Low to Moderate (15-25 inches/year)', snow_season: 'December - February', snow_weeks: 10, bundle_timing: 'August - September', bundle_reasoning: 'Add winter services to summer contracts' },
    'OH': { zone: 'Midwest (Moderate)', mowing_weeks: 28, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate (20-30 inches/year)', snow_season: 'December - March', snow_weeks: 11, bundle_timing: 'August - September', bundle_reasoning: 'Comprehensive property management bundle' },
    'IA': { zone: 'Midwest (Moderate)', mowing_weeks: 27, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate (25-35 inches/year)', snow_season: 'November - March', snow_weeks: 13, bundle_timing: 'August - September', bundle_reasoning: 'Winter prep and snow removal add-on' },
    'MO': { zone: 'Midwest (Moderate)', mowing_weeks: 30, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'March & November', snow_potential: 'Low (10-20 inches/year)', snow_season: 'December - February', snow_weeks: 8, bundle_timing: 'September - October', bundle_reasoning: 'Optional winter services for occasional snow events' },
    
    // Mid-Atlantic and transition states
    'MD': { zone: 'Mid-Atlantic', mowing_weeks: 30, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'March & November', snow_potential: 'Low to Moderate (10-20 inches/year)', snow_season: 'December - February', snow_weeks: 8, bundle_timing: 'September - October', bundle_reasoning: 'Year-round landscape management package' },
    'DE': { zone: 'Mid-Atlantic', mowing_weeks: 30, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'March & November', snow_potential: 'Low (5-15 inches/year)', snow_season: 'December - February', snow_weeks: 6, bundle_timing: 'September - October', bundle_reasoning: 'Add winter services for comprehensive coverage' },
    'NJ': { zone: 'Mid-Atlantic', mowing_weeks: 28, growing_season: 'April - November', peak_season: 'May-October', slow_season: 'April & November', snow_potential: 'Moderate (20-30 inches/year)', snow_season: 'December - March', snow_weeks: 11, bundle_timing: 'August - September', bundle_reasoning: 'Lock in snow removal during peak mowing season' },
    'WV': { zone: 'Mid-Atlantic (Elevated)', mowing_weeks: 28, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate (20-40 inches/year)', snow_season: 'November - March', snow_weeks: 13, bundle_timing: 'August - September', bundle_reasoning: 'Mountain region year-round maintenance' },
    'VA': { zone: 'Mid-Atlantic (Mild)', mowing_weeks: 32, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'March & November', snow_potential: 'Low (5-15 inches/year)', snow_season: 'December - February', snow_weeks: 5, bundle_timing: 'September - October', bundle_reasoning: 'Light winter service add-on available' },
    'NC': { zone: 'Southeast (Moderate)', mowing_weeks: 35, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'March & November', snow_potential: 'Minimal (2-5 inches/year)', snow_season: 'December - February', snow_weeks: 3, bundle_timing: 'October - November', bundle_reasoning: 'Focus on extended growing season, minimal winter services' },
    'TN': { zone: 'Southeast (Moderate)', mowing_weeks: 32, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'March & November', snow_potential: 'Low (2-8 inches/year)', snow_season: 'December - February', snow_weeks: 4, bundle_timing: 'September - October', bundle_reasoning: 'Year-round landscape with occasional winter needs' },
    'KY': { zone: 'Southeast (Moderate)', mowing_weeks: 30, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'March & November', snow_potential: 'Low to Moderate (10-20 inches/year)', snow_season: 'December - February', snow_weeks: 8, bundle_timing: 'August - September', bundle_reasoning: 'Comprehensive property care including winter' },
    
    // Southeast - long growing season, minimal snow
    'SC': { zone: 'Southeast (Warm)', mowing_weeks: 38, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'March, November, December', snow_potential: 'Minimal (0-2 inches/year)', snow_season: 'N/A', snow_weeks: 0, bundle_timing: 'Year-round approach', bundle_reasoning: 'Focus on continuous mowing and seasonal enhancements' },
    'GA': { zone: 'Southeast (Warm)', mowing_weeks: 38, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'December-February (dormant)', snow_potential: 'Minimal (0-3 inches/year)', snow_season: 'N/A', snow_weeks: 0, bundle_timing: 'Year-round approach', bundle_reasoning: 'Emphasize extended growing season services' },
    'AL': { zone: 'Southeast (Warm)', mowing_weeks: 40, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'December-February (reduced)', snow_potential: 'None', snow_season: 'N/A', snow_weeks: 0, bundle_timing: 'Year-round approach', bundle_reasoning: 'Nearly year-round mowing and maintenance' },
    'MS': { zone: 'Southeast (Warm)', mowing_weeks: 40, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'December-February (reduced)', snow_potential: 'None', snow_season: 'N/A', snow_weeks: 0, bundle_timing: 'Year-round approach', bundle_reasoning: 'Long growing season with minimal dormancy' },
    'LA': { zone: 'Southeast (Subtropical)', mowing_weeks: 44, growing_season: 'Year-round', peak_season: 'April-October', slow_season: 'December-February (slow growth)', snow_potential: 'None', snow_season: 'N/A', snow_weeks: 0, bundle_timing: 'Year-round approach', bundle_reasoning: 'Subtropical climate requires near-continuous maintenance' },
    'FL': { zone: 'Subtropical/Tropical', mowing_weeks: 52, growing_season: 'Year-round', peak_season: 'Year-round (rainy season May-October)', slow_season: 'None', snow_potential: 'None', snow_season: 'N/A', snow_weeks: 0, bundle_timing: 'Year-round approach', bundle_reasoning: 'Tropical climate requires weekly year-round service' },
    
    // Southwest - varied by elevation, generally low snow except mountains
    'TX': { zone: 'Southwest (Varied)', mowing_weeks: 42, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'December-February (dormant warm-season)', snow_potential: 'None to Minimal', snow_season: 'N/A', snow_weeks: 0, bundle_timing: 'Year-round approach', bundle_reasoning: 'Long growing season, focus on irrigation and drought management' },
    'OK': { zone: 'Central Plains', mowing_weeks: 32, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'March & November', snow_potential: 'Low (5-10 inches/year)', snow_season: 'December - February', snow_weeks: 5, bundle_timing: 'September - October', bundle_reasoning: 'Add occasional winter services to annual contract' },
    'AR': { zone: 'Southeast (Moderate)', mowing_weeks: 36, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'December-February', snow_potential: 'Low (2-5 inches/year)', snow_season: 'December - February', snow_weeks: 3, bundle_timing: 'September - October', bundle_reasoning: 'Extended season with minimal winter needs' },
    'NM': { zone: 'Southwest (Arid)', mowing_weeks: 36, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'December-February', snow_potential: 'Low (5-15 inches/year)', snow_season: 'December - February', snow_weeks: 4, bundle_timing: 'September - October', bundle_reasoning: 'Focus on irrigation and xeriscaping, light winter services' },
    'AZ': { zone: 'Southwest (Desert)', mowing_weeks: 48, growing_season: 'Year-round (varies by elevation)', peak_season: 'March-May, September-November', slow_season: 'June-August (heat stress)', snow_potential: 'None (lowlands)', snow_season: 'N/A', snow_weeks: 0, bundle_timing: 'Year-round approach', bundle_reasoning: 'Desert landscaping requires continuous maintenance' },
    
    // West - varied climates
    'CA': { zone: 'West (Mediterranean)', mowing_weeks: 48, growing_season: 'Year-round (varies by region)', peak_season: 'March-May, September-November', slow_season: 'June-August (drought), December-February', snow_potential: 'None (coastal/valley)', snow_season: 'N/A', snow_weeks: 0, bundle_timing: 'Year-round approach', bundle_reasoning: 'Mediterranean climate with year-round growth in irrigated areas' },
    'NV': { zone: 'West (Desert/Mountain)', mowing_weeks: 40, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'December-February', snow_potential: 'Low to Moderate (varies)', snow_season: 'December - February', snow_weeks: 5, bundle_timing: 'September - October', bundle_reasoning: 'Desert climate with optional winter services' },
    'UT': { zone: 'West (Mountain)', mowing_weeks: 30, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate to High (30-60 inches/year)', snow_season: 'November - March', snow_weeks: 15, bundle_timing: 'August - September', bundle_reasoning: 'Mountain climate requires winter snow removal' },
    'CO': { zone: 'West (Mountain)', mowing_weeks: 28, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate to High (40-80 inches/year)', snow_season: 'October - April', snow_weeks: 18, bundle_timing: 'August - September', bundle_reasoning: 'Bundle summer and winter for year-round mountain property care' },
    'WY': { zone: 'West (Mountain)', mowing_weeks: 24, growing_season: 'May - September', peak_season: 'June-August', slow_season: 'May & September', snow_potential: 'High (50-100 inches/year)', snow_season: 'October - April', snow_weeks: 20, bundle_timing: 'July - August', bundle_reasoning: 'Critical to secure winter contracts during short summer season' },
    'MT': { zone: 'West (Mountain)', mowing_weeks: 22, growing_season: 'May - September', peak_season: 'June-August', slow_season: 'May & September', snow_potential: 'Moderate to High (30-70 inches/year)', snow_season: 'October - April', snow_weeks: 18, bundle_timing: 'July - August', bundle_reasoning: 'Short summer season makes winter services essential revenue' },
    'ID': { zone: 'West (Mountain)', mowing_weeks: 26, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate (20-40 inches/year)', snow_season: 'November - March', snow_weeks: 14, bundle_timing: 'August - September', bundle_reasoning: 'Mountain state with significant winter service needs' },
    'WA': { zone: 'West (Pacific)', mowing_weeks: 40, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'December-February', snow_potential: 'Low (West) / High (East & Mountains)', snow_season: 'November - March', snow_weeks: 8, bundle_timing: 'September - October', bundle_reasoning: 'Extended season with regional snow variation' },
    'OR': { zone: 'West (Pacific)', mowing_weeks: 38, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'December-February', snow_potential: 'Low (West) / Moderate (East)', snow_season: 'December - February', snow_weeks: 6, bundle_timing: 'September - October', bundle_reasoning: 'Mild coastal climate with mountain snow services' },
    
    // Plains states
    'ND': { zone: 'Northern Plains', mowing_weeks: 20, growing_season: 'May - September', peak_season: 'June-August', slow_season: 'May & September', snow_potential: 'High (40-50 inches/year)', snow_season: 'October - April', snow_weeks: 22, bundle_timing: 'July - August', bundle_reasoning: 'Short summer requires early winter contract commitment' },
    'SD': { zone: 'Northern Plains', mowing_weeks: 22, growing_season: 'April - September', peak_season: 'May-August', slow_season: 'April & September', snow_potential: 'Moderate to High (30-50 inches/year)', snow_season: 'October - April', snow_weeks: 20, bundle_timing: 'July - August', bundle_reasoning: 'Bundle to maintain year-round revenue stream' },
    'NE': { zone: 'Central Plains', mowing_weeks: 28, growing_season: 'April - October', peak_season: 'May-September', slow_season: 'April & October', snow_potential: 'Moderate (20-30 inches/year)', snow_season: 'November - March', snow_weeks: 13, bundle_timing: 'August - September', bundle_reasoning: 'Year-round property management approach' },
    'KS': { zone: 'Central Plains', mowing_weeks: 32, growing_season: 'March - November', peak_season: 'April-October', slow_season: 'March & November', snow_potential: 'Low to Moderate (10-20 inches/year)', snow_season: 'December - February', snow_weeks: 8, bundle_timing: 'September - October', bundle_reasoning: 'Add winter services for comprehensive coverage' },
    
    // Alaska and Hawaii (special cases)
    'AK': { zone: 'Subarctic/Arctic', mowing_weeks: 16, growing_season: 'June - August', peak_season: 'June-July', slow_season: 'August', snow_potential: 'Very High (50-200+ inches/year)', snow_season: 'September - May', snow_weeks: 32, bundle_timing: 'June - July', bundle_reasoning: 'Snow removal is primary service, short summer season' },
    'HI': { zone: 'Tropical', mowing_weeks: 52, growing_season: 'Year-round', peak_season: 'Year-round', slow_season: 'None', snow_potential: 'None', snow_season: 'N/A', snow_weeks: 0, bundle_timing: 'Year-round approach', bundle_reasoning: 'Tropical climate requires continuous year-round maintenance' },
  };
  
  // Get state data or use moderate default
  const stateData = climateData[state.toUpperCase()] || {
    zone: 'Temperate (Estimated)',
    mowing_weeks: 30,
    growing_season: 'March - November',
    peak_season: 'April-October',
    slow_season: 'March & November',
    snow_potential: 'Unknown - verify locally',
    snow_season: 'December - February',
    snow_weeks: 8,
    bundle_timing: 'August - September',
    bundle_reasoning: 'Bundle summer and potential winter services'
  };
  
  return stateData;
}

// Helper function to get seasonal opportunity based on current month
function getSeasonalOpportunity(month: number, climateInfo: any): string {
  // Spring (3-5): Spring cleanup, aeration, fertilization setup
  if (month >= 3 && month <= 5) {
    return "Spring cleanup, aeration, overseeding, fertilization program kickoff, irrigation system startup";
  }
  // Summer (6-8): Peak mowing season, irrigation optimization
  if (month >= 6 && month <= 8) {
    return "Peak mowing season - weekly service contracts, irrigation optimization, drought management, summer fertilization";
  }
  // Fall (9-11): Fall prep, winterization
  if (month >= 9 && month <= 11) {
    return "Fall aeration/overseeding, leaf removal programs, winterization, snow removal contract sales";
  }
  // Winter (12-2): Snow removal, winter prep, planning for spring
  return climateInfo.snow_potential !== 'None' 
    ? "Active snow removal services, de-icing, winter damage assessment, spring contract sales"
    : "Winter planning, equipment maintenance, spring contract pre-sales, dormant season pruning";
}

// Helper function to determine next season preparation
function getNextSeasonPrep(month: number, climateInfo: any): string {
  // Spring: Prep for summer
  if (month >= 3 && month <= 5) {
    return "Prepare for peak summer mowing season - lock in weekly service contracts now";
  }
  // Early-Mid Summer: Prep for fall and winter
  if (month >= 6 && month <= 8) {
    return "Start selling fall aeration/overseeding packages and winter snow removal contracts";
  }
  // Fall: Prep for winter and early spring sales
  if (month >= 9 && month <= 11) {
    return "Finalize snow removal contracts, begin early-bird spring contract sales";
  }
  // Winter: Prep for spring
  return "Prime time for spring contract sales at early-bird rates";
}

// Helper function to build service mapping prompt
function buildServiceMappingPrompt(ctx: any): string {
  const { propertyType, visionAnalysis, publicData, geoData, season, region, businessProfile, companyName, analysisMetadata, preAnalysis, competitorSearchResults } = ctx;
  
  // Add null checking for geoData
  const city = geoData?.city || "Unknown";
  const state = geoData?.state || "Unknown";
  const fullAddress = geoData?.full_address || "Unknown";
  
  // Build business context
  let businessContext = "";
  if (businessProfile) {
    businessContext = `\n\nBUSINESS PROFILE:
- Company: ${businessProfile.company_name || "Landscape Services"}
- Services Offered: ${businessProfile.services_offered || "Lawn maintenance, irrigation, landscaping"}
- Specialties: ${businessProfile.specialties || "Commercial and residential properties"}
- Target Market: ${businessProfile.target_market || "Commercial properties"}
`;
  }
  
  // Extract founding year if available for age-based analysis
  const foundingYear = publicData?.founded || null;
  const currentYear = new Date().getFullYear();
  const propertyAge = foundingYear ? currentYear - foundingYear : null;
  
  // Determine regional climate and seasonal characteristics
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const climateInfo = getClimateAndSeasonInfo(state, currentMonth);
  
  // NEW: Build tile zone context for multi-tile analysis
  let tileZoneContext = "";
  if (analysisMetadata?.tile_metadata && analysisMetadata.tile_metadata.length > 1) {
    const tileList = analysisMetadata.tile_metadata.map((tile: any) => 
      `${tile.tag} (${tile.lat.toFixed(6)}, ${tile.lng.toFixed(6)})`
    ).join(", ");
    tileZoneContext = `
🌍 MULTI-ZONE PROPERTY ANALYSIS:
This property was analyzed using ${analysisMetadata.tile_count} satellite tiles (${analysisMetadata.grid_size} grid):
Zones covered: ${tileList}

When making service recommendations, you can reference specific zones like:
- "The NW section shows..." 
- "Eastern zones (E, NE, SE) have more tree coverage..."
- "The center area (C) appears to be the main facility..."

This allows for zone-specific recommendations (e.g., "Increase irrigation in SW zone during summer")
`;
  }
  
  // NEW: Add pre-analysis context
  let preAnalysisContext = "";
  if (preAnalysis) {
    preAnalysisContext = `
🧠 AI PRE-ANALYSIS FINDINGS:
- Property Type Detected: ${preAnalysis.property_identification?.primary_type}
- Estimated Size: ${preAnalysis.size_analysis?.estimated_acres}
- Setting: ${preAnalysis.context_assessment?.setting}
- Key Features Identified: ${preAnalysis.features_to_analyze?.join(", ")}
`;
  }
  
  // Build property context
  const propertyContext = `
PROPERTY INFORMATION:
- Property Type: ${propertyType}
- Company Name: ${companyName}
- Location: ${fullAddress}
- Region: ${region}
- Current Season: ${season}
- Climate Zone: ${climateInfo.zone}
- Growing Season: ${climateInfo.growing_season}
- Mowing Weeks per Year: ${climateInfo.mowing_weeks}
- Snow Removal Potential: ${climateInfo.snow_potential}
${foundingYear ? `- Founded: ${foundingYear} (${propertyAge} years old)` : ''}
${tileZoneContext}
${preAnalysisContext}

PROPERTY ANALYSIS (from Stage 2):
${JSON.stringify(visionAnalysis, null, 2)}

${publicData ? `PUBLIC DATA (from Google Places):
${JSON.stringify(publicData, null, 2)}` : ''}
${businessContext}

PRICING CALCULATION METHODOLOGY (CRITICAL - FOLLOW EXACTLY):

**STANDARD LABOR RATE**: $85/hour for professional landscape crew

${propertyType === 'golf_course' ? `
**GOLF COURSE PRICING CALCULATIONS**:

Property Size: ${visionAnalysis?.course_features?.total_property_acres || '150-180 acres (18-hole standard)'}

WEEKLY MOWING SERVICE CALCULATION:
1. Property Size-Based Time Estimates:
   - 9-hole course (50-80 acres): 22-30 hours/week total
     * Greens: 2 hours, Fairways: 12-16 hours, Rough: 8-12 hours
   - 18-hole standard (120-180 acres): 47-66 hours/week total
     * Greens: 3-4 hours, Fairways: 24-32 hours, Rough: 16-24 hours, Tees: 4-6 hours
   - 18-hole championship (180-250 acres): 66-85 hours/week total
     * Greens: 4-5 hours, Fairways: 32-40 hours, Rough: 24-32 hours, Tees: 6-8 hours

2. Weekly Cost = Hours × $85/hour
   Example: 55 hours × $85 = $4,675/week

3. Monthly Cost = Weekly × 4.33 weeks = $20,242/month (example)

4. Annual Mowing Cost = Weekly × ${climateInfo.mowing_weeks} weeks

CREW & EQUIPMENT:
- 9-hole: 2-3 person crew
- 18-hole: 4-6 person crew
- Championship: 6-8 person crew
- Equipment savings: $80,000-150,000 (if client doesn't need to purchase)

ADDITIONAL SERVICES:
- Greens Rolling: $150-200/day
- Bunker Maintenance: $255-425/week
- Aeration (2x/year): $8,000-15,000 per event
- Overseeding: $12,000-25,000/year
- Fertilization: $15,000-30,000/year
` : propertyType === 'shopping_center' ? `
**SHOPPING CENTER PRICING CALCULATIONS**:

Property Turf: ${visionAnalysis?.property_layout?.turf_coverage || 'Estimate based on analysis'}

WEEKLY MOWING TIME:
- <20K sq ft: 3-5 hours/week
- 20-50K sq ft: 6-10 hours/week
- 50-100K sq ft: 12-18 hours/week
- 100K+ sq ft: 20-30 hours/week

Weekly Cost = Hours × $85/hour
Monthly = Weekly × 4.33
Annual = Weekly × ${climateInfo.mowing_weeks} weeks
` : `
**PRICING CALCULATIONS**:

Property Size: Use from Stage 2 analysis

TIME ESTIMATES:
- <0.5 acre: 1-2 hrs, $85-170/week
- 0.5-1 acre: 2-3 hrs, $170-255/week
- 1-3 acres: 3-6 hrs, $255-510/week
- 3-5 acres: 6-10 hrs, $510-850/week

Weekly × 4.33 = Monthly
Weekly × ${climateInfo.mowing_weeks} = Annual
`}

**REGIONAL PRICING**: ${state} - ${
  ['CA', 'NY', 'MA', 'CT', 'NJ'].includes(state) ? 'High-cost region, add 15-25%' :
  ['TX', 'FL', 'AZ', 'GA'].includes(state) ? 'Competitive market, add 5-10%' :
  'Standard pricing'
}

**REQUIREMENTS**:
- Reference actual property acreage/sq ft from Stage 2
- Show hour breakdowns by task
- Include crew size in rationale
- Show calculation: Hours × $85 × weeks

TASK:
You are a comprehensive business intelligence analyst for landscape and irrigation services. Analyze this property and create an in-depth, actionable business opportunity assessment that sales reps can use to have intelligent conversations.

YOUR ANALYSIS MUST INCLUDE:

1. COMPETITION ASSESSMENT:
   ${competitorSearchResults && competitorSearchResults.length > 0 ? `
   *** IMPORTANT: USE THE REAL SEARCH RESULTS BELOW ***
   
   I have searched Google Places API for local landscape/lawn care/irrigation providers in ${city}, ${state}.
   Below are the actual search results with REAL business data (ratings, reviews, website, phone).
   DO NOT invent companies - analyze ONLY these real businesses:
   
   ${competitorSearchResults.map((result: any, idx: number) => formatCompetitorForPrompt(result, idx)).join('\n')}
   
   ${buildCompetitorInstructions(competitorSearchResults.length)}
   ` : `
   *** NO SEARCH RESULTS AVAILABLE ***
   
   Search results were not available. In this case:
   - DO NOT invent specific company names, addresses, or fake review data
   - Instead, provide GENERAL competitive intelligence about the ${city}, ${state} landscape services market
   - Focus on typical market characteristics, common competitors types, and general positioning strategies
   - Be clear that this is general market intelligence, not specific competitor data
   `}
   
   - For each competitor (or competitor type if no search results), provide:
     * Company name (EXACT as provided in search results)
     * Business address (EXACT as provided)
     * Estimated size (Small/Medium/Large)
     * Services offered (infer from business type and reviews)
     * Pricing tier (Budget/Mid/Premium)
     * Google review rating (EXACT as provided - do not invent)
     * Total review count (EXACT as provided - do not invent)
     * 2-3 sample reviews (PARAPHRASE the review quotes shown above - do not add quotes, keep concise)
     * Strengths and weaknesses (infer from reviews provided)
     
     CRITICAL: For review quotes, ONLY use the reviews shown in the search results above.
     Keep review paraphrases SHORT (under 50 characters each) to avoid JSON issues.
     
     ** BUSINESS STABILITY & HISTORY:
     * Years in business (estimate founding year if available)
     * Business longevity indicator (Startup: <3 years, Established: 3-10 years, Veteran: 10-20 years, Legacy: 20+ years)
     * Known management changes or ownership transitions
     * Recent acquisitions, mergers, or business structure changes
     * Stability assessment (Growing/Stable/Declining/Unknown)
     
     ** MARKET POSITION & GROWTH:
     * Growth trajectory (Expanding/Stable/Declining - based on review velocity, recent locations, etc.)
     * Service area expansion patterns (e.g., "Recently expanded to neighboring towns")
     * Employee count estimate (Solo: 1-2, Small crew: 3-10, Medium: 11-25, Large: 26-50, Enterprise: 50+)
     * Fleet size estimate (Visible trucks/equipment mentions in reviews)
     * Market share indicator (Dominant/Major Player/Established/Emerging/Niche)
     
     ** DIGITAL PRESENCE SCORE:
     * Website quality (Modern/Adequate/Dated/None - assess from online presence)
     * SEO ranking estimate (Top 3/Top 10/Page 1/Lower - for "landscaping [city]" searches)
     * Social media activity (Active: posts weekly+, Moderate: monthly, Dormant: inactive, None)
     * Social follower count estimate (if visible)
     * Online advertising presence (Google Ads, Facebook Ads visible - Yes/No/Unknown)
     * Review velocity (New reviews per month estimate - High: 10+, Medium: 3-10, Low: <3)
     
     ** CUSTOMER SENTIMENT ANALYSIS:
     * Review trend direction (Improving/Stable/Declining - compare recent vs older reviews)
     * Review response rate (High: >75%, Medium: 25-75%, Low: <25%, None: 0%)
     * Recurring complaint themes (identify top 2-3 repeated issues)
     * Customer loyalty indicators (Repeat customer mentions, multi-year testimonials)
     * Sentiment score (Excellent: 4.5+, Good: 4.0-4.4, Fair: 3.5-3.9, Poor: <3.5)
     
     ** SERVICE DELIVERY INTELLIGENCE:
     * Certifications held (Licensed/Insured mentions, specific certifications)
     * Insurance coverage level (Full commercial/Basic/Unknown - from mentions)
     * Equipment sophistication (Commercial-grade/Professional/Consumer/Unknown)
     * Technology adoption score (Advanced: online booking, apps, GPS; Basic: email/phone; None: phone only)
     * Service consistency (from reviews - Highly consistent/Generally consistent/Inconsistent)
     
     ** PRICING INTELLIGENCE:
     * Pricing tier confirmation (Premium/Mid/Budget with reasoning)
     * Contract flexibility (Rigid annual contracts/Flexible terms/Month-to-month/Unknown)
     * Typical package structure (Bundled services/Ala carte/Both)
     * Seasonal promotion patterns (Early bird discounts, referral bonuses, etc.)
     * Price transparency (Published pricing/Quote required/Unclear)
     
     ** VULNERABILITY & OPPORTUNITY ANALYSIS:
     * Service gaps they don't offer (opportunities for differentiation)
     * Primary vulnerabilities (Top 2-3 weaknesses we can exploit)
     * Win probability score (High/Medium/Low - our likelihood of stealing their customers)
     * Best attack angles (Specific pain points to emphasize in sales pitch)
     * Ideal customer transition timing (When are their customers most likely to switch?)
     
   - Competitive positioning analysis: where can we differentiate?
   - Market landscape summary: Overall competitive intensity (High/Medium/Low)
   - Strategic recommendations: How to position against this competitive set

2. IRRIGATION SYSTEM INTELLIGENCE (CRITICAL - PROVIDE DETAILED REASONING):
   
   **USE SATELLITE IMAGERY ANALYSIS FROM STAGE 2:**
   - Reference turf coverage, zones, and property layout from Stage 2 vision analysis
   - Use observed irrigation zones/patterns visible in satellite imagery
   - Property dimensions to estimate system complexity
   
   ${propertyType === 'golf_course' ? `
   - Golf course irrigation systems: Identify which major system they likely use (Rain Bird, Toro, Hunter, Weathermatic, etc.)
   - METHODOLOGY: Explain HOW you determined the likely system (e.g., "Based on property age, region, and typical golf course installations in the ${region} during [timeframe]")
   - System age estimate: ${propertyAge ? `Property built in ${foundingYear}. Provide 2-3 scenarios:
     * Scenario 1: Original system from ${foundingYear} (${propertyAge} years old)
     * Scenario 2: System upgraded in [estimated year] (estimated age)
     * Scenario 3: Recent upgrade (estimated timeframe)
     * REASONING: Explain which scenario is most likely based on industry patterns` : 'Estimate based on visible features and industry standards'}
   - CITATIONS: Reference typical upgrade patterns in the industry (e.g., "Golf courses in ${region} typically upgrade irrigation every 15-20 years")
   - System complexity: Estimate zones, controllers, and coverage based on property size
   - VERIFICATION QUESTIONS: Provide 3-4 specific questions sales reps should ask to confirm system details:
     * "When was your irrigation system last upgraded?"
     * "What brand/model is your current system?"
     * "How many zones does your system have?"
     * "Are you experiencing any coverage or pressure issues?"
   - Modernization opportunities with specific examples (reference visible head spacing, coverage gaps from satellite)
   - Smart irrigation potential with ROI estimates
   ` : `
   - Common irrigation systems for ${propertyType} properties
   - METHODOLOGY: Explain reasoning for system age estimate (use building age, visible infrastructure from satellite)
   - System age scenarios with likelihood assessment
   - VERIFICATION QUESTIONS for sales calls
   - Upgrade opportunities with timing (reference actual property size and turf coverage from Stage 2)
   `}
   
   **IRRIGATION T&M BUSINESS MODEL (CRITICAL - THIS IS HOW IT REALLY WORKS):**
   - **Annual Maintenance Contract**: Spring startup + Fall winterization (2-3 hours each)
     * Often bundled "free" with lawn care contract to win the customer
     * Contract value: $300-500/year OR included free as sweetener
     * This is the CHECK TIME - not where the profit comes from
   
   - **T&M REPAIR REVENUE** (The Real Money - Incremental Revenue):
     * Broken/damaged sprinkler heads: $25-45/head × 5-15 heads = $125-675/year
     * Valve repairs/replacements: $85/hr labor + $50-200 parts = $150-400/valve
     * Pipe leaks & line breaks: $85/hr × 2-4 hours + parts = $250-500/repair
     * Controller issues: $85/hr labor + $100-400 parts = $200-600/repair
     * **Typical Annual T&M: $800-2,500 in incremental repair revenue**
   
   - **Strategy**: Repairs are discovered DURING the check visits (spring/fall)
     * Older systems ({serviceMapping.irrigation_intelligence.most_likely_age}) = more repairs = more T&M revenue
     * "While we were starting up your system, we found 8 broken heads in zones 3 and 5..."
     * This is where irrigation becomes profitable - not the check time itself

3. WEEKLY LAWN MOWING & SEASONAL REVENUE ANALYSIS (CRITICAL FOCUS):
   ${climateInfo.mowing_weeks > 0 ? `
   Based on ${state} climate (${climateInfo.zone}), analyze the WEEKLY LAWN MOWING opportunity:
   
   - Growing Season Details:
     * Season dates: ${climateInfo.growing_season}
     * Active mowing weeks: ${climateInfo.mowing_weeks} weeks per year
     * Peak season: ${climateInfo.peak_season}
     * Slow season: ${climateInfo.slow_season}
   
   - Weekly Mowing Service Analysis:
     * Property size estimate from analysis
     * Recommended mowing frequency (weekly vs. bi-weekly in peak/off-peak)
     * Crew size and equipment needed
     * Time per visit estimate (hours)
     * Pricing structure:
       - Weekly rate for this property type and size in ${state}
       - Monthly contract value (4-5 visits)
       - Annual revenue potential (${climateInfo.mowing_weeks} weeks × weekly rate)
       - Regional pricing adjustments for ${state}
   
   - Maintenance Service Bundle:
     * Core mowing service (cutting, trimming, edging, blowing)
     * Seasonal tasks (spring cleanup, fall leaf removal, aeration, overseeding)
     * Add-on services to increase ticket size
     * Fertilization and weed control programs
   
   - Revenue Maximization Strategy:
     * Annual contract value calculation
     * Add-on service opportunities per season
     * Upsell potential (pest control, mulching, landscape enhancements)
     * Total annual revenue potential from this client
   ` : ''}
   
   ${climateInfo.snow_potential !== 'None' && climateInfo.snow_weeks > 0 ? `
   - SNOW REMOVAL & WINTER SERVICES OPPORTUNITY:
     * Snow potential in ${state}: ${climateInfo.snow_potential}
     * Average snowfall season: ${climateInfo.snow_season}
     * Estimated snow events: ${climateInfo.snow_weeks} potential service calls per winter
     * Service opportunities:
       - Snow plowing/removal (per-push pricing: $XXX-$XXX per visit OR seasonal contract)
       - De-icing and salt application
       - Walkway/parking lot clearing priority
       - Emergency on-call services (premium pricing)
       - Seasonal contract vs per-event pricing comparison
     
     * STRATEGIC BUNDLE OPPORTUNITY (YEAR-ROUND PROPERTY CARE PACKAGE):
       - Summer Services: Weekly mowing + maintenance (${climateInfo.mowing_weeks} weeks)
       - Winter Services: Snow removal (${climateInfo.snow_weeks} events estimated)
       - VALUE PROPOSITION: "Single vendor, year-round coverage, priority service, predictable costs"
       - Bundle discount strategy: 10-15% savings vs. separate contracts
       - Customer lock-in benefits: Guaranteed service, no emergency vendor hunting
       - Our revenue benefits: Consistent cash flow, year-round crew utilization
     
     * TIMING STRATEGY FOR BUNDLE SALES:
       - BEST APPROACH TIME: ${climateInfo.bundle_timing}
       - REASONING: ${climateInfo.bundle_reasoning}
       - CONVERSION TACTICS:
         * Early-bird discounts (5-10% off for contracts signed 60+ days before snow season)
         * Priority service guarantees ("Guaranteed 4-hour response time for bundled clients")
         * Payment plan options (monthly billing year-round to smooth costs)
         * "Peace of mind" positioning - one call, year-round coverage
       - LOCK-IN STRATEGY: Prove quality during summer service, make winter add-on a no-brainer
       - OBJECTION HANDLING: "Locked into annual contract?" → "Cancel anytime with 30 days notice, but 95% of our bundled clients renew because they love the convenience and savings"
   ` : ''}
   
   - SEASONAL STRATEGIC TIMING:
     * Current month: ${getMonthName(currentMonth)}
     * Immediate opportunity: ${getSeasonalOpportunity(currentMonth, climateInfo)}
     * Next season preparation: ${getNextSeasonPrep(currentMonth, climateInfo)}
     * Budget cycle timing: Most commercial properties plan budgets in Q4 (Oct-Dec) for following year
     * Best approach window: ${currentMonth >= 3 && currentMonth <= 5 ? 'NOW - Spring is decision time for summer contracts' : 
                                currentMonth >= 6 && currentMonth <= 8 ? 'NOW - Peak season, upsell winter services' :
                                currentMonth >= 9 && currentMonth <= 11 ? 'NOW - Critical window for winter and spring pre-sales' :
                                'NOW - Winter planning season, early-bird spring contracts'}

4. COMPREHENSIVE SERVICE RECOMMENDATIONS:
   For EACH recommended service, provide:
   - Service name and category (CORE/SEASONAL/REPAIR/UPGRADE)
   - WHY this service is needed (detailed reasoning based on property analysis)
   - ROI PROJECTION: Estimated cost savings or revenue impact
   ${propertyType === 'golf_course' ? `- MEMBER EXPERIENCE IMPACT: How this improves playability, aesthetics, or member satisfaction` : '- CUSTOMER EXPERIENCE IMPACT: How this improves appearance, functionality, or satisfaction'}
   - Time to implement
   - Priority ranking (1-10, 1 = highest)
   
   **REQUIRED CORE SERVICE**: "Weekly Lawn Mowing & Maintenance" MUST be included with:
   - Detailed pricing breakdown (per visit: $XXX, monthly: $XXX, annual: $XXX for ${climateInfo.mowing_weeks} weeks)
   - Service scope: Mowing, trimming, edging, blowing, clippings removal
   - Frequency: Weekly during ${climateInfo.peak_season}, bi-weekly during ${climateInfo.slow_season}
   - Seasonal adjustments and scheduling
   - Bundle opportunities with fertilization, aeration, leaf removal
   ${climateInfo.snow_potential !== 'None' && climateInfo.snow_weeks > 0 ? `- Connection to winter snow removal services (year-round bundle)` : ''}
   - Annual contract value with all add-ons

5. COST STRUCTURE & TIME SAVINGS:
   - Labor cost breakdown: Current estimated annual spend on maintenance
   - Efficiency gains: How our services can reduce their workload (hours per week/month)
   - Equipment cost savings: Reduced need for their own equipment
   - Time savings quantified: "Save X hours per week" or "Reduce crew from Y to Z people"
   - Total cost comparison: Their current approach vs. our solution

6. DETAILED RATIONALE:
   - Property-specific insights (reference actual features from the analysis)
   - Seasonal timing considerations
   - Urgency factors (what needs attention now vs. later)
   - Risk mitigation (what problems are we preventing?)

7. COMPREHENSIVE SALES STRATEGY (USE ALL DATA FROM STAGES 1, 2 & 3):
   
   ** OPENING STRATEGY:
   - Best first contact method based on property type and decision-maker profile
   - Ideal contact person (use industry knowledge: golf course = superintendent, shopping center = property manager)
   - PERSONALIZED HOOK: Specific observation from Stage 2 analysis to open conversation (e.g., "I noticed your irrigation heads on the south side appear to be older Rain Bird models")
   - Credibility builder: Why they should talk to us
   - Specific call-to-action that feels low-risk (free audit, property walk, etc.)
   
   ** PAIN POINT MAPPING (CRITICAL - USE STAGE 2 DATA):
   - Extract 3-5 specific challenges from Stage 2 property analysis
   - For EACH pain point, provide:
     * Evidence from our analysis (reference specific Stage 2 insights)
     * Business impact (member complaints, cost overruns, aesthetic issues, liability, etc.)
     * Our specific solution
     * Exact talking point to use in conversation
   
   ** COMPETITIVE POSITIONING (USE STAGE 3 COMPETITION DATA):
   - For EACH competitor identified in competition_assessment:
     * Their specific weakness (from our competition analysis)
     * Our advantage on that dimension
     * One-sentence differentiation statement
     * Win strategy (how to steal their customers)
   
   ** VALUE NARRATIVE (DATA-DRIVEN STORY):
   - Current state: Paint picture using Stage 1 & 2 data ("Your 18-hole course has 156 acres with aging irrigation...")
   - Future state: What success looks like with our services
   - Transformation path: How we get them there
   - ROI headline: One compelling number from our analysis ("Save $47K annually and reduce crew hours by 25%")
   - Proof points: Similar success stories (can be realistic examples)
   - Risk reversal: Guarantee or trial offer
   
   ** DECISION MAKER PROFILE:
   - Primary decision-maker title for THIS property type
   - Key influencers in the decision
   - Decision timeline (budget cycles, seasonal factors)
   - Budget authority and approval process
   - Their key concerns based on property type and analysis
   - Success metrics they care about
   - Personal motivations (career advancement, workload reduction, looking good to board)
   
   ** CONVERSATION ROADMAP (MULTI-TOUCH SEQUENCE):
   - Provide 4-6 touches in a strategic sequence
   - For EACH touch:
     * Touch number, timing (when relative to previous touch)
     * Method (phone, email, LinkedIn, in-person, etc.)
     * Objective (what to accomplish)
     * Talking points (specific to THIS property using our data)
     * Call to action
     * Success criteria
   
   ** CLOSING TACTICS:
   - Provide 3-4 proven closing approaches
   - For EACH tactic:
     * Name of approach (Trial Close, Assumptive Close, Limited Time, etc.)
     * When to use it (what signals indicate readiness)
     * Exact script/language
     * Expected outcome
     * Fallback if unsuccessful
   
   ** RISK FACTORS:
   - Identify 3-5 risks that could prevent the sale
   - For EACH risk:
     * What could go wrong (existing contract, budget frozen, competitor relationship, etc.)
     * Likelihood (based on property type and market)
     * Mitigation strategy
     * Discovery question to uncover early
   
   ** TIMING RECOMMENDATIONS: When to approach (now vs. next season)
   ** BUDGET PLANNING: Typical project costs and annual contract values
   ** PRIORITY OPPORTUNITIES: Which services to lead with
   ** OBJECTION HANDLING: Common concerns and how to address them
   ** CONVERSATION STARTERS: Specific talking points based on property analysis

Provide your comprehensive analysis in the following JSON format:

{
  "context": {
    "current_season": "${season}",
    "region": "${region}",
    "climate_zone": "${climateInfo.zone}",
    "growing_season": "${climateInfo.growing_season}",
    "mowing_weeks": ${climateInfo.mowing_weeks},
    "snow_potential": "${climateInfo.snow_potential}",
    "property_age_years": ${propertyAge || 'null'},
    "opportunity_score": "High" | "Medium" | "Low" (based on property size, complexity, and revenue potential),
    "estimated_annual_value": "$X,XXX - $X,XXX (annual contract value range)"
  },
  "competition_assessment": {
    // 🚨 CRITICAL: If competitor search results were provided above, you MUST include ALL of them in this array. Do NOT cherry-pick or filter.
    "local_providers": [
      {
        "name": "Company name",
        "address": "Street address, City, State ZIP",
        "estimated_size": "Small/Medium/Large",
        "services": ["service 1", "service 2"],
        "pricing_tier": "Budget/Mid/Premium",
        "google_rating": 4.5,
        "review_count": 150,
        "positive_reviews": ["Review highlight 1", "Review highlight 2"],
        "critical_reviews": ["Criticism 1", "Criticism 2"],
        "strengths": "Brief description",
        "weaknesses": "Brief description",
        "business_stability": {
          "years_in_business": 12,
          "longevity_indicator": "Veteran",
          "management_changes": "Original owner retired in 2020, now run by son",
          "recent_changes": "None known",
          "stability_assessment": "Stable"
        },
        "market_position": {
          "growth_trajectory": "Stable",
          "service_area_expansion": "No recent expansion, serves same 3 towns",
          "employee_count": "Small crew: 3-10",
          "fleet_size": "4-5 trucks mentioned in reviews",
          "market_share": "Established"
        },
        "digital_presence": {
          "website_quality": "Adequate",
          "seo_ranking": "Top 10",
          "social_media_activity": "Moderate",
          "social_followers": "~500 Facebook followers",
          "online_advertising": "Yes",
          "review_velocity": "Medium: 3-10"
        },
        "customer_sentiment": {
          "review_trend": "Stable",
          "response_rate": "Low: <25%",
          "recurring_complaints": ["Late arrivals", "Communication issues"],
          "loyalty_indicators": "Several multi-year customer testimonials",
          "sentiment_score": "Good: 4.0-4.4"
        },
        "service_delivery": {
          "certifications": "Licensed & Insured",
          "insurance_coverage": "Full commercial",
          "equipment_sophistication": "Professional",
          "technology_adoption": "Basic: email/phone",
          "service_consistency": "Generally consistent"
        },
        "pricing": {
          "tier_confirmation": "Mid - competitive pricing with some flexibility",
          "contract_flexibility": "Flexible terms",
          "package_structure": "Both bundled and ala carte",
          "seasonal_promotions": "Early spring discount (10% off)",
          "price_transparency": "Quote required"
        },
        "vulnerability_analysis": {
          "service_gaps": ["No smart irrigation", "Limited snow removal"],
          "primary_vulnerabilities": ["Poor communication", "Inconsistent scheduling", "No online booking"],
          "win_probability": "Medium",
          "best_attack_angles": ["Technology & convenience", "Guaranteed response times", "Professional communication"],
          "transition_timing": "End of season (Oct-Nov) or after service failures"
        }
      }
    ],
    "our_differentiation": "How we can stand out from competition",
    "market_landscape": "Medium - 3-4 established competitors, room for differentiation",
    "strategic_recommendations": "Position on technology, customer service, and reliability. Emphasize online booking and guaranteed response times."
  },
  "irrigation_intelligence": {
    "likely_system": "Brand/type",
    "methodology": "Detailed explanation of how we determined the likely system",
    "age_scenarios": [
      {
        "scenario": "Scenario name",
        "estimated_age": "X years",
        "likelihood": "High/Medium/Low",
        "reasoning": "Why this scenario is likely or unlikely"
      }
    ],
    "most_likely_age": "Best estimate with explanation",
    "replacement_cycle": "Typical replacement timeline with citations",
    "current_technology_level": "Basic/Standard/Advanced",
    "verification_questions": ["Question 1", "Question 2", "Question 3"],
    "modernization_opportunities": ["opportunity 1 with specifics", "opportunity 2 with specifics"],
    "smart_irrigation_potential": "Assessment with ROI estimates",
    "estimated_upgrade_timing": "When they should consider upgrade with reasoning"
  },
  "recommended_services": [
    {
      "name": "Service name",
      "category": "CORE" | "SEASONAL" | "REPAIR" | "UPGRADE",
      "priority": 1-10,
      "rationale": "Detailed reasoning based on property features AND actual property size from Stage 2",
      "roi_projection": "Specific financial impact or savings",
      ${propertyType === 'golf_course' ? '"member_experience_impact": "How this improves member satisfaction",' : '"customer_experience_impact": "How this improves customer satisfaction",'}
      "time_to_implement": "Timeframe",
      "urgency": "High/Medium/Low",
      "estimated_cost": "$X,XXX - $X,XXX",
      "cost_breakdown": {
        "calculation_method": "Explain how you calculated this (hours × $85/hr × frequency)",
        "hours_per_service": "X hours (show breakdown by task)",
        "frequency": "Weekly/Bi-weekly/Monthly/Seasonal",
        "crew_size": "X person crew",
        "weekly_cost": "$X,XXX (if applicable)",
        "monthly_cost": "$X,XXX (if applicable)",
        "annual_cost": "$X,XXX"
      }
    }
  ],
  "cost_time_analysis": {
    "current_estimated_costs": {
      "annual_labor": "$X,XXX estimate",
      "equipment_costs": "$X,XXX estimate",
      "total_annual": "$X,XXX estimate"
    },
    "our_solution_costs": {
      "annual_service_contract": "$X,XXX - $X,XXX",
      "additional_services": "$X,XXX estimate"
    },
    "time_savings": {
      "hours_per_week": "X hours",
      "crew_reduction": "Current crew vs. needed crew",
      "staff_redeployment": "How they can redeploy freed staff"
    },
    "efficiency_gains": ["gain 1", "gain 2", "gain 3"],
    "cost_benefit_summary": "Overall financial comparison"
  },
  "seasonal_addons": ["Service 1", "Service 2"],
  "future_services": ["Service 1", "Service 2"],
  "actionable_insights": {
    "opening_strategy": {
      "best_first_contact_method": "Phone/Email/In-person - specify based on property type",
      "ideal_contact_person": "Title/role to target (e.g., 'Course Superintendent', 'Property Manager', 'Facilities Director')",
      "personalized_hook": "Specific observation about THEIR property to open with (e.g., 'I noticed your fairway on hole 7 has some drainage challenges')",
      "credibility_builder": "Why they should listen to us (e.g., 'We maintain 14 other golf courses in the region including [name]')",
      "call_to_action": "Specific next step to propose (e.g., 'Free irrigation system audit' or 'Walk the property together')"
    },
    "pain_point_mapping": [
      {
        "pain_point": "Specific challenge from Stage 2 analysis (e.g., 'Inconsistent turf quality on south-facing slopes')",
        "evidence": "How we know this is a problem (reference Stage 2 data)",
        "impact": "Business consequence (e.g., 'Member complaints, reduced playability, reputation risk')",
        "our_solution": "How we solve it specifically",
        "talking_point": "Exact phrase to use in conversation"
      }
    ],
    "competitive_positioning": [
      {
        "competitor_name": "Specific competitor from competition_assessment",
        "their_weakness": "Specific gap or problem (from competition analysis)",
        "our_advantage": "How we're better on this dimension",
        "differentiation_statement": "One sentence positioning (e.g., 'Unlike [competitor] who uses outdated equipment, we use GPS-guided mowers for precision')",
        "win_strategy": "Tactical approach to steal their customers"
      }
    ],
    "value_narrative": {
      "current_state_story": "Paint picture of their current situation using Stage 1 & 2 data",
      "desired_future_state": "What success looks like if they choose us",
      "transformation_path": "How we get them from current to future",
      "roi_headline": "Compelling one-liner (e.g., 'Save $47K annually while improving course conditions by 30%')",
      "proof_points": ["Similar customer success story 1", "Similar customer success story 2"],
      "risk_reversal": "What guarantee or trial we can offer (e.g., 'First month satisfaction guarantee')"
    },
    "decision_maker_profile": {
      "primary_decision_maker": "Title/role (e.g., 'General Manager')",
      "influencers": ["Other stakeholders involved (e.g., 'Board of Directors', 'Head Groundskeeper')"],
      "decision_timeline": "When they typically make these decisions",
      "budget_authority": "Who controls the budget and approval process",
      "key_concerns": ["What keeps them up at night"],
      "success_metrics": ["How they measure success (e.g., 'Member satisfaction scores', 'Budget variance')"],
      "personal_motivations": "What they personally care about (e.g., 'Looking good to board', 'Reducing workload', 'Career advancement')"
    },
    "conversation_roadmap": [
      {
        "touch_number": 1,
        "timing": "Immediately / This week / etc.",
        "method": "Phone/Email/LinkedIn/In-person",
        "objective": "What to accomplish in this touch",
        "talking_points": ["Key point 1", "Key point 2"],
        "call_to_action": "Specific ask",
        "success_criteria": "What indicates this touch worked"
      },
      {
        "touch_number": 2,
        "timing": "3-5 days after touch 1",
        "method": "Email with property analysis attachment",
        "objective": "Demonstrate expertise and value",
        "talking_points": ["Share specific insight from our analysis", "Reference competitor weakness"],
        "call_to_action": "Schedule site visit",
        "success_criteria": "Meeting booked"
      }
    ],
    "closing_tactics": [
      {
        "tactic": "Name of closing approach (e.g., 'Trial Close', 'Assumptive Close', 'Limited Time Offer')",
        "when_to_use": "Situation/signal that indicates readiness",
        "script": "Exact language to use",
        "expected_outcome": "What should happen",
        "if_unsuccessful": "Fallback strategy"
      }
    ],
    "risk_factors": [
      {
        "risk": "What could prevent the sale (e.g., 'Existing long-term contract with competitor')",
        "likelihood": "High/Medium/Low",
        "mitigation": "How to handle or work around this",
        "discovery_question": "Question to ask to uncover this risk early"
      }
    ],
    "timing_recommendation": {
      "best_approach_time": "When to reach out",
      "reasoning": "Why this timing",
      "urgency_level": "High/Medium/Low"
    },
    "budget_planning": {
      "typical_project_costs": "Cost ranges",
      "payment_structures": "Monthly/Quarterly/Annual options",
      "ROI_timeline": "When they'll see returns"
    },
    "priority_opportunities": [
      {
        "opportunity": "What to lead with",
        "why": "Reasoning",
        "talking_points": ["point 1", "point 2"]
      }
    ],
    "objection_handling": [
      {
        "objection": "Common concern",
        "response": "How to address it"
      }
    ],
    "conversation_starters": ["Specific opening line 1", "Specific opening line 2"]
  },
  "sales_angle": "A compelling 3-4 sentence pitch highlighting property characteristics, perfect-fit services, and clear ROI",
  "executive_summary": "2-3 sentence high-level overview of the opportunity"
}

CRITICAL REQUIREMENTS:
- Return ONLY valid, parseable JSON - no extra text before or after
- ESCAPE ALL QUOTES in review text and descriptions - use proper JSON escaping
- When including customer reviews or quoted text, replace internal quotes with single quotes or remove them
- Be specific and use actual property features from the analysis
- All cost estimates should be realistic and based on industry standards
- ROI projections should be concrete (percentages, dollar amounts, time savings)
- Competition research should be realistic for the location
- Irrigation system intelligence should reference actual brands and technologies
${propertyAge ? `- Use the property's ${propertyAge} year age to inform system age estimates` : ''}
- Make this actionable enough that a sales rep can walk in with confidence
- Use property-specific language throughout (e.g., "18-hole championship course" for golf courses)

🚨🚨🚨 ABSOLUTELY CRITICAL REQUIREMENTS 🚨🚨🚨

1. COMPETITION ASSESSMENT:
   - If competitor search results were provided at the beginning of this prompt, you MUST include ALL competitors in your competition_assessment.local_providers array
   - DO NOT cherry-pick, filter, summarize, or limit the number of competitors
   - If 8 competitors were provided, return all 8. If 5 were provided, return all 5
   - Use the exact company names, ratings, review counts, and website URLs provided in the search results
   
2. JSON FORMATTING:
   - Return ONLY valid, parseable JSON - no markdown code blocks, no extra text
   - PROPERLY ESCAPE all quotes within text fields using backslash (\\")
   - When including customer reviews with quotes, paraphrase or use single quotes inside
   - Example: "The team was amazing" NOT "The team said \\"great\\" work"
   - Double-check that all JSON strings are properly closed and escaped
`;
  
  return propertyContext;
}

// ===== LEAD ACTIVITIES =====

// Get all activities for a lead
app.get("/make-server-2f1627d1/api/leads/:id/activities", async (c) => {
  try {
    const { id } = c.req.param();
    
    console.log(`[ACTIVITIES] Fetching activities for lead ${id}`);
    
    // Get all activities for this lead
    const activities = await kv.getByPrefix(`lead_activity:${id}:`);
    
    // Sort by created_at descending (most recent first)
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log(`[ACTIVITIES] Found ${activities.length} activities`);
    
    return c.json(activities);
  } catch (error: any) {
    console.error("[ACTIVITIES] Error fetching activities:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Create a new activity for a lead
app.post("/make-server-2f1627d1/api/leads/:id/activities", async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    
    console.log(`[ACTIVITIES] Creating activity for lead ${id}:`, body);
    
    const { activity_type, content, created_by, follow_up_date, follow_up_action, follow_up_completed } = body;
    
    if (!activity_type || !content || !created_by) {
      return c.json({ error: "activity_type, content, and created_by are required" }, 400);
    }
    
    // Validate activity type
    const validTypes = ["call", "email", "meeting", "note"];
    if (!validTypes.includes(activity_type)) {
      return c.json({ error: `activity_type must be one of: ${validTypes.join(", ")}` }, 400);
    }
    
    const activityId = generateId();
    const now = new Date().toISOString();
    
    const activity = {
      id: activityId,
      lead_id: id,
      org_id: MOCK_ORG_ID,
      activity_type,
      content,
      created_by,
      created_at: now,
      updated_at: now,
      ...(follow_up_date && { follow_up_date }),
      ...(follow_up_action && { follow_up_action }),
      ...(follow_up_completed !== undefined && { follow_up_completed }),
    };
    
    await kv.set(`lead_activity:${id}:${activityId}`, activity);
    
    console.log(`[ACTIVITIES] Created activity ${activityId}`);
    
    return c.json(activity, 201);
  } catch (error: any) {
    console.error("[ACTIVITIES] Error creating activity:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update an activity
app.put("/make-server-2f1627d1/api/leads/:leadId/activities/:activityId", async (c) => {
  try {
    const { leadId, activityId } = c.req.param();
    const body = await c.req.json();
    
    console.log(`[ACTIVITIES] Updating activity ${activityId}`);
    
    // Get existing activity
    const existing = await kv.get(`lead_activity:${leadId}:${activityId}`);
    if (!existing) {
      return c.json({ error: "Activity not found" }, 404);
    }
    
    const { content, activity_type, follow_up_date, follow_up_action, follow_up_completed } = body;
    
    // Validate activity type if provided
    if (activity_type) {
      const validTypes = ["call", "email", "meeting", "note"];
      if (!validTypes.includes(activity_type)) {
        return c.json({ error: `activity_type must be one of: ${validTypes.join(", ")}` }, 400);
      }
    }
    
    const updated = {
      ...existing,
      content: content !== undefined ? content : existing.content,
      activity_type: activity_type !== undefined ? activity_type : existing.activity_type,
      updated_at: new Date().toISOString(),
      ...(follow_up_date !== undefined && { follow_up_date }),
      ...(follow_up_action !== undefined && { follow_up_action }),
      ...(follow_up_completed !== undefined && { follow_up_completed }),
    };
    
    await kv.set(`lead_activity:${leadId}:${activityId}`, updated);
    
    console.log(`[ACTIVITIES] Updated activity ${activityId}`);
    
    return c.json(updated);
  } catch (error: any) {
    console.error("[ACTIVITIES] Error updating activity:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete an activity
app.delete("/make-server-2f1627d1/api/leads/:leadId/activities/:activityId", async (c) => {
  try {
    const { leadId, activityId } = c.req.param();
    
    console.log(`[ACTIVITIES] Deleting activity ${activityId}`);
    
    await kv.del(`lead_activity:${leadId}:${activityId}`);
    
    console.log(`[ACTIVITIES] Deleted activity ${activityId}`);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error("[ACTIVITIES] Error deleting activity:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== CAMPAIGNS =====

app.get("/make-server-2f1627d1/api/campaigns", async (c) => {
  try {
    // Get all campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from("Campaign")
      .select("*")
      .eq("workspaceId", WORKSPACE_ID)
      .order("createdAt", { ascending: false });

    if (campaignsError) throw campaignsError;

    // Get counts for each campaign
    const result = await Promise.all((campaigns || []).map(async (camp) => {
      const { count: stepsCount } = await supabase
        .from("SequenceStep")
        .select("*", { count: "exact", head: true })
        .eq("campaignId", camp.id);

      const { count: leadsCount } = await supabase
        .from("CampaignLead")
        .select("*", { count: "exact", head: true })
        .eq("campaignId", camp.id);

      return {
        id: camp.id,
        name: camp.name,
        goal: camp.goal,
        status: camp.status,
        stepsCount: stepsCount || 0,
        leadsCount: leadsCount || 0,
        createdAt: camp.createdAt,
      };
    }));
    
    return c.json(result);
  } catch (error: any) {
    console.error("Error listing campaigns:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-2f1627d1/api/campaigns", async (c) => {
  try {
    const body = await c.req.json();
    
    const now = new Date().toISOString();
    
    const { data: campaign, error } = await supabase
      .from("Campaign")
      .insert({
        id: generateId(),
        workspaceId: WORKSPACE_ID,
        name: body.name || "New Campaign",
        goal: body.goal || null,
        status: "draft",
        sendingRules: body.sendingRules || {},
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;
    
    return c.json({
      id: campaign.id,
      name: campaign.name,
      goal: campaign.goal,
      status: campaign.status,
    });
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-2f1627d1/api/campaigns/:id/steps", async (c) => {
  try {
    const campaignId = c.req.param("id");
    const body = await c.req.json();
    const { steps } = body;
    
    if (!steps || !Array.isArray(steps)) {
      return c.json({ error: "steps array required" }, 400);
    }
    
    // Delete existing steps
    await supabase
      .from("SequenceStep")
      .delete()
      .eq("campaignId", campaignId);
    
    // Create new steps
    const newSteps = steps.map((step, i) => ({
      id: generateId(),
      campaignId,
      stepOrder: i + 1,
      delayDays: step.delayDays || 0,
      subjectTemplate: step.subjectTemplate || "",
      bodyTemplate: step.bodyTemplate || "",
      aiInstructions: step.aiInstructions || null,
    }));

    if (newSteps.length > 0) {
      const { error } = await supabase
        .from("SequenceStep")
        .insert(newSteps);

      if (error) throw error;
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error setting campaign steps:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-2f1627d1/api/campaigns/:id/leads", async (c) => {
  try {
    const campaignId = c.req.param("id");
    const body = await c.req.json();
    const { leadIds } = body;
    
    if (!leadIds || !Array.isArray(leadIds)) {
      return c.json({ error: "leadIds array required" }, 400);
    }
    
    console.log(`[CAMPAIGN LEADS] Adding ${leadIds.length} leads to campaign ${campaignId}`);
    
    // STEP 1: Sync leads from KV to Postgres
    // Check which leads exist in Postgres
    const { data: existingPostgresLeads } = await supabase
      .from("Lead")
      .select("id")
      .in("id", leadIds);
    
    const existingPostgresLeadIds = new Set((existingPostgresLeads || []).map(l => l.id));
    const leadsToSync = leadIds.filter(id => !existingPostgresLeadIds.has(id));
    
    console.log(`[CAMPAIGN LEADS] ${existingPostgresLeadIds.size} leads already in Postgres, ${leadsToSync.length} need syncing`);
    
    // Sync missing leads from KV to Postgres
    if (leadsToSync.length > 0) {
      const leadsToInsert = [];
      
      for (const leadId of leadsToSync) {
        const kvLead = await kv.get(`lead:${leadId}`);
        
        if (!kvLead) {
          console.error(`[CAMPAIGN LEADS] Lead ${leadId} not found in KV store`);
          continue;
        }
        
        // Map KV lead to Postgres Lead schema
        const postgresLead = {
          id: kvLead.id,
          workspaceId: WORKSPACE_ID,
          icpRunId: kvLead.icp_run_id || null,
          status: kvLead.status || "discovered",
          firstName: kvLead.first_name || null,
          lastName: kvLead.last_name || null,
          title: kvLead.title || null,
          linkedinUrl: kvLead.linkedin_url || null,
          companyName: kvLead.company_name || null,
          companyDomain: kvLead.company_domain || null,
          companySize: kvLead.company_size || null,
          industry: kvLead.industry || null,
          city: kvLead.city || null,
          state: kvLead.state || null,
          country: kvLead.country || null,
          discoveryData: kvLead.discovery_data || {},
          dedupeKey: kvLead.dedupe_key || null,
          createdAt: kvLead.created_at || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        leadsToInsert.push(postgresLead);
      }
      
      if (leadsToInsert.length > 0) {
        console.log(`[CAMPAIGN LEADS] Syncing ${leadsToInsert.length} leads to Postgres`);
        const { error: insertError } = await supabase
          .from("Lead")
          .insert(leadsToInsert);
        
        if (insertError) {
          console.error(`[CAMPAIGN LEADS] Error syncing leads to Postgres:`, insertError);
          throw insertError;
        }
        
        console.log(`[CAMPAIGN LEADS] ✅ Successfully synced ${leadsToInsert.length} leads to Postgres`);
      }
    }
    
    // STEP 2: Check which leads already exist in this campaign
    const { data: existingCampaignLeads } = await supabase
      .from("CampaignLead")
      .select("leadId")
      .eq("campaignId", campaignId)
      .in("leadId", leadIds);

    const existingLeadIds = new Set((existingCampaignLeads || []).map(l => l.leadId));
    const newLeadIds = leadIds.filter(id => !existingLeadIds.has(id));

    console.log(`[CAMPAIGN LEADS] ${existingLeadIds.size} leads already in campaign, ${newLeadIds.length} new leads to add`);

    // STEP 3: Add new leads to campaign
    if (newLeadIds.length > 0) {
      const now = new Date().toISOString();
      const campaignLeads = newLeadIds.map(leadId => ({
        id: generateId(),
        campaignId,
        leadId,
        status: "queued",
        currentStepOrder: null,
        nextScheduledDate: null,
        createdAt: now,
        updatedAt: now,
      }));

      const { error } = await supabase
        .from("CampaignLead")
        .insert(campaignLeads);

      if (error) throw error;
      
      console.log(`[CAMPAIGN LEADS] ✅ Successfully added ${newLeadIds.length} leads to campaign`);
    }
    
    return c.json({ success: true, added: newLeadIds.length, skipped: existingLeadIds.size });
  } catch (error: any) {
    console.error("Error adding leads to campaign:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get single campaign details
app.get("/make-server-2f1627d1/api/campaigns/:id", async (c) => {
  try {
    const campaignId = c.req.param("id");
    
    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("Campaign")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return c.json({ error: "Campaign not found" }, 404);
    }

    // Get steps
    const { data: steps } = await supabase
      .from("SequenceStep")
      .select("*")
      .eq("campaignId", campaignId)
      .order("stepOrder", { ascending: true });

    // Get campaign leads with lead details
    const { data: campaignLeads } = await supabase
      .from("CampaignLead")
      .select(`
        *,
        lead:Lead(*)
      `)
      .eq("campaignId", campaignId);

    return c.json({
      ...campaign,
      steps: steps || [],
      campaignLeads: campaignLeads || [],
    });
  } catch (error: any) {
    console.error("Error getting campaign:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update campaign
app.patch("/make-server-2f1627d1/api/campaigns/:id", async (c) => {
  try {
    const campaignId = c.req.param("id");
    const body = await c.req.json();
    
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };
    if (body.name) updates.name = body.name;
    if (body.goal !== undefined) updates.goal = body.goal;
    if (body.status) updates.status = body.status;
    if (body.sendingRules) updates.sendingRules = body.sendingRules;

    const { data: campaign, error } = await supabase
      .from("Campaign")
      .update(updates)
      .eq("id", campaignId)
      .select()
      .single();

    if (error) throw error;
    
    return c.json(campaign);
  } catch (error: any) {
    console.error("Error updating campaign:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Delete campaign
app.delete("/make-server-2f1627d1/api/campaigns/:id", async (c) => {
  try {
    const campaignId = c.req.param("id");
    
    // Foreign key constraints will cascade delete related records
    const { error } = await supabase
      .from("Campaign")
      .delete()
      .eq("id", campaignId);

    if (error) throw error;
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting campaign:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== MESSAGES =====

app.post("/make-server-2f1627d1/api/campaigns/:id/generate-messages", async (c) => {
  try {
    const campaignId = c.req.param("id");
    
    console.log(`[GENERATE MESSAGES] Starting AI-powered generation for campaign ${campaignId}`);
    
    // Get campaign from Postgres
    const { data: campaign, error: campaignError } = await supabase
      .from("Campaign")
      .select("*")
      .eq("id", campaignId)
      .single();
    
    if (campaignError || !campaign) {
      console.error(`[GENERATE MESSAGES] Campaign not found: ${campaignId}`);
      return c.json({ error: "Campaign not found" }, 404);
    }
    
    // Get steps from Postgres
    const { data: steps } = await supabase
      .from("SequenceStep")
      .select("*")
      .eq("campaignId", campaignId)
      .order("stepOrder", { ascending: true });
    
    if (!steps || steps.length === 0) {
      console.error(`[GENERATE MESSAGES] No steps found for campaign ${campaignId}`);
      return c.json({ error: "No sequence steps found" }, 400);
    }
    
    // Get campaign leads from Postgres
    const { data: campaignLeads } = await supabase
      .from("CampaignLead")
      .select("leadId")
      .eq("campaignId", campaignId);
    
    if (!campaignLeads || campaignLeads.length === 0) {
      console.error(`[GENERATE MESSAGES] No leads found for campaign ${campaignId}`);
      return c.json({ error: "No leads in campaign" }, 400);
    }
    
    console.log(`[GENERATE MESSAGES] Found ${campaignLeads.length} leads, ${steps.length} steps`);
    
    // Get business profile for context
    let profile = null;
    try {
      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("organization_id", MOCK_ORG_ID)
        .limit(1)
        .maybeSingle();
      
      profile = businessProfile;
    } catch (error: any) {
      console.log(`[GENERATE MESSAGES] ⚠️ Could not fetch business profile:`, error.message);
    }
    
    // Get API settings from KV store (same pattern as other endpoints)
    const settings = await kv.get(`api_settings:${WORKSPACE_ID}`) || {};
    console.log("[GENERATE MESSAGES] Settings object:", settings);
    console.log("[GENERATE MESSAGES] AI provider:", settings.ai_provider);
    console.log("[GENERATE MESSAGES] AI API key exists:", !!settings.ai_api_key);
    
    const openaiApiKey = settings.ai_api_key;
    
    if (!openaiApiKey) {
      console.error("[GENERATE MESSAGES] OpenAI API key not configured");
      return c.json({ error: "AI service not configured. Please configure OpenAI API key in Settings." }, 500);
    }
    
    console.log("[GENERATE MESSAGES] Using OpenAI API key from settings");
    
    // Generate messages for each lead and step using AI
    const messagesToInsert = [];
    let generated = 0;
    let skipped = 0;
    
    for (const campaignLead of campaignLeads) {
      // Get lead from Postgres with enrichment data
      const { data: lead } = await supabase
        .from("Lead")
        .select("*")
        .eq("id", campaignLead.leadId)
        .single();
      
      if (!lead) {
        console.warn(`[GENERATE MESSAGES] Lead ${campaignLead.leadId} not found in Postgres`);
        continue;
      }
      
      console.log(`[GENERATE MESSAGES] Processing lead: ${lead.company_name} (${lead.first_name} ${lead.last_name})`);
      
      for (const step of steps) {
        // Check if message already exists
        const { data: existingMessages } = await supabase
          .from("GeneratedMessage")
          .select("id")
          .eq("campaignId", campaignId)
          .eq("leadId", lead.id)
          .eq("stepId", step.id);
        
        if (existingMessages && existingMessages.length > 0) {
          console.log(`[GENERATE MESSAGES] Message already exists for lead ${lead.id}, step ${step.id}`);
          skipped++;
          continue;
        }
        
        // Prepare enrichment data for AI - extract ALL the rich data
        const enrichmentData = lead.enrichment || {};
        const propertyAnalysis = lead.property_analysis || null;
        const serviceMapping = lead.service_mapping || null;
        const geoEnrichment = lead.geo_enrichment || null;
        
        // Extract specific insights from property analysis
        const visionAnalysis = propertyAnalysis?.vision_analysis || null;
        const publicData = propertyAnalysis?.public_data || null;
        const preAnalysis = propertyAnalysis?.pre_analysis || null;
        const realResearch = propertyAnalysis?.real_research || null;
        
        // Build context for AI with ALL enrichment data
        const leadContext = {
          // Basic info
          firstName: lead.first_name || "there",
          lastName: lead.last_name || "",
          title: lead.title || "",
          companyName: lead.company_name || "",
          email: enrichmentData.email || lead.email || "",
          
          // Company enrichment from Apollo
          companySize: lead.company_size || "",
          industry: lead.company_industry || "",
          companyDescription: lead.company_description || "",
          companyPhone: lead.company_phone || "",
          companyWebsite: lead.company_website || "",
          companyLocation: `${lead.company_city || ""}, ${lead.company_state || ""}`.trim(),
          
          // Property insights (if available)
          propertyType: propertyAnalysis?.property_type || null,
          
          // Vision analysis (AI analysis of satellite imagery)
          visionInsights: visionAnalysis ? {
            propertyCondition: visionAnalysis.property_condition,
            landscapeFeatures: visionAnalysis.landscape_features,
            maintenanceOpportunities: visionAnalysis.maintenance_opportunities,
            keyObservations: visionAnalysis.key_observations,
            businessOpportunities: visionAnalysis.business_opportunities,
          } : null,
          
          // Public data from Google Places
          publicInfo: publicData ? {
            rating: publicData.rating,
            userRatingsTotal: publicData.user_ratings_total,
            types: publicData.types,
            vicinity: publicData.vicinity,
          } : null,
          
          // Pre-analysis (AI pre-screening of property)
          preAnalysisInsights: preAnalysis ? {
            propertyType: preAnalysis.property_type,
            captureStrategy: preAnalysis.capture_strategy,
            estimatedSize: preAnalysis.estimated_size,
            complexity: preAnalysis.complexity,
            keyFeatures: preAnalysis.key_features,
          } : null,
          
          // Real research data from Perplexity (if available)
          researchData: realResearch || null,
          
          // Service mapping (AI recommendations for services)
          serviceMappingData: serviceMapping ? {
            recommendedServices: serviceMapping.recommended_services,
            businessOpportunities: serviceMapping.business_opportunities,
            salesAngles: serviceMapping.sales_angles,
            urgencyFactors: serviceMapping.urgency_factors,
          } : null,
          
          // Location data
          geoData: geoEnrichment ? {
            address: geoEnrichment.full_address,
            city: geoEnrichment.city,
            state: geoEnrichment.state,
            region: geoEnrichment.region,
          } : null,
          
          // Business intelligence from Google Places (reviews, ratings, AI insights)
          businessIntelligence: geoEnrichment?.business_intelligence || null,
        };
        
        // Generate AI message using GPT-4o
        let subject = "";
        let body = "";
        
        // If templates provided, use them; otherwise use AI
        const hasTemplate = (step.subjectTemplate || step.bodyTemplate);
        
        if (!hasTemplate) {
          // Full AI generation using enrichment data
          console.log(`[GENERATE MESSAGES] Generating AI message for ${lead.company_name}, Step ${step.stepOrder}`);
          
          // Debug: Log what service mapping data we have
          if (leadContext.serviceMappingData?.recommendedServices) {
            console.log(`[GENERATE MESSAGES] Found ${leadContext.serviceMappingData.recommendedServices.length} recommended services`);
            leadContext.serviceMappingData.recommendedServices.slice(0, 2).forEach((svc: any) => {
              console.log(`[GENERATE MESSAGES]   - ${svc.service_name || svc.name}: ${svc.estimated_value || 'N/A'}`);
            });
          } else {
            console.log(`[GENERATE MESSAGES] ⚠️ No service mapping data found for lead ${lead.id}`);
          }
          
          // Debug: Log what business intelligence we have
          if (leadContext.businessIntelligence) {
            const bi = leadContext.businessIntelligence;
            console.log(`[GENERATE MESSAGES] Business Intelligence available:`);
            console.log(`[GENERATE MESSAGES]   - Business: ${bi.business_name || 'N/A'}`);
            console.log(`[GENERATE MESSAGES]   - Rating: ${bi.rating}★ (${bi.total_reviews || 0} reviews)`);
            console.log(`[GENERATE MESSAGES]   - Has AI insights: ${!!bi.ai_insights}`);
            console.log(`[GENERATE MESSAGES]   - Reviews available: ${bi.reviews?.length || 0}`);
          } else {
            console.log(`[GENERATE MESSAGES] ⚠️ No business intelligence found for lead ${lead.id}`);
          }
          
          try {
            // Build AI prompt with ALL enrichment data
            const stepNumber = step.stepOrder;
            const isFirstEmail = stepNumber === 1;
            
            let aiPrompt = `Generate a highly personalized B2B sales email using the following enrichment data:\n\n`;
            
            // === PROSPECT INFORMATION ===
            aiPrompt += `=== PROSPECT ===\n`;
            aiPrompt += `Name: ${leadContext.firstName} ${leadContext.lastName}\n`;
            aiPrompt += `Title: ${leadContext.title}\n`;
            aiPrompt += `Company: ${leadContext.companyName}\n`;
            
            if (leadContext.industry) aiPrompt += `Industry: ${leadContext.industry}\n`;
            if (leadContext.companySize) aiPrompt += `Company Size: ${leadContext.companySize}\n`;
            if (leadContext.companyDescription) aiPrompt += `Company Description: ${leadContext.companyDescription}\n`;
            if (leadContext.companyLocation) aiPrompt += `Location: ${leadContext.companyLocation}\n`;
            
            // === BUSINESS INTELLIGENCE (Google Reviews & AI Insights) ===
            if (leadContext.businessIntelligence) {
              const bi = leadContext.businessIntelligence;
              aiPrompt += `\n=== BUSINESS INTELLIGENCE (from Google & AI Analysis) ===\n`;
              
              if (bi.business_name) aiPrompt += `Business Name: ${bi.business_name}\n`;
              if (bi.rating) aiPrompt += `Google Rating: ${bi.rating}★ (${bi.total_reviews || 0} reviews)\n`;
              if (bi.description) aiPrompt += `Business Description: ${bi.description}\n`;
              if (bi.website) aiPrompt += `Website: ${bi.website}\n`;
              
              // AI-generated insights (from Stage 1 enrichment)
              if (bi.ai_insights) {
                const ai = bi.ai_insights;
                
                if (ai.unique_features && ai.unique_features.length > 0) {
                  aiPrompt += `\nUnique Features:\n`;
                  ai.unique_features.slice(0, 3).forEach((feature: string) => {
                    aiPrompt += `- ${feature}\n`;
                  });
                }
                
                if (ai.customer_love && ai.customer_love.length > 0) {
                  aiPrompt += `\nWhat Customers Love (from reviews):\n`;
                  ai.customer_love.slice(0, 3).forEach((quote: string) => {
                    aiPrompt += `- "${quote}"\n`;
                  });
                }
                
                if (ai.values_culture && ai.values_culture.length > 0) {
                  aiPrompt += `\nCompany Values/Culture:\n`;
                  ai.values_culture.slice(0, 3).forEach((value: string) => {
                    aiPrompt += `- ${value}\n`;
                  });
                }
                
                if (ai.services_offered && ai.services_offered.length > 0) {
                  aiPrompt += `\nServices They Offer: ${ai.services_offered.join(', ')}\n`;
                }
              }
              
              // Include top positive reviews with author names
              if (bi.reviews && bi.reviews.length > 0) {
                aiPrompt += `\nRecent Positive Reviews:\n`;
                bi.reviews
                  .filter((r: any) => r.rating >= 4)
                  .slice(0, 3)
                  .forEach((review: any, idx: number) => {
                    aiPrompt += `${idx + 1}. [${review.rating}★] ${review.author}: "${review.text.substring(0, 150)}..."\n`;
                  });
              }
            }
            
            // === PROPERTY & LOCATION DATA ===
            if (leadContext.geoData) {
              aiPrompt += `\n=== PROPERTY LOCATION ===\n`;
              aiPrompt += `Address: ${leadContext.geoData.address}\n`;
              aiPrompt += `Region: ${leadContext.geoData.region}\n`;
            }
            
            if (leadContext.propertyType) {
              aiPrompt += `Property Type: ${leadContext.propertyType}\n`;
            }
            
            // === VISION ANALYSIS (Satellite Imagery AI Insights) ===
            if (leadContext.visionInsights) {
              aiPrompt += `\n=== PROPERTY ANALYSIS (from satellite imagery) ===\n`;
              if (leadContext.visionInsights.propertyCondition) {
                aiPrompt += `Property Condition: ${JSON.stringify(leadContext.visionInsights.propertyCondition)}\n`;
              }
              if (leadContext.visionInsights.landscapeFeatures) {
                aiPrompt += `Landscape Features: ${JSON.stringify(leadContext.visionInsights.landscapeFeatures)}\n`;
              }
              if (leadContext.visionInsights.maintenanceOpportunities) {
                aiPrompt += `Maintenance Opportunities: ${JSON.stringify(leadContext.visionInsights.maintenanceOpportunities)}\n`;
              }
              if (leadContext.visionInsights.businessOpportunities) {
                aiPrompt += `Business Opportunities: ${JSON.stringify(leadContext.visionInsights.businessOpportunities)}\n`;
              }
              if (leadContext.visionInsights.keyObservations && leadContext.visionInsights.keyObservations.length > 0) {
                aiPrompt += `Key Observations: ${leadContext.visionInsights.keyObservations.join(', ')}\n`;
              }
            }
            
            // === SERVICE MAPPING (AI-recommended services) ===
            if (leadContext.serviceMappingData) {
              aiPrompt += `\n=== SERVICE RECOMMENDATIONS ===\n`;
              
              // Extract and format recommended services properly
              if (leadContext.serviceMappingData.recommendedServices && Array.isArray(leadContext.serviceMappingData.recommendedServices)) {
                aiPrompt += `Recommended Services for this Property:\n`;
                leadContext.serviceMappingData.recommendedServices.forEach((service: any, idx: number) => {
                  aiPrompt += `\n${idx + 1}. ${service.service_name || service.name}\n`;
                  if (service.priority) aiPrompt += `   Priority: ${service.priority}\n`;
                  if (service.estimated_value) aiPrompt += `   Estimated Value: ${service.estimated_value}\n`;
                  if (service.rationale) aiPrompt += `   Why: ${service.rationale}\n`;
                  if (service.talking_points && Array.isArray(service.talking_points)) {
                    aiPrompt += `   Key Points: ${service.talking_points.join(', ')}\n`;
                  }
                });
              }
              
              // Business opportunities
              if (leadContext.serviceMappingData.businessOpportunities) {
                aiPrompt += `\nBusiness Opportunities Identified:\n`;
                if (Array.isArray(leadContext.serviceMappingData.businessOpportunities)) {
                  leadContext.serviceMappingData.businessOpportunities.forEach((opp: any) => {
                    if (typeof opp === 'string') {
                      aiPrompt += `- ${opp}\n`;
                    } else if (opp.opportunity) {
                      aiPrompt += `- ${opp.opportunity}${opp.value_estimate ? ` (${opp.value_estimate})` : ''}\n`;
                    }
                  });
                } else if (typeof leadContext.serviceMappingData.businessOpportunities === 'string') {
                  aiPrompt += leadContext.serviceMappingData.businessOpportunities + '\n';
                }
              }
              
              // Sales angles
              if (leadContext.serviceMappingData.salesAngles && Array.isArray(leadContext.serviceMappingData.salesAngles)) {
                aiPrompt += `\nSales Angles:\n`;
                leadContext.serviceMappingData.salesAngles.slice(0, 3).forEach((angle: any) => {
                  aiPrompt += `- ${typeof angle === 'string' ? angle : angle.angle || JSON.stringify(angle)}\n`;
                });
              }
              
              // Urgency factors
              if (leadContext.serviceMappingData.urgencyFactors && Array.isArray(leadContext.serviceMappingData.urgencyFactors)) {
                aiPrompt += `\nUrgency Factors:\n`;
                leadContext.serviceMappingData.urgencyFactors.slice(0, 2).forEach((factor: any) => {
                  aiPrompt += `- ${typeof factor === 'string' ? factor : factor.factor || JSON.stringify(factor)}\n`;
                });
              }
            }
            
            // === PUBLIC DATA (Google Places) ===
            if (leadContext.publicInfo) {
              aiPrompt += `\n=== PUBLIC INFORMATION ===\n`;
              if (leadContext.publicInfo.rating) {
                aiPrompt += `Google Rating: ${leadContext.publicInfo.rating} (${leadContext.publicInfo.userRatingsTotal} reviews)\n`;
              }
            }
            
            // === REAL RESEARCH DATA (Perplexity insights) ===
            if (leadContext.researchData) {
              aiPrompt += `\n=== RESEARCH INSIGHTS ===\n`;
              aiPrompt += `${JSON.stringify(leadContext.researchData).substring(0, 400)}\n`;
            }
            
            // === CAMPAIGN CONTEXT ===
            aiPrompt += `\n=== CAMPAIGN CONTEXT ===\n`;
            aiPrompt += `Campaign Goal: ${campaign.goal || 'Generate interest and book meetings'}\n`;
            aiPrompt += `Email Type: ${isFirstEmail ? 'Initial outreach' : `Follow-up #${stepNumber}`}\n`;
            
            // === SENDER INFORMATION ===
            if (profile?.company_name || profile?.value_proposition) {
              aiPrompt += `\n=== YOUR COMPANY ===\n`;
              if (profile?.company_name) aiPrompt += `Company: ${profile.company_name}\n`;
              if (profile?.value_proposition) aiPrompt += `Value Proposition: ${profile.value_proposition}\n`;
            }
            
            // === INSTRUCTIONS ===
            aiPrompt += `\n=== INSTRUCTIONS ===\n`;
            aiPrompt += `Write a compelling 150-200 word personalized email that:\n`;
            aiPrompt += `1. OPENS with personalization using their company name, unique features, or a specific positive review quote\n`;
            aiPrompt += `2. Shows you've researched THEIR business (mention their values, what customers love, or distinguished features)\n`;
            aiPrompt += `3. Mentions SPECIFIC property features from the property analysis (e.g., "3-acre turf", "irrigation zones near main athletic field")\n`;
            aiPrompt += `4. References SPECIFIC services from the Service Recommendations above (use actual service names and estimated values)\n`;
            aiPrompt += `5. Connects a property observation to a business opportunity or pain point\n`;
            aiPrompt += `6. Suggests 1-2 SPECIFIC recommended services with their rationale\n`;
            aiPrompt += `7. Uses conversational, professional tone (not salesy)\n`;
            aiPrompt += `8. Includes a soft, clear call-to-action\n`;
            aiPrompt += `9. Keep it concise and scannable\n`;
            
            if (!isFirstEmail) {
              aiPrompt += `10. This is a follow-up - acknowledge previous email briefly and add NEW value/insight\n`;
            }
            
            aiPrompt += `\nCRITICAL FOR FIRST EMAIL:\n`;
            aiPrompt += `- Start with "Hi [FirstName]," (use their actual first name)\n`;
            aiPrompt += `- Second paragraph should mention something specific about THEIR company (from Business Intelligence section)\n`;
            aiPrompt += `- Reference a positive review or customer testimonial if available (with reviewer name)\n`;
            aiPrompt += `- Show you understand their values and what makes them distinguished\n`;
            aiPrompt += `\nCRITICAL FOR SERVICE MENTIONS:\n`;
            aiPrompt += `- Reference ACTUAL service names from the Service Recommendations section above (e.g., "Weekly Mowing Service", "Irrigation System Optimization")\n`;
            aiPrompt += `- Don't just say "lawn care" - be specific!\n`;
            aiPrompt += `\nEXAMPLE of being specific: "Hi Sarah, I noticed your property has approximately 3 acres of turf dedicated to athletic events. I saw that customers consistently praise your commitment to excellence - one recent reviewer mentioned your 'impeccably maintained facilities.' Based on the satellite analysis, I'd recommend our Weekly Turf Enhancement Service ($850-1,200/month) paired with Irrigation System Optimization for the zones near the main athletic field showing uneven coverage."\n`;
            aiPrompt += `\nFormat:\nSubject: [compelling, personalized subject line]\n\nBody:\n[email body]`;
            
            const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openaiApiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                  {
                    role: "system",
                    content: "You are an expert B2B sales email copywriter. Write highly personalized, compelling emails that reference specific business insights."
                  },
                  {
                    role: "user",
                    content: aiPrompt
                  }
                ],
                temperature: 0.8,
                max_tokens: 800,
              }),
            });
            
            if (!aiResponse.ok) {
              throw new Error(`OpenAI API error: ${aiResponse.statusText}`);
            }
            
            const aiResult = await aiResponse.json();
            const aiText = aiResult.choices[0]?.message?.content || "";
            
            // Parse AI response
            const subjectMatch = aiText.match(/Subject:\s*(.+)/i);
            const bodyMatch = aiText.match(/Body:\s*([\s\S]+)/i);
            
            subject = subjectMatch ? subjectMatch[1].trim() : `Quick question about ${leadContext.companyName}`;
            body = bodyMatch ? bodyMatch[1].trim() : aiText;
            
            console.log(`[GENERATE MESSAGES] AI generated subject: "${subject}"`);
            
          } catch (aiError: any) {
            console.error(`[GENERATE MESSAGES] AI generation failed:`, aiError);
            
            // Fallback to basic personalization
            subject = `Quick question about ${leadContext.companyName}`;
            body = `Hi ${leadContext.firstName},\n\nI noticed ${leadContext.companyName} and wanted to reach out.\n\n${campaign.goal || 'I think we could help you achieve your goals.'}\n\nWould you be open to a brief conversation?\n\nBest regards`;
          }
        } else {
          // Use templates with variable replacement
          subject = step.subjectTemplate || `Re: ${leadContext.companyName}`;
          body = step.bodyTemplate || `Hi ${leadContext.firstName},\n\nI wanted to reach out about ${leadContext.companyName}...`;
          
          // Replace variables
          const replacements: Record<string, string> = {
            "{{firstName}}": leadContext.firstName,
            "{{lastName}}": leadContext.lastName,
            "{{companyName}}": leadContext.companyName,
            "{{title}}": leadContext.title,
            "{{ourCompany}}": profile?.company_name || "our company",
          };
          
          Object.entries(replacements).forEach(([key, value]) => {
            subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
            body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
          });
        }
        
        const now = new Date().toISOString();
        const message = {
          id: generateId(),
          workspaceId: WORKSPACE_ID,
          campaignId,
          leadId: lead.id,
          stepId: step.id,
          subject,
          body,
          status: "generated",
          createdAt: now,
          updatedAt: now,
        };
        
        messagesToInsert.push(message);
        generated++;
      }
    }
    
    console.log(`[GENERATE MESSAGES] Inserting ${messagesToInsert.length} messages (generated: ${generated}, skipped: ${skipped})`);
    
    // Insert all messages
    if (messagesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("GeneratedMessage")
        .insert(messagesToInsert);
      
      if (insertError) {
        console.error(`[GENERATE MESSAGES] Error inserting messages:`, insertError);
        throw insertError;
      }
    }
    
    console.log(`[GENERATE MESSAGES] ✅ Successfully generated ${messagesToInsert.length} AI-powered messages`);
    
    return c.json({ success: true, messagesGenerated: messagesToInsert.length });
  } catch (error: any) {
    console.error("Error generating messages:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-2f1627d1/api/campaigns/:id/messages", async (c) => {
  try {
    const campaignId = c.req.param("id");
    
    // Get messages from Postgres with step info
    const { data: messages } = await supabase
      .from("GeneratedMessage")
      .select(`
        id,
        campaignId,
        leadId,
        stepId,
        subject,
        body,
        status,
        step:SequenceStep(stepOrder)
      `)
      .eq("campaignId", campaignId);
    
    if (!messages) {
      return c.json([]);
    }
    
    // Enrich messages with lead data from Postgres
    const enriched = await Promise.all(messages.map(async (msg: any) => {
      const { data: lead } = await supabase
        .from("Lead")
        .select("id, first_name, last_name, company_name, title")
        .eq("id", msg.leadId)
        .single();
      
      return {
        id: msg.id,
        campaign_id: msg.campaignId,
        lead_id: msg.leadId,
        lead_name: lead ? `${lead.first_name || ""} ${lead.last_name || ""}`.trim() : "Unknown",
        company_name: lead?.company_name || "Unknown",
        title: lead?.title || "",
        step_order: msg.step?.stepOrder ?? 0,
        subject: msg.subject,
        body: msg.body,
        status: msg.status,
        step: msg.step,
      };
    }));
    
    // Sort by lead, then by step order
    enriched.sort((a, b) => {
      if (a.lead_id !== b.lead_id) {
        return a.lead_id.localeCompare(b.lead_id);
      }
      return a.step_order - b.step_order;
    });
    
    return c.json(enriched);
  } catch (error: any) {
    console.error("Error listing messages:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.patch("/make-server-2f1627d1/api/messages/:id", async (c) => {
  try {
    const messageId = c.req.param("id");
    const body = await c.req.json();
    
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };
    
    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.body !== undefined) updates.body = body.body;
    if (body.status !== undefined) updates.status = body.status;
    
    const { data: message, error } = await supabase
      .from("GeneratedMessage")
      .update(updates)
      .eq("id", messageId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!message) {
      return c.json({ error: "Message not found" }, 404);
    }
    
    return c.json({
      id: message.id,
      subject: message.subject,
      body: message.body,
      status: message.status,
    });
  } catch (error: any) {
    console.error("Error updating message:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-2f1627d1/api/campaigns/:id/launch", async (c) => {
  try {
    const campaignId = c.req.param("id");
    
    // Update campaign status in database
    const now = new Date().toISOString();
    const { data: campaign, error } = await supabase
      .from("Campaign")
      .update({
        status: "running",
        startAt: now,
        updatedAt: now,
      })
      .eq("id", campaignId)
      .select()
      .single();
    
    if (error || !campaign) {
      console.error("Campaign not found or error updating:", error);
      return c.json({ error: "Campaign not found" }, 404);
    }
    
    return c.json({ 
      success: true,
      campaignId: campaign.id,
      status: campaign.status,
    });
  } catch (error: any) {
    console.error("Error launching campaign:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-2f1627d1/api/campaigns/:id/dashboard", async (c) => {
  try {
    const campaignId = c.req.param("id");
    
    // Get campaign from database
    const { data: campaign, error: campaignError } = await supabase
      .from("Campaign")
      .select("*")
      .eq("id", campaignId)
      .single();
    
    if (campaignError || !campaign) {
      console.error("Campaign not found:", campaignError);
      return c.json({ error: "Campaign not found" }, 404);
    }
    
    // Get steps from database
    const { data: steps } = await supabase
      .from("SequenceStep")
      .select("*")
      .eq("campaignId", campaignId)
      .order("stepOrder", { ascending: true });
    
    // Get campaign leads count
    const { count: leadsCount } = await supabase
      .from("CampaignLead")
      .select("*", { count: "exact", head: true })
      .eq("campaignId", campaignId);
    
    // Get messages (if any exist)
    const { data: messages } = await supabase
      .from("Message")
      .select("*")
      .eq("campaignId", campaignId);
    
    // Mock sends and events (in a real app these would be tracked)
    const sends: any[] = [];
    const events: any[] = [];
    
    // Calculate stats
    const totalLeads = leadsCount || 0;
    const totalMessages = messages?.length || 0;
    const approvedMessages = messages?.filter((m: any) => m.status === "approved" || m.status === "edited").length || 0;
    const totalSent = sends.filter((s: any) => s.status === "sent").length;
    const totalOpens = events.filter((e: any) => e.event_type === "open").length;
    const totalClicks = events.filter((e: any) => e.event_type === "click").length;
    const totalReplies = events.filter((e: any) => e.event_type === "reply").length;
    
    return c.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        startAt: campaign.startAt,
      },
      stats: {
        totalLeads,
        totalMessages,
        approvedMessages,
        totalSent,
        totalOpens,
        totalClicks,
        totalReplies,
        openRate: totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0.0",
        clickRate: totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : "0.0",
        replyRate: totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) : "0.0",
      },
      steps: (steps || []).map((step: any) => ({
        stepOrder: step.stepOrder,
        delayDays: step.delayDays,
        subject: step.subjectTemplate,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching campaign dashboard:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== ONE-TIME MIGRATION ENDPOINT =====
// Run this once to fix existing enriched leads that still have status "discovered"
app.get("/make-server-2f1627d1/api/migrate-enriched-leads", async (c) => {
  try {
    console.log("[MIGRATION] Starting migration of enriched leads...");
    
    // Get all leads
    const allLeads = await kv.getByPrefix("lead:");
    console.log(`[MIGRATION] Found ${allLeads.length} total leads`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const lead of allLeads) {
      // Check if lead has been enriched but still has status "discovered"
      if (lead.enriched_at && lead.status === "discovered") {
        console.log(`[MIGRATION] Updating lead ${lead.id}: ${lead.first_name} ${lead.last_name}`);
        
        // Update status to enriched
        lead.status = "enriched";
        await kv.set(`lead:${lead.id}`, lead);
        
        updated++;
      } else {
        skipped++;
      }
    }
    
    console.log(`[MIGRATION] Complete! Updated: ${updated}, Skipped: ${skipped}`);
    
    return c.json({
      success: true,
      message: `Migration complete. Updated ${updated} leads to enriched status.`,
      stats: {
        total: allLeads.length,
        updated,
        skipped,
      }
    });
    
  } catch (error: any) {
    console.error("[MIGRATION] Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== INITIALIZE WORKSPACE ENDPOINT =====
// Run this to manually create the default workspace if it doesn't exist
app.get("/make-server-2f1627d1/api/init-workspace", async (c) => {
  try {
    console.log("[INIT] Checking for default workspace...");
    
    // Check if default workspace exists
    const { data: existingWorkspace, error: checkError } = await supabase
      .from("Workspace")
      .select("id, name, createdAt")
      .eq("id", WORKSPACE_ID)
      .single();
    
    if (existingWorkspace) {
      console.log("[INIT] Workspace already exists");
      return c.json({
        success: true,
        message: "Workspace already exists",
        workspace: existingWorkspace,
      });
    }
    
    // Create workspace
    console.log("[INIT] Creating default workspace...");
    const now = new Date().toISOString();
    const { data: newWorkspace, error } = await supabase
      .from("Workspace")
      .insert({
        id: WORKSPACE_ID,
        name: "Default Workspace",
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();
    
    if (error) {
      // If duplicate key error, workspace already exists - that's OK!
      if (error.code === "23505") {
        console.log("[INIT] Workspace already exists (duplicate key)");
        return c.json({
          success: true,
          message: "Workspace already exists",
        });
      }
      console.error("[INIT] Error creating workspace:", error);
      throw error;
    }
    
    console.log("[INIT] ✓ Default workspace created successfully");
    
    return c.json({
      success: true,
      message: "Workspace created successfully",
      workspace: newWorkspace,
    });
    
  } catch (error: any) {
    console.error("[INIT] Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Initialize default workspace on startup
(async () => {
  try {
    // Check if default workspace exists
    const { data: existingWorkspace, error: checkError } = await supabase
      .from("Workspace")
      .select("id")
      .eq("id", WORKSPACE_ID)
      .single();
    
    if (existingWorkspace) {
      console.log("[INIT] ✓ Default workspace exists");
      return;
    }
    
    // If check failed but not because of no rows, log it
    if (checkError && checkError.code !== "PGRST116") {
      console.log("[INIT] Warning: Check error:", checkError.message);
    }
    
    // Try to create workspace
    console.log("[INIT] Creating default workspace...");
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("Workspace")
      .insert({
        id: WORKSPACE_ID,
        name: "Default Workspace",
        createdAt: now,
        updatedAt: now,
      });
    
    if (error) {
      // If duplicate key error, workspace already exists - that's OK!
      if (error.code === "23505") {
        console.log("[INIT] ✓ Default workspace already exists");
      } else {
        console.error("[INIT] Error creating workspace:", error);
      }
    } else {
      console.log("[INIT] ✓ Default workspace created");
    }
  } catch (error) {
    console.error("[INIT] Failed to initialize workspace:", error);
  }
})();

Deno.serve(app.fetch);