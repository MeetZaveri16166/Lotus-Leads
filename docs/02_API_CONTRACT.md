# 🔌 LotusLeads API Contract

OpenAPI-style specification for Organization & User Management

---

## Base URL

```
Production: https://{projectId}.supabase.co/functions/v1/make-server-2f1627d1
Development: http://localhost:54321/functions/v1/make-server-2f1627d1
```

## Authentication

All requests (except auth endpoints) require:

```
Authorization: Bearer {access_token}
```

Access token is obtained from Supabase Auth (Google OAuth or email/password).

---

# 📁 **1. Authentication**

## 1.1 Sign Up with Google OAuth

**Endpoint:** `POST /auth/google`

**Description:** Complete Google OAuth flow and create user + organization

**Request:**
```json
{
  "google_token": "ya29.a0AfH6...",
  "organization_name": "Acme Corporation",
  "industry": "Technology"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@acme.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "auth_method": "google"
  },
  "organization": {
    "id": "uuid",
    "name": "Acme Corporation",
    "slug": "acme-corporation",
    "industry": "Technology",
    "trial_credits": 100
  },
  "membership": {
    "role": "admin"
  },
  "access_token": "eyJhbGci...",
  "refresh_token": "..."
}
```

**Errors:**
- `400` - Invalid Google token
- `409` - User already exists

---

## 1.2 Sign Up with Email/Password

**Endpoint:** `POST /auth/signup`

**Description:** Create user with email/password and organization

**Request:**
```json
{
  "email": "admin@acme.com",
  "password": "SecureP@ss123!",
  "full_name": "John Doe",
  "organization_name": "Acme Corporation",
  "industry": "Technology"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@acme.com",
    "full_name": "John Doe",
    "auth_method": "email"
  },
  "organization": {
    "id": "uuid",
    "name": "Acme Corporation",
    "slug": "acme-corporation",
    "trial_credits": 100
  },
  "membership": {
    "role": "admin"
  },
  "access_token": "eyJhbGci...",
  "refresh_token": "..."
}
```

**Errors:**
- `400` - Invalid email or weak password
- `409` - Email already exists

---

## 1.3 Login with Email/Password

**Endpoint:** `POST /auth/login`

**Description:** Authenticate existing user

**Request:**
```json
{
  "email": "admin@acme.com",
  "password": "SecureP@ss123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@acme.com",
    "full_name": "John Doe"
  },
  "organization": {
    "id": "uuid",
    "name": "Acme Corporation",
    "slug": "acme-corporation"
  },
  "membership": {
    "role": "admin"
  },
  "access_token": "eyJhbGci...",
  "refresh_token": "..."
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Account suspended

---

## 1.4 Get Current User Context

**Endpoint:** `GET /auth/me`

**Description:** Get current user + organization context

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@acme.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "auth_method": "google",
    "status": "active"
  },
  "organization": {
    "id": "uuid",
    "name": "Acme Corporation",
    "slug": "acme-corporation",
    "industry": "Technology",
    "credit_balance": 850
  },
  "membership": {
    "role": "admin",
    "monthly_credit_limit": null,
    "current_month_usage": 150
  }
}
```

---

# 📁 **2. Organizations**

## 2.1 Get Organization Details

**Endpoint:** `GET /organizations/:orgId`

**Description:** Get organization profile and settings

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Acme Corporation",
  "slug": "acme-corporation",
  "industry": "Technology",
  "timezone": "America/New_York",
  "logo_url": "https://...",
  "credit_balance": 850,
  "subscription_status": "active",
  "trial_ends_at": "2026-02-24T00:00:00Z",
  "created_at": "2026-01-15T10:00:00Z",
  "member_count": 12,
  "api_keys": {
    "google_maps": "AIza***",
    "apollo": "abc***",
    "openai": "sk-***"
  }
}
```

**Permissions:** Any member can view (API keys masked for non-admins)

---

## 2.2 Update Organization

**Endpoint:** `PATCH /organizations/:orgId`

**Description:** Update organization settings

**Request:**
```json
{
  "name": "Acme Corp",
  "industry": "SaaS",
  "timezone": "America/Los_Angeles",
  "logo_url": "https://..."
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "industry": "SaaS",
  "timezone": "America/Los_Angeles",
  "updated_at": "2026-01-24T12:00:00Z"
}
```

**Permissions:** Admin only

**Errors:**
- `403` - Not an admin

---

## 2.3 Update API Keys

**Endpoint:** `PATCH /organizations/:orgId/api-keys`

**Description:** Update API keys

**Request:**
```json
{
  "google_maps": "AIzaSyC...",
  "apollo": "abc123...",
  "openai": "sk-proj-..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "API keys updated successfully"
}
```

**Permissions:** Admin only

---

# 📁 **3. Team Management**

## 3.1 List Team Members

**Endpoint:** `GET /organizations/:orgId/members`

**Description:** Get all members of organization

**Query Params:**
- `role` (optional): Filter by role (`admin` or `user`)
- `status` (optional): Filter by status (`active` or `suspended`)

**Response:** `200 OK`
```json
{
  "members": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "email": "admin@acme.com",
      "full_name": "John Doe",
      "avatar_url": "https://...",
      "role": "admin",
      "monthly_credit_limit": null,
      "current_month_usage": 150,
      "status": "active",
      "joined_at": "2026-01-15T10:00:00Z",
      "last_login_at": "2026-01-24T09:30:00Z"
    },
    {
      "id": "uuid",
      "user_id": "uuid",
      "email": "jane@acme.com",
      "full_name": "Jane Smith",
      "role": "user",
      "monthly_credit_limit": 100,
      "current_month_usage": 45,
      "status": "active",
      "joined_at": "2026-01-18T14:00:00Z"
    }
  ],
  "total": 2
}
```

**Permissions:** Admin only

---

## 3.2 Create User (Admin)

**Endpoint:** `POST /organizations/:orgId/members`

**Description:** Admin creates a new user with temporary password

**Request:**
```json
{
  "email": "newuser@acme.com",
  "full_name": "Bob Johnson",
  "role": "user",
  "monthly_credit_limit": 200,
  "send_invite_email": true
}
```

**Response:** `201 Created`
```json
{
  "member": {
    "id": "uuid",
    "user_id": "uuid",
    "email": "newuser@acme.com",
    "full_name": "Bob Johnson",
    "role": "user",
    "monthly_credit_limit": 200,
    "status": "active"
  },
  "invitation": {
    "token": "secure-random-token",
    "temporary_password": "TempPass123!",
    "expires_at": "2026-01-31T00:00:00Z"
  },
  "invite_sent": true
}
```

**Permissions:** Admin only

**Errors:**
- `400` - Invalid email or role
- `409` - Email already exists in organization
- `403` - Not an admin

---

## 3.3 Update Member

**Endpoint:** `PATCH /organizations/:orgId/members/:memberId`

**Description:** Update member role or credit limit

**Request:**
```json
{
  "role": "admin",
  "monthly_credit_limit": 500
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "role": "admin",
  "monthly_credit_limit": 500,
  "updated_at": "2026-01-24T12:00:00Z"
}
```

**Permissions:** Admin only

---

## 3.4 Suspend/Delete Member

**Endpoint:** `DELETE /organizations/:orgId/members/:memberId`

**Description:** Suspend or remove member from organization

**Query Params:**
- `action`: `suspend` or `delete` (default: `suspend`)

**Response:** `200 OK`
```json
{
  "success": true,
  "action": "suspended",
  "member_id": "uuid"
}
```

**Permissions:** Admin only (cannot delete self)

---

## 3.5 Reset User Password

**Endpoint:** `POST /organizations/:orgId/members/:memberId/reset-password`

**Description:** Admin resets user password

**Request:**
```json
{
  "send_email": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "temporary_password": "NewTemp456!",
  "email_sent": true
}
```

**Permissions:** Admin only

---

# 📁 **4. Invitations**

## 4.1 Create Invitation

**Endpoint:** `POST /invitations`

**Description:** Invite user to join organization

**Request:**
```json
{
  "email": "newuser@acme.com",
  "role": "user",
  "organization_id": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "newuser@acme.com",
  "role": "user",
  "token": "secure-token",
  "invite_link": "https://app.lotusleads.com/accept-invite?token=secure-token",
  "expires_at": "2026-01-31T00:00:00Z",
  "status": "pending"
}
```

**Permissions:** Admin only

---

## 4.2 List Invitations

**Endpoint:** `GET /invitations`

**Description:** List all invitations for organization

**Query Params:**
- `status`: Filter by status (`pending`, `accepted`, `expired`)

**Response:** `200 OK`
```json
{
  "invitations": [
    {
      "id": "uuid",
      "email": "user@acme.com",
      "role": "user",
      "status": "pending",
      "invited_by": {
        "name": "John Doe",
        "email": "admin@acme.com"
      },
      "created_at": "2026-01-20T10:00:00Z",
      "expires_at": "2026-01-27T10:00:00Z"
    }
  ]
}
```

---

## 4.3 Validate Invitation Token

**Endpoint:** `GET /invitations/:token`

**Description:** Check if invitation token is valid

**Response:** `200 OK`
```json
{
  "valid": true,
  "invitation": {
    "id": "uuid",
    "email": "user@acme.com",
    "role": "user",
    "organization": {
      "name": "Acme Corporation",
      "logo_url": "https://..."
    },
    "invited_by": "John Doe",
    "expires_at": "2026-01-27T10:00:00Z"
  }
}
```

**Errors:**
- `404` - Token not found
- `410` - Invitation expired

---

## 4.4 Accept Invitation

**Endpoint:** `POST /invitations/:token/accept`

**Description:** Accept invitation and join organization

**Request:**
```json
{
  "full_name": "New User",
  "password": "SecurePass123!" // If not using OAuth
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@acme.com",
    "full_name": "New User"
  },
  "organization": {
    "id": "uuid",
    "name": "Acme Corporation"
  },
  "membership": {
    "role": "user"
  },
  "access_token": "...",
  "refresh_token": "..."
}
```

---

## 4.5 Cancel Invitation

**Endpoint:** `DELETE /invitations/:id`

**Description:** Cancel pending invitation

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Permissions:** Admin only

---

# 📁 **5. Credits**

## 5.1 Get Credit Balance

**Endpoint:** `GET /credits/balance`

**Description:** Get organization's current credit balance

**Response:** `200 OK`
```json
{
  "organization_id": "uuid",
  "balance": 850,
  "trial_credits_remaining": 0,
  "purchased_credits": 850,
  "last_purchase": "2026-01-20T10:00:00Z"
}
```

---

## 5.2 Check Credit Availability

**Endpoint:** `POST /credits/check`

**Description:** Check if user can perform operation

**Request:**
```json
{
  "operation_type": "apollo_search",
  "credits_required": 10
}
```

**Response:** `200 OK`
```json
{
  "can_perform": true,
  "org_balance": 850,
  "user_monthly_usage": 150,
  "user_monthly_limit": 200,
  "credits_required": 10
}
```

**Response (Insufficient):** `200 OK`
```json
{
  "can_perform": false,
  "reason": "insufficient_org_credits",
  "org_balance": 5,
  "credits_required": 10
}
```

---

## 5.3 Deduct Credits (Internal)

**Endpoint:** `POST /credits/deduct`

**Description:** Deduct credits for operation (called by backend services)

**Request:**
```json
{
  "organization_id": "uuid",
  "user_id": "uuid",
  "operation_type": "apollo_search",
  "request_id": "uuid",
  "lead_id": "uuid",
  "metadata": {
    "search_query": "landscaping companies",
    "results_count": 50
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "transaction_id": "uuid",
  "credits_deducted": 10,
  "balance_before": 850,
  "balance_after": 840
}
```

**Errors:**
- `402` - Insufficient credits (org or user limit)

---

## 5.4 Get Credit Transactions

**Endpoint:** `GET /credits/transactions`

**Description:** Get credit transaction history

**Query Params:**
- `user_id` (optional): Filter by user
- `operation_type` (optional): Filter by operation
- `start_date` (optional): Start date (ISO 8601)
- `end_date` (optional): End date
- `limit` (default: 50)
- `offset` (default: 0)

**Response:** `200 OK`
```json
{
  "transactions": [
    {
      "id": "uuid",
      "user": {
        "name": "John Doe",
        "email": "admin@acme.com"
      },
      "operation_type": "apollo_search",
      "credits_delta": -10,
      "balance_after": 840,
      "lead_id": "uuid",
      "metadata": {
        "search_query": "landscaping companies",
        "results_count": 50
      },
      "created_at": "2026-01-24T10:30:00Z"
    },
    {
      "id": "uuid",
      "user": {
        "name": "Jane Smith",
        "email": "jane@acme.com"
      },
      "operation_type": "geo_enrichment",
      "credits_delta": -1,
      "balance_after": 849,
      "lead_id": "uuid",
      "created_at": "2026-01-24T09:15:00Z"
    }
  ],
  "total": 234,
  "limit": 50,
  "offset": 0
}
```

**Permissions:** Admin sees all, users see only their own

---

## 5.5 Purchase Credits

**Endpoint:** `POST /credits/purchase`

**Description:** Purchase credit package (triggers Stripe)

**Request:**
```json
{
  "package": "medium", // "small" | "medium" | "large" | "enterprise"
  "payment_method_id": "pm_..." // Stripe payment method
}
```

**Packages:**
- `small`: 100 credits - $10
- `medium`: 500 credits - $45
- `large`: 1000 credits - $80
- `enterprise`: 5000 credits - $350

**Response:** `200 OK`
```json
{
  "success": true,
  "transaction_id": "uuid",
  "credits_added": 500,
  "amount_paid": 4500, // cents
  "balance_after": 1340,
  "stripe_payment_intent": "pi_..."
}
```

**Permissions:** Admin only

**Errors:**
- `403` - Not an admin
- `402` - Payment failed

---

## 5.6 Get Usage Statistics

**Endpoint:** `GET /credits/usage-stats`

**Description:** Get usage analytics for organization

**Query Params:**
- `period`: `day` | `week` | `month` | `year` (default: `month`)
- `group_by`: `user` | `operation` | `date` (default: `operation`)

**Response:** `200 OK`
```json
{
  "period": "month",
  "total_credits_used": 450,
  "by_operation": {
    "apollo_search": 200,
    "apollo_enrich": 150,
    "geo_enrichment": 50,
    "property_analysis": 30,
    "service_mapping": 20
  },
  "by_user": [
    {
      "user_id": "uuid",
      "name": "John Doe",
      "credits_used": 150,
      "operations_count": 25
    },
    {
      "user_id": "uuid",
      "name": "Jane Smith",
      "credits_used": 300,
      "operations_count": 60
    }
  ],
  "top_operations": [
    {
      "operation": "apollo_search",
      "count": 20,
      "credits": 200
    }
  ]
}
```

**Permissions:** Admin only

---

# 📁 **6. Modified Lead Endpoints (Credit Integration)**

## 6.1 Search Leads (Apollo)

**Endpoint:** `POST /leads/search`

**Description:** Search for leads using Apollo API

**Request:**
```json
{
  "query": "landscaping companies in Texas",
  "filters": { ... },
  "limit": 50
}
```

**Flow:**
1. Check credits: `can_user_perform_operation('apollo_search', 10)`
2. If insufficient → return `402 Payment Required`
3. Perform Apollo search
4. Deduct credits via ledger
5. Return results

**Response:** `200 OK`
```json
{
  "leads": [...],
  "credits_used": 10,
  "remaining_balance": 840
}
```

**Errors:**
- `402` - Insufficient credits

---

## 6.2 Enrich Lead

**Endpoint:** `POST /leads/:id/enrich`

**Description:** Enrich lead with Apollo data

**Credits:** 5

**Response:**
```json
{
  "lead": { ... },
  "credits_used": 5,
  "remaining_balance": 835
}
```

---

## 6.3 Geo Enrichment

**Endpoint:** `POST /leads/:id/geo-enrichment`

**Credits:** 1

---

## 6.4 Property Analysis

**Endpoint:** `POST /leads/:id/property-analysis`

**Credits:** 2

---

## 6.5 Service Mapping

**Endpoint:** `POST /leads/:id/service-mapping`

**Credits:** 2

---

# 🔒 **Error Codes**

| Code | Error | Description |
|------|-------|-------------|
| `400` | Bad Request | Invalid input |
| `401` | Unauthorized | Missing or invalid auth token |
| `402` | Payment Required | Insufficient credits |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource already exists |
| `410` | Gone | Resource expired |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

---

# 📊 **Standard Response Format**

## Success Response
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-24T12:00:00Z",
    "request_id": "uuid"
  }
}
```

## Error Response
```json
{
  "error": {
    "code": "insufficient_credits",
    "message": "Your organization does not have enough credits to perform this operation",
    "details": {
      "required": 10,
      "available": 5
    }
  },
  "meta": {
    "timestamp": "2026-01-24T12:00:00Z",
    "request_id": "uuid"
  }
}
```

---

# 🔐 **Authorization Matrix**

| Endpoint | Admin | User | Public |
|----------|-------|------|--------|
| `POST /auth/*` | ❌ | ❌ | ✅ |
| `GET /auth/me` | ✅ | ✅ | ❌ |
| `GET /organizations/:id` | ✅ | ✅ (limited) | ❌ |
| `PATCH /organizations/:id` | ✅ | ❌ | ❌ |
| `GET /organizations/:id/members` | ✅ | ❌ | ❌ |
| `POST /organizations/:id/members` | ✅ | ❌ | ❌ |
| `POST /invitations` | ✅ | ❌ | ❌ |
| `GET /credits/balance` | ✅ | ✅ | ❌ |
| `GET /credits/transactions` | ✅ | ✅ (own only) | ❌ |
| `POST /credits/purchase` | ✅ | ❌ | ❌ |
| `GET /credits/usage-stats` | ✅ | ❌ | ❌ |
| `POST /leads/search` | ✅ | ✅ | ❌ |

---

**End of API Contract** 🚀
