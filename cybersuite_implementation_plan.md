# CyberSuite — Senior-Level Production Implementation Plan

> Structured as a 20+ year full-stack architect would design it.  
> Zero fluff. Every decision is justified. Every layer is real.

---

## Table of Contents

1. [System Philosophy & Architecture Decisions](#1-system-philosophy--architecture-decisions)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Technology Stack — Justified](#3-technology-stack--justified)
4. [Database Architecture](#4-database-architecture--full-schema)
5. [Authentication System — Deep Implementation](#5-authentication-system--deep-implementation)
6. [Encryption Architecture](#6-encryption-architecture--zero-knowledge-model)
7. [Module-by-Module Backend Implementation](#7-module-by-module-backend-implementation)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Admin Panel — SOC Implementation](#9-admin-panel--soc-implementation)
10. [Real-Time System — WebSocket Design](#10-real-time-system--websocket-design)
11. [Role System — Multi-Dashboard Implementation](#11-role-system--multi-dashboard-implementation)
12. [Security Hardening — Layer by Layer](#12-security-hardening--layer-by-layer)
13. [Background Jobs & Automation](#13-background-jobs--automation)
14. [Testing Strategy](#14-testing-strategy)
15. [DevOps & Deployment Pipeline](#15-devops--deployment-pipeline)
16. [Build Roadmap — Phase by Phase](#16-build-roadmap--phase-by-phase)
17. [API Contract — Full Reference](#17-api-contract--full-reference)
18. [Environment & Configuration](#18-environment--configuration)

---

## 1. System Philosophy & Architecture Decisions

### Core Principles

**Assume the server is always compromised.**  
Design every feature as if the database, the backend, and the network are all hostile. This one principle dictates everything below.

**Zero-Knowledge by Default.**  
The server must never hold plaintext sensitive data. Encryption and decryption happen exclusively on the client side. The backend is a secure, encrypted data relay and access controller — nothing more.

**Defense in Depth.**  
No single security control is trusted alone. Every sensitive action passes through multiple independent layers: input validation, authentication check, role check, rate limit check, and audit log write. Bypassing one layer should never be enough.

**Least Privilege Everywhere.**  
Every user, every role, every API key, every database connection, and every service holds only the minimum permissions needed to do its job.

**Modular Monolith First, Microservices Later.**  
Starting with microservices adds operational complexity before you understand your traffic patterns. CyberSuite starts as a well-structured modular monolith where each module (auth, chat, vault, medical, etc.) is isolated behind clean internal interfaces. When scale demands it, each module can be extracted into an independent service without rewriting logic — just moving it.

### Architectural Pattern

```
Client (Browser/App)
    ↓
CDN / Edge (Cloudflare)
    ↓
API Gateway (Nginx + Rate Limiter)
    ↓
Application Server (Node.js Modular Monolith)
    ├── Auth Module
    ├── Chat Module (+ Socket.io)
    ├── Vault Module
    ├── Medical Module
    ├── Identity Module
    ├── Warranty Module
    ├── Admin Module
    └── Notification Module
    ↓
Database Layer
    ├── PostgreSQL (primary relational data)
    ├── Redis (sessions, cache, pub/sub)
    └── S3-compatible Storage (encrypted files)
```

---

## 2. Monorepo Structure

A monorepo keeps the frontend, backend, shared types, and tooling in sync. This is how mature engineering teams operate.

```
cybersuite/
├── apps/
│   ├── web/                        # Next.js frontend (user-facing)
│   ├── admin/                      # Next.js admin panel (separate app)
│   └── api/                        # Node.js backend
├── packages/
│   ├── shared-types/               # TypeScript types shared across apps
│   ├── crypto-utils/               # Client-side encryption library
│   ├── ui-components/              # Shared React component library
│   └── config/                     # Shared ESLint, Tailwind, TS configs
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.web
│   │   └── docker-compose.yml
│   ├── nginx/
│   │   └── nginx.conf
│   └── scripts/
│       ├── seed.ts
│       └── migrate.ts
├── .env.example
├── package.json                    # Root workspace config (pnpm workspaces)
└── turbo.json                      # Turborepo build pipeline config
```

### API Server Internal Structure

```
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.middleware.ts
│   │   └── auth.schema.ts          # Zod validation schemas
│   ├── chat/
│   ├── vault/
│   ├── medical/
│   ├── identity/
│   ├── warranty/
│   ├── admin/
│   └── notifications/
├── core/
│   ├── database/
│   │   ├── prisma.client.ts        # Prisma singleton
│   │   └── redis.client.ts
│   ├── middleware/
│   │   ├── authenticate.ts         # JWT verification
│   │   ├── authorize.ts            # RBAC role check
│   │   ├── rateLimiter.ts
│   │   ├── requestLogger.ts
│   │   └── errorHandler.ts
│   ├── socket/
│   │   └── socket.server.ts        # Socket.io setup
│   ├── jobs/                       # Background workers
│   │   ├── warrantyExpiry.job.ts
│   │   ├── breachMonitor.job.ts
│   │   └── sessionCleanup.job.ts
│   └── utils/
│       ├── logger.ts               # Winston logger
│       ├── email.ts                # Nodemailer/Resend
│       └── response.ts             # Standardized API responses
├── app.ts                          # Express app setup
└── server.ts                       # HTTP + Socket server bootstrap
```

---

## 3. Technology Stack — Justified

Every choice below is made deliberately, not arbitrarily.

### Frontend (`apps/web` + `apps/admin`)

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR for SEO, RSC for performance, file-based routing, built-in API routes for BFF pattern |
| Styling | Tailwind CSS | Utility-first = faster iteration, consistent spacing, dark mode via `class` strategy |
| State | Zustand | Simpler than Redux, sufficient for this scale, excellent devtools |
| Data Fetching | TanStack Query (React Query) | Cache management, background refetch, optimistic updates out of the box |
| Forms | React Hook Form + Zod | Performant (no re-render on every keystroke), schema validation shared with backend |
| Animations | Framer Motion | Production-grade physics-based animation, layout animations |
| Charts | Recharts | React-native, composable, sufficient for admin dashboards |
| Real-time | Socket.io client | Matches backend Socket.io server |
| Themes | next-themes | System/light/dark with zero flicker |
| Fonts | Geist (headings) + Inter (body) + JetBrains Mono (code/logs) | Professional, screen-optimized, not overused |
| Icons | Lucide React | Consistent, tree-shakeable, MIT licensed |
| i18n | next-intl | Type-safe translations, works with App Router |

### Backend (`apps/api`)

| Concern | Choice | Reason |
|---|---|---|
| Runtime | Node.js 20 LTS | Stable, excellent ecosystem, async I/O for concurrent connections |
| Framework | Express.js | Minimal, flexible, well-understood; we add structure ourselves (important for security control) |
| Language | TypeScript | Type safety reduces bugs by 40-60% in production systems |
| ORM | Prisma | Type-safe queries, migrations system, excellent PostgreSQL support |
| Validation | Zod | Runtime schema validation, types flow to frontend automatically |
| Auth | jose (JWT) + bcrypt | Low-level JWT control, bcrypt for password hashing |
| Real-time | Socket.io | Fallback to long-polling if WebSocket blocked, room-based routing |
| Email | Resend | Modern, reliable, excellent developer experience |
| File handling | Multer + AWS S3 SDK | Stream directly to S3, never buffer full file in memory |
| Logging | Winston + Pino | Structured JSON logs, multiple transports |
| Job scheduling | node-cron | Simple, sufficient for CyberSuite's background jobs |
| Testing | Vitest + Supertest | Fast, ESM-native, excellent for API testing |

### Database

| Concern | Choice | Reason |
|---|---|---|
| Primary DB | PostgreSQL 16 | ACID transactions, JSONB for flexible data, row-level security, proven at scale |
| Cache / Sessions | Redis 7 | Sub-millisecond reads for session validation on every request |
| File storage | S3 (or MinIO for self-hosted) | Proven, cheap, handles any file size, pre-signed URLs |
| Search (future) | PostgreSQL full-text first, then Meilisearch if needed | Start simple |

---

## 4. Database Architecture — Full Schema

### Design Rules
- Every table has `id UUID DEFAULT gen_random_uuid()` — never auto-increment integers (prevents enumeration attacks)
- Every table has `created_at` and `updated_at`
- Sensitive string columns store only encrypted ciphertext — never plaintext
- Foreign keys are always explicit with `ON DELETE` behavior defined
- Indexes are added for every column used in WHERE, JOIN, or ORDER BY

```sql
-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,           -- bcrypt hash
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'individual',
    -- 'individual' | 'student' | 'academic' | 'doctor' | 
    -- 'lawyer' | 'healthcare_staff' | 'admin'
    status          VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
    -- 'pending_verification' | 'active' | 'suspended' | 'banned'
    is_email_verified       BOOLEAN DEFAULT FALSE,
    two_fa_secret           VARCHAR(255),            -- TOTP secret (encrypted)
    two_fa_enabled          BOOLEAN DEFAULT FALSE,
    risk_score              INTEGER DEFAULT 0,       -- 0-100, calculated by system
    security_score          INTEGER DEFAULT 50,      -- 0-100, user's security health
    locale                  VARCHAR(10) DEFAULT 'en',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- SESSIONS & DEVICES
-- ============================================

CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash  VARCHAR(255) NOT NULL,       -- bcrypt hash of refresh token
    device_name     VARCHAR(255),
    device_type     VARCHAR(50),                     -- 'desktop' | 'mobile' | 'tablet'
    browser         VARCHAR(255),
    os              VARCHAR(255),
    ip_address      INET,
    location_country    VARCHAR(100),
    location_city       VARCHAR(100),
    is_trusted          BOOLEAN DEFAULT FALSE,
    last_active_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================
-- PROFESSIONAL VERIFICATION
-- ============================================

CREATE TABLE professional_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profession          VARCHAR(100) NOT NULL,       -- 'doctor' | 'lawyer' | etc.
    license_number      VARCHAR(255),                -- encrypted
    institution         VARCHAR(255),
    specialization      VARCHAR(255),
    years_experience    INTEGER,
    verification_status VARCHAR(50) DEFAULT 'pending',
    -- 'pending' | 'under_review' | 'verified' | 'rejected'
    verified_by         UUID REFERENCES users(id),  -- admin user id
    verified_at         TIMESTAMPTZ,
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE verification_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
    document_type   VARCHAR(100) NOT NULL,           -- 'license' | 'degree' | 'id_proof'
    file_key        VARCHAR(500) NOT NULL,           -- S3 object key
    file_name       VARCHAR(255),
    mime_type       VARCHAR(100),
    is_encrypted    BOOLEAN DEFAULT TRUE,
    uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VAULT (PASSWORD MANAGER)
-- ============================================

CREATE TABLE vault_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_blob  TEXT NOT NULL,  -- entire entry object encrypted client-side (AES-256-GCM)
    -- server never sees: title, username, password, url, notes
    entry_iv        VARCHAR(255) NOT NULL,           -- AES initialization vector
    category        VARCHAR(100),                    -- 'social' | 'banking' | 'work' etc.
    -- category stored in plaintext for filtering (not sensitive)
    last_accessed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vault_user_id ON vault_entries(user_id);

-- ============================================
-- SECURE CHAT
-- ============================================

CREATE TABLE chat_rooms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type       VARCHAR(50) NOT NULL DEFAULT 'direct', -- 'direct' | 'group'
    name            VARCHAR(255),               -- for group chats
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id         UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id         UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_message   TEXT NOT NULL,          -- AES encrypted with session key
    encrypted_key       TEXT NOT NULL,          -- AES key encrypted with receiver RSA public key
    iv                  VARCHAR(255) NOT NULL,  -- AES initialization vector
    hmac                VARCHAR(255) NOT NULL,  -- HMAC-SHA256 for tamper detection
    message_type        VARCHAR(50) DEFAULT 'text', -- 'text' | 'file' | 'voice'
    file_key            VARCHAR(500),           -- S3 key for file messages
    status              VARCHAR(50) DEFAULT 'sent', -- 'sent' | 'delivered' | 'read'
    self_destruct_at    TIMESTAMPTZ,            -- null = no self-destruct
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ============================================
-- MEDICAL RECORDS
-- ============================================

CREATE TABLE medical_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_type     VARCHAR(100) NOT NULL,  -- 'prescription' | 'lab_report' | 'scan' | 'vaccination'
    file_key        VARCHAR(500) NOT NULL,  -- S3 key
    encrypted_metadata  TEXT,              -- title, notes, doctor name - encrypted
    digital_signature   TEXT,             -- doctor's signature (if uploaded by doctor)
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE medical_access_grants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id       UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    granted_to      UUID REFERENCES users(id), -- null if QR-based
    access_token    VARCHAR(255) UNIQUE,        -- hashed token for QR access
    access_scope    JSONB,                      -- which fields are accessible
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    accessed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- IDENTITY WALLET
-- ============================================

CREATE TABLE identity_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type        VARCHAR(100) NOT NULL,  -- 'aadhaar' | 'pan' | 'passport' | 'license'
    encrypted_blob  TEXT NOT NULL,          -- all fields encrypted client-side
    doc_iv          VARCHAR(255) NOT NULL,
    file_key        VARCHAR(500),           -- optional uploaded document image
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WARRANTY WALLET
-- ============================================

CREATE TABLE warranty_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name        VARCHAR(500) NOT NULL,
    purchase_date       DATE NOT NULL,
    warranty_expiry     DATE NOT NULL,
    purchase_price      DECIMAL(12,2),
    currency            VARCHAR(10) DEFAULT 'INR',
    vendor_name         VARCHAR(255),
    bill_file_key       VARCHAR(500),           -- encrypted S3 key
    serial_number       VARCHAR(255),           -- encrypted
    notes               TEXT,
    category            VARCHAR(100),
    notification_sent_7_day     BOOLEAN DEFAULT FALSE,
    notification_sent_1_day     BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warranty_user_id ON warranty_items(user_id);
CREATE INDEX idx_warranty_expiry ON warranty_items(warranty_expiry);

-- ============================================
-- SECURE FILE VAULT
-- ============================================

CREATE TABLE file_vault (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_folder_id    UUID REFERENCES file_vault(id), -- null = root
    item_type       VARCHAR(20) NOT NULL,    -- 'folder' | 'file'
    encrypted_name  TEXT NOT NULL,           -- file/folder name encrypted
    name_iv         VARCHAR(255),
    file_key        VARCHAR(500),            -- S3 key (null for folders)
    mime_type       VARCHAR(100),
    size_bytes      BIGINT,
    is_encrypted    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS TRACKER
-- ============================================

CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name    VARCHAR(255) NOT NULL,
    amount          DECIMAL(10,2),
    currency        VARCHAR(10) DEFAULT 'INR',
    billing_cycle   VARCHAR(50),    -- 'monthly' | 'yearly' | 'weekly'
    next_billing_date   DATE,
    category        VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    notification_sent   BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMERGENCY PROFILE
-- ============================================

CREATE TABLE emergency_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_group     VARCHAR(10),
    allergies       TEXT[],
    chronic_conditions  TEXT[],
    emergency_contacts  JSONB,       -- [{name, phone, relation}]
    current_medications TEXT[],
    qr_token        VARCHAR(255) UNIQUE,     -- for QR lock screen access
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    admin_id        UUID REFERENCES users(id),  -- set if action taken by admin
    action          VARCHAR(255) NOT NULL,
    -- e.g. 'vault.entry.created' | 'auth.login.success' | 'admin.user.suspended'
    resource_type   VARCHAR(100),
    resource_id     VARCHAR(255),
    metadata        JSONB,          -- additional context (never sensitive data)
    ip_address      INET,
    user_agent      TEXT,
    success         BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- SECURITY ALERTS
-- ============================================

CREATE TABLE security_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    alert_type      VARCHAR(100) NOT NULL,
    -- 'brute_force' | 'suspicious_login' | 'api_abuse' | 'device_anomaly'
    severity        VARCHAR(20) NOT NULL DEFAULT 'medium',
    -- 'low' | 'medium' | 'high' | 'critical'
    status          VARCHAR(50) DEFAULT 'new',
    -- 'new' | 'investigating' | 'resolved' | 'ignored'
    ip_address      INET,
    metadata        JSONB,
    resolved_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADMIN: INCIDENTS
-- ============================================

CREATE TABLE incidents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    severity        VARCHAR(20) NOT NULL DEFAULT 'medium',
    status          VARCHAR(50) DEFAULT 'open',
    -- 'open' | 'investigating' | 'contained' | 'resolved'
    assigned_to     UUID REFERENCES users(id),
    created_by      UUID REFERENCES users(id),
    related_alert_ids   UUID[],
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADMIN: POLICIES
-- ============================================

CREATE TABLE system_policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_key      VARCHAR(255) UNIQUE NOT NULL,
    policy_value    JSONB NOT NULL,
    description     TEXT,
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default policies
INSERT INTO system_policies (policy_key, policy_value, description) VALUES
('max_login_attempts', '{"value": 5}', 'Max failed logins before lockout'),
('session_timeout_minutes', '{"value": 30}', 'Admin session timeout'),
('require_2fa_for_professionals', '{"value": true}', 'Force 2FA for doctors/lawyers'),
('password_min_length', '{"value": 12}', 'Minimum password length');
```

---

## 5. Authentication System — Deep Implementation

### Password Hashing

```typescript
// packages/crypto-utils/src/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12; // ~250ms on modern hardware (good balance)

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
```

### JWT Token System

```typescript
// apps/api/src/core/auth/tokens.ts
import { SignJWT, jwtVerify } from 'jose';

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

export interface AccessTokenPayload {
  sub: string;        // user_id
  sessionId: string;
  role: string;
  deviceId: string;
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')   // Short expiry — critical
    .sign(ACCESS_TOKEN_SECRET);
}

export async function signRefreshToken(payload: { sub: string; sessionId: string }): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(REFRESH_TOKEN_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
  return payload;
}
```

### Login Flow — Complete Implementation

```typescript
// apps/api/src/modules/auth/auth.service.ts
import { prisma } from '../../core/database/prisma.client';
import { redis } from '../../core/database/redis.client';
import { verifyPassword, hashPassword } from '../../../packages/crypto-utils';
import { signAccessToken, signRefreshToken } from './tokens';
import { sendEmail } from '../../core/utils/email';
import { createAuditLog } from '../admin/audit.service';
import crypto from 'crypto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 900; // 15 minutes

export async function loginUser(
  email: string,
  password: string,
  deviceInfo: DeviceInfo,
  ip: string
) {
  // 1. Check if IP or account is temporarily locked
  const lockoutKey = `lockout:${email}`;
  const lockoutCount = await redis.get(lockoutKey);
  if (lockoutCount && parseInt(lockoutCount) >= MAX_FAILED_ATTEMPTS) {
    throw new AuthError('ACCOUNT_LOCKED', 'Too many failed attempts. Try again in 15 minutes.');
  }

  // 2. Fetch user
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    // Still increment lockout to prevent email enumeration timing attacks
    await redis.incr(lockoutKey);
    await redis.expire(lockoutKey, LOCKOUT_DURATION_SECONDS);
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  // 3. Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    await redis.incr(lockoutKey);
    await redis.expire(lockoutKey, LOCKOUT_DURATION_SECONDS);
    await createAuditLog({
      userId: user.id,
      action: 'auth.login.failed',
      metadata: { ip, reason: 'invalid_password' },
      ip,
      success: false
    });
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  // 4. Check account status
  if (user.status === 'suspended') {
    throw new AuthError('ACCOUNT_SUSPENDED', 'Account suspended. Contact support.');
  }

  // 5. If 2FA enabled, don't issue tokens yet
  if (user.two_fa_enabled) {
    const tempToken = crypto.randomBytes(32).toString('hex');
    await redis.setex(`2fa_pending:${tempToken}`, 300, user.id); // 5 min TTL
    return { requiresTwoFactor: true, tempToken };
  }

  // 6. Create session
  const sessionId = crypto.randomUUID();
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  await prisma.sessions.create({
    data: {
      id: sessionId,
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      device_name: deviceInfo.name,
      device_type: deviceInfo.type,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ip_address: ip,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  // 7. Clear lockout
  await redis.del(lockoutKey);

  // 8. Detect suspicious login (new device/location)
  await checkForSuspiciousLogin(user, deviceInfo, ip);

  // 9. Issue tokens
  const accessToken = await signAccessToken({
    sub: user.id,
    sessionId,
    role: user.role,
    deviceId: deviceInfo.fingerprint
  });

  // 10. Audit log
  await createAuditLog({
    userId: user.id,
    action: 'auth.login.success',
    metadata: { ip, device: deviceInfo.name },
    ip,
    success: true
  });

  return {
    accessToken,
    refreshToken,     // send via httpOnly cookie
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    }
  };
}
```

### Authentication Middleware

```typescript
// apps/api/src/core/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/tokens';
import { redis } from '../database/redis.client';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.split(' ')[1];
    const payload = await verifyAccessToken(token);

    // Check if session is revoked (logout all devices scenario)
    const isRevoked = await redis.get(`revoked_session:${payload.sessionId}`);
    if (isRevoked) {
      return res.status(401).json({ error: 'Session revoked' });
    }

    req.user = {
      id: payload.sub,
      sessionId: payload.sessionId,
      role: payload.role
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// RBAC middleware
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}
```

---

## 6. Encryption Architecture — Zero-Knowledge Model

### Client-Side Encryption (runs in browser/app — NEVER server)

```typescript
// packages/crypto-utils/src/vault-crypto.ts

/**
 * PBKDF2 key derivation from master password.
 * iterations=310000 is OWASP 2023 recommendation for PBKDF2-HMAC-SHA256
 */
export async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordBuffer = new TextEncoder().encode(masterPassword);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 310_000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,   // non-extractable
    ['encrypt', 'decrypt']
  );
}

export async function encryptVaultEntry(
  data: object,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

export async function decryptVaultEntry(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<object> {
  const ciphertextBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    ciphertextBuffer
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
}

/**
 * RSA key pair generation for secure chat key exchange
 */
export async function generateRSAKeyPair(): Promise<{
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );

  return {
    publicKey: await window.crypto.subtle.exportKey('jwk', keyPair.publicKey),
    privateKey: await window.crypto.subtle.exportKey('jwk', keyPair.privateKey)
    // privateKey stored ONLY in browser IndexedDB — never sent to server
  };
}
```

---

## 7. Module-by-Module Backend Implementation

### Vault Module Routes

```typescript
// apps/api/src/modules/vault/vault.routes.ts
import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { rateLimiter } from '../../core/middleware/rateLimiter';
import { validate } from '../../core/middleware/validate';
import * as vaultController from './vault.controller';
import { createVaultEntrySchema, updateVaultEntrySchema } from './vault.schema';

const router = Router();

// All vault routes require authentication
router.use(authenticate);
router.use(rateLimiter({ windowMs: 60_000, max: 100 }));

router.get('/', vaultController.listEntries);
router.post('/', validate(createVaultEntrySchema), vaultController.createEntry);
router.put('/:id', validate(updateVaultEntrySchema), vaultController.updateEntry);
router.delete('/:id', vaultController.deleteEntry);

export default router;
```

```typescript
// apps/api/src/modules/vault/vault.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.client';
import { createAuditLog } from '../admin/audit.service';

export async function listEntries(req: Request, res: Response) {
  const entries = await prisma.vault_entries.findMany({
    where: { user_id: req.user!.id },
    select: {
      id: true,
      encrypted_blob: true,
      entry_iv: true,
      category: true,
      last_accessed_at: true,
      created_at: true,
      updated_at: true
      // Never select fields that don't exist — we only store encrypted blobs
    },
    orderBy: { updated_at: 'desc' }
  });

  return res.json({ entries });
}

export async function createEntry(req: Request, res: Response) {
  const { encrypted_blob, entry_iv, category } = req.body;
  // encrypted_blob = AES-256-GCM encrypted JSON of {title, username, password, url, notes}
  // Server receives ONLY ciphertext — it has NO way to read the content

  const entry = await prisma.vault_entries.create({
    data: {
      user_id: req.user!.id,
      encrypted_blob,
      entry_iv,
      category
    }
  });

  await createAuditLog({
    userId: req.user!.id,
    action: 'vault.entry.created',
    resourceType: 'vault_entry',
    resourceId: entry.id,
    ip: req.ip
  });

  return res.status(201).json({ entry });
}
```

### Chat Module — Socket Events

```typescript
// apps/api/src/core/socket/socket.server.ts
import { Server } from 'socket.io';
import { verifyAccessToken } from '../auth/tokens';
import { prisma } from '../database/prisma.client';
import { redis } from '../database/redis.client';

export function initializeSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
    transports: ['websocket', 'polling']
  });

  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const payload = await verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.sessionId = payload.sessionId;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;

    // Mark user as online
    await redis.setex(`online:${userId}`, 30, '1');
    socket.join(`user:${userId}`); // Personal room for direct notifications

    // Send message
    socket.on('message:send', async (data) => {
      const { roomId, encryptedMessage, encryptedKey, iv, hmac, selfDestructAt } = data;

      // Verify sender is a participant
      const isParticipant = await prisma.chat_participants.findUnique({
        where: { room_id_user_id: { room_id: roomId, user_id: userId } }
      });
      if (!isParticipant) return;

      const message = await prisma.messages.create({
        data: {
          room_id: roomId,
          sender_id: userId,
          encrypted_message: encryptedMessage,
          encrypted_key: encryptedKey,
          iv,
          hmac,
          self_destruct_at: selfDestructAt ? new Date(selfDestructAt) : null,
          status: 'sent'
        }
      });

      // Emit to all room participants
      io.to(`room:${roomId}`).emit('message:new', message);
    });

    socket.on('typing:start', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('typing:user', { userId, typing: true });
    });

    socket.on('message:read', async ({ messageId }) => {
      await prisma.messages.update({
        where: { id: messageId },
        data: { status: 'read' }
      });
      socket.to(`user:${userId}`).emit('message:status_updated', { messageId, status: 'read' });
    });

    socket.on('disconnect', async () => {
      await redis.del(`online:${userId}`);
    });
  });

  return io;
}
```

---

## 8. Frontend Architecture

### Zustand Store Structure

```typescript
// apps/web/src/store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }) // Never persist token in localStorage
    }
  )
);

// apps/web/src/store/vault.store.ts
import { create } from 'zustand';

interface VaultState {
  isUnlocked: boolean;
  derivedKey: CryptoKey | null;
  autoLockTimer: NodeJS.Timeout | null;
  unlock: (key: CryptoKey) => void;
  lock: () => void;
  resetAutoLockTimer: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  isUnlocked: false,
  derivedKey: null,
  autoLockTimer: null,
  unlock: (key) => {
    const timer = setTimeout(() => get().lock(), 5 * 60 * 1000); // 5 min auto-lock
    set({ isUnlocked: true, derivedKey: key, autoLockTimer: timer });
  },
  lock: () => {
    const { autoLockTimer } = get();
    if (autoLockTimer) clearTimeout(autoLockTimer);
    set({ isUnlocked: false, derivedKey: null, autoLockTimer: null });
  },
  resetAutoLockTimer: () => {
    const { autoLockTimer, unlock, derivedKey } = get();
    if (autoLockTimer) clearTimeout(autoLockTimer);
    if (derivedKey) {
      const timer = setTimeout(() => get().lock(), 5 * 60 * 1000);
      set({ autoLockTimer: timer });
    }
  }
}));
```

### API Client with Token Refresh

```typescript
// apps/web/src/lib/api-client.ts
import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '../store/auth.store';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true  // Include httpOnly cookies (refresh token)
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let pendingQueue: Array<{ resolve: Function; reject: Function }> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken;
        useAuthStore.getState().setAuth(data.user, newToken);
        pendingQueue.forEach(({ resolve }) => resolve(newToken));
        pendingQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().clearAuth();
        pendingQueue.forEach(({ reject }) => reject(error));
        pendingQueue = [];
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 9. Admin Panel — SOC Implementation

### Real-Time Dashboard Stats

```typescript
// apps/api/src/modules/admin/admin.service.ts
import { prisma } from '../../core/database/prisma.client';
import { redis } from '../../core/database/redis.client';

export async function getDashboardStats() {
  const [
    totalUsers,
    activeSessionCount,
    newSignupsToday,
    failedLoginsToday,
    pendingVerifications,
    openIncidents,
    criticalAlerts
  ] = await Promise.all([
    prisma.users.count({ where: { status: 'active' } }),

    // Active sessions from Redis (real-time online users)
    redis.keys('online:*').then(keys => keys.length),

    prisma.users.count({
      where: {
        created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    }),

    prisma.audit_logs.count({
      where: {
        action: 'auth.login.failed',
        created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }
    }),

    prisma.professional_profiles.count({
      where: { verification_status: 'pending' }
    }),

    prisma.incidents.count({ where: { status: { not: 'resolved' } } }),

    prisma.security_alerts.count({
      where: { severity: 'critical', status: 'new' }
    })
  ]);

  return {
    totalUsers,
    activeSessionCount,
    newSignupsToday,
    failedLoginsToday,
    pendingVerifications,
    openIncidents,
    criticalAlerts
  };
}

export async function getUserGrowthChart(days: number = 30) {
  const result = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('day', created_at) as date,
      COUNT(*) as count
    FROM users
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY date ASC
  `;
  return result;
}
```

### Admin Policy Engine

```typescript
// apps/api/src/modules/admin/policy.service.ts
import { prisma } from '../../core/database/prisma.client';
import { redis } from '../../core/database/redis.client';

const POLICY_CACHE_TTL = 300; // 5 minutes

export async function getPolicy(key: string): Promise<any> {
  // Check cache first
  const cached = await redis.get(`policy:${key}`);
  if (cached) return JSON.parse(cached);

  const policy = await prisma.system_policies.findUnique({ where: { policy_key: key } });
  if (!policy) throw new Error(`Policy ${key} not found`);

  await redis.setex(`policy:${key}`, POLICY_CACHE_TTL, JSON.stringify(policy.policy_value));
  return policy.policy_value;
}

export async function updatePolicy(key: string, value: any, adminId: string) {
  const updated = await prisma.system_policies.update({
    where: { policy_key: key },
    data: { policy_value: value, updated_by: adminId, updated_at: new Date() }
  });

  // Invalidate cache
  await redis.del(`policy:${key}`);
  return updated;
}
```

### Automation Rules Engine

```typescript
// apps/api/src/modules/admin/automation.service.ts

interface AutomationRule {
  trigger: string;
  condition: object;
  action: string;
  actionParams: object;
}

// Evaluate automation rules after each security event
export async function evaluateRules(event: string, context: object) {
  const maxLoginAttempts = (await getPolicy('max_login_attempts')).value;

  if (event === 'auth.login.failed') {
    const { userId, ip } = context as any;
    const failCount = await getFailedLoginCount(userId);

    if (failCount >= maxLoginAttempts) {
      // Auto-block
      await lockAccount(userId, 'auto_lockout', 'Automatic lockout after too many failed attempts');
      await createSecurityAlert({
        userId,
        alertType: 'brute_force',
        severity: 'high',
        metadata: { ip, failCount }
      });
    }
  }
}
```

---

## 10. Real-Time System — WebSocket Design

### Socket Room Architecture

```
socket rooms:
  user:{userId}           → personal notifications
  room:{chatRoomId}       → chat messages
  admin:dashboard         → live admin stats stream
  admin:alerts            → real-time security alerts
```

### Admin Real-Time Stream

```typescript
// Push real-time stats to admin dashboard every 5 seconds
setInterval(async () => {
  const stats = await getDashboardStats();
  io.to('admin:dashboard').emit('stats:update', stats);
}, 5000);

// Push new alerts instantly
export async function broadcastAlert(alert: SecurityAlert) {
  await prisma.security_alerts.create({ data: alert });
  io.to('admin:alerts').emit('alert:new', alert);
}
```

---

## 11. Role System — Multi-Dashboard Implementation

### Role-Based Route Guard (Frontend)

```typescript
// apps/web/src/components/RouteGuard.tsx
'use client';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ROLE_HOME_MAP: Record<string, string> = {
  individual: '/dashboard',
  student: '/dashboard/student',
  academic: '/dashboard/academic',
  doctor: '/dashboard/doctor',
  lawyer: '/dashboard/lawyer',
  healthcare_staff: '/dashboard/healthcare',
  admin: '/admin'
};

export function RoleRouter() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user) {
      router.replace(ROLE_HOME_MAP[user.role] || '/dashboard');
    }
  }, [isAuthenticated, user]);

  return null;
}
```

### Dashboard Layout — Dynamic Sidebar

```typescript
// apps/web/src/config/sidebar.config.ts
import { LucideIcon, Shield, MessageCircle, Key, Stethoscope, Scale, FileText, AlertCircle, User } from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: string[];  // which roles see this item
  badge?: string;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Shield, roles: ['*'] },
  { label: 'Secure Chat', href: '/chat', icon: MessageCircle, roles: ['*'] },
  { label: 'Password Vault', href: '/vault', icon: Key, roles: ['*'] },
  { label: 'My Patients', href: '/patients', icon: Stethoscope, roles: ['doctor', 'healthcare_staff'] },
  { label: 'Consultations', href: '/consultations', icon: User, roles: ['doctor', 'lawyer'] },
  { label: 'Case Files', href: '/cases', icon: Scale, roles: ['lawyer'] },
  { label: 'Medical Records', href: '/medical', icon: FileText, roles: ['*'] },
  { label: 'Identity Wallet', href: '/identity', icon: User, roles: ['*'] },
  { label: 'Security Alerts', href: '/alerts', icon: AlertCircle, roles: ['*'] },
];

export function getSidebarForRole(role: string): SidebarItem[] {
  return SIDEBAR_ITEMS.filter(
    item => item.roles.includes('*') || item.roles.includes(role)
  );
}
```

---

## 12. Security Hardening — Layer by Layer

### Express Security Setup

```typescript
// apps/api/src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createRateLimiter } from './core/middleware/rateLimiter';
import cookieParser from 'cookie-parser';
import { requestLogger } from './core/middleware/requestLogger';
import { errorHandler } from './core/middleware/errorHandler';

const app = express();

// Layer 1: Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL!],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// Layer 2: CORS — whitelist only
app.use(cors({
  origin: [process.env.FRONTEND_URL!, process.env.ADMIN_URL!],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Layer 3: Global rate limit
app.use(createRateLimiter({ windowMs: 60_000, max: 200 }));

// Layer 4: Body parser with size limits
app.use(express.json({ limit: '10kb' }));       // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Layer 5: Request logging
app.use(requestLogger);

// Routes...

// Layer 6: Centralized error handler (last)
app.use(errorHandler);

export default app;
```

### Input Validation with Zod

```typescript
// apps/api/src/modules/auth/auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100).trim(),
    email: z.string().email().toLowerCase().trim(),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[a-z]/, 'Must contain lowercase letter')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
    role: z.enum(['individual', 'student', 'academic', 'doctor', 'lawyer', 'healthcare_staff'])
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1)
  })
});
```

---

## 13. Background Jobs & Automation

```typescript
// apps/api/src/core/jobs/warrantyExpiry.job.ts
import cron from 'node-cron';
import { prisma } from '../database/prisma.client';
import { sendEmail } from '../utils/email';

// Run daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  const today = new Date();
  
  // Find warranties expiring in 7 days
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringSoon = await prisma.warranty_items.findMany({
    where: {
      warranty_expiry: {
        gte: today,
        lte: sevenDaysFromNow
      },
      notification_sent_7_day: false
    },
    include: { user: { select: { email: true, full_name: true } } }
  });

  for (const item of expiringSoon) {
    await sendEmail({
      to: item.user.email,
      subject: `Warranty expiring soon: ${item.product_name}`,
      template: 'warranty-expiry',
      data: {
        userName: item.user.full_name,
        productName: item.product_name,
        expiryDate: item.warranty_expiry,
        daysLeft: 7
      }
    });

    await prisma.warranty_items.update({
      where: { id: item.id },
      data: { notification_sent_7_day: true }
    });
  }
});
```

---

## 14. Testing Strategy

### Unit Tests (Vitest)

```typescript
// apps/api/src/modules/auth/__tests__/auth.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginUser } from '../auth.service';

describe('Auth Service - loginUser', () => {
  it('should throw ACCOUNT_LOCKED when too many failed attempts', async () => {
    // Arrange: mock redis to return lockout count >= 5
    vi.mocked(redis.get).mockResolvedValue('5');

    // Act & Assert
    await expect(loginUser('test@test.com', 'password', mockDevice, '127.0.0.1'))
      .rejects.toMatchObject({ code: 'ACCOUNT_LOCKED' });
  });

  it('should not reveal whether email exists (timing safe)', async () => {
    // Valid email, wrong password should take same time as invalid email
    const startValid = Date.now();
    try { await loginUser('exists@test.com', 'wrong', mockDevice, '127.0.0.1'); } catch {}
    const validTime = Date.now() - startValid;

    const startInvalid = Date.now();
    try { await loginUser('notexists@test.com', 'wrong', mockDevice, '127.0.0.1'); } catch {}
    const invalidTime = Date.now() - startInvalid;

    // Both should take roughly the same time (bcrypt hash comparison)
    expect(Math.abs(validTime - invalidTime)).toBeLessThan(50);
  });
});
```

### Integration Tests (Supertest)

```typescript
// apps/api/src/__tests__/integration/vault.test.ts
import request from 'supertest';
import app from '../../app';

describe('Vault API Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login and get token
    const { body } = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'TestPass123!' });
    authToken = body.accessToken;
  });

  it('GET /vault returns only current user entries', async () => {
    const res = await request(app)
      .get('/api/vault')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.entries).toBeInstanceOf(Array);
    // Verify no plaintext passwords leak
    res.body.entries.forEach((entry: any) => {
      expect(entry).not.toHaveProperty('password');
      expect(entry).toHaveProperty('encrypted_blob');
    });
  });
});
```

### Security Tests (OWASP-aligned)

```typescript
// apps/api/src/__tests__/security/sql-injection.test.ts
describe('SQL Injection Prevention', () => {
  it('should reject SQL injection in email field', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: "' OR '1'='1", password: 'anything' });
    expect(res.status).toBe(400); // Zod validation rejects invalid email
  });
});

describe('Rate Limiting', () => {
  it('should block after 200 requests per minute', async () => {
    const requests = Array(201).fill(null).map(() =>
      request(app).get('/api/health')
    );
    const responses = await Promise.all(requests);
    const blocked = responses.filter(r => r.status === 429);
    expect(blocked.length).toBeGreaterThan(0);
  });
});
```

---

## 15. DevOps & Deployment Pipeline

### Docker Compose (Development)

```yaml
# infrastructure/docker/docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: cybersuite
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']

  api:
    build:
      context: ../../
      dockerfile: infrastructure/docker/Dockerfile.api
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/cybersuite
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    ports:
      - '4000:4000'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ../../apps/api:/app/apps/api    # Hot reload in dev

  web:
    build:
      context: ../../
      dockerfile: infrastructure/docker/Dockerfile.web
    environment:
      NEXT_PUBLIC_API_URL: http://api:4000
    ports:
      - '3000:3000'
    depends_on:
      - api

volumes:
  postgres_data:
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: CyberSuite CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: cybersuite_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run test

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run npm audit
        run: pnpm audit --audit-level moderate
      - name: Run SAST scan
        uses: github/codeql-action/analyze@v3

  deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway/Render
        run: # your deployment command
```

---

## 16. Build Roadmap — Phase by Phase

### Phase 1 — Foundation (Weeks 1–3)
**Goal: Working, secure auth + vault + admin shell**

| Task | Effort | Output |
|---|---|---|
| Monorepo setup (pnpm + Turborepo) | 1 day | Project scaffold |
| PostgreSQL + Prisma schema (all tables) | 2 days | Full DB schema |
| Auth system (register, login, JWT, 2FA, sessions) | 3 days | Secure auth API |
| Vault module (CRUD, client-side encryption demo) | 2 days | Working vault |
| Admin panel shell (sidebar, routing, auth) | 2 days | Admin UI scaffold |
| Docker compose + basic CI | 1 day | Dev environment |

### Phase 2 — Core Features (Weeks 4–7)
**Goal: Chat, admin dashboard with live data, professional verification**

| Task | Effort |
|---|---|
| Secure chat (Socket.io + E2EE) | 4 days |
| Admin dashboard (real data, charts, alerts) | 4 days |
| Professional verification workflow | 3 days |
| Audit log system | 2 days |
| Rate limiting + security hardening | 2 days |

### Phase 3 — Extended Modules (Weeks 8–11)
**Goal: Medical, identity, warranty, file vault**

| Task | Effort |
|---|---|
| Medical records + QR sharing | 3 days |
| Identity wallet | 2 days |
| Warranty wallet + expiry jobs | 2 days |
| Secure file vault | 2 days |
| Emergency profile + QR | 2 days |

### Phase 4 — Intelligence & Polish (Weeks 12–14)
**Goal: Admin SOC features, automation, multi-language, PWA**

| Task | Effort |
|---|---|
| Policy engine + automation rules | 3 days |
| Security score engine | 2 days |
| Incident management | 2 days |
| Multi-language (next-intl) | 2 days |
| PWA setup + offline vault | 2 days |
| Performance + accessibility audit | 2 days |

---

## 17. API Contract — Full Reference

### Standard Response Format

```typescript
// Every API response follows this contract
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;           // Machine-readable: 'INVALID_CREDENTIALS'
    message: string;        // Human-readable: 'Invalid email or password.'
    details?: object;       // Validation errors
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}
```

### Complete Endpoint Reference

```
AUTH
POST   /api/auth/register              Register new user
POST   /api/auth/login                 Login
POST   /api/auth/logout                Logout current session
POST   /api/auth/refresh               Refresh access token
POST   /api/auth/verify-email          Verify email with token
POST   /api/auth/forgot-password       Request password reset
POST   /api/auth/reset-password        Submit new password
POST   /api/auth/enable-2fa            Generate TOTP secret
POST   /api/auth/verify-2fa            Confirm 2FA setup
POST   /api/auth/logout-all            Revoke all sessions

USERS
GET    /api/users/me                   Get current user profile
PATCH  /api/users/me                   Update profile
GET    /api/users/me/devices           List active sessions/devices
DELETE /api/users/me/devices/:id       Logout specific device

VAULT
GET    /api/vault                      List encrypted entries
POST   /api/vault                      Create entry
PUT    /api/vault/:id                  Update entry
DELETE /api/vault/:id                  Delete entry

CHAT
GET    /api/chat/rooms                 List chat rooms
POST   /api/chat/rooms                 Create/find direct room
GET    /api/chat/rooms/:id/messages    Get message history
POST   /api/chat/rooms/:id/media       Upload encrypted media

MEDICAL
GET    /api/medical                    List user's records
POST   /api/medical/upload             Upload encrypted record
POST   /api/medical/:id/share          Generate QR share token
GET    /api/medical/shared/:token      Access shared record (no auth)
DELETE /api/medical/:id/share          Revoke share

IDENTITY
GET    /api/identity                   List identity documents
POST   /api/identity                   Add document
DELETE /api/identity/:id               Delete document

WARRANTY
GET    /api/warranty                   List items
POST   /api/warranty                   Add item
PUT    /api/warranty/:id               Update item
DELETE /api/warranty/:id               Delete item

FILES
GET    /api/files                      List file vault
POST   /api/files/upload               Upload encrypted file
POST   /api/files/folder               Create folder
GET    /api/files/:id/download         Download file
DELETE /api/files/:id                  Delete file

VERIFICATION
POST   /api/verify/upload              Upload verification docs
GET    /api/verify/status              Check verification status

ADMIN (all require admin role)
GET    /api/admin/dashboard/stats      Real-time KPI stats
GET    /api/admin/users                List all users (paginated)
PATCH  /api/admin/users/:id/status     Suspend / activate user
POST   /api/admin/users/:id/logout-all Force logout all sessions
GET    /api/admin/professionals        List verification requests
POST   /api/admin/professionals/:id/verify   Approve verification
POST   /api/admin/professionals/:id/reject   Reject verification
GET    /api/admin/alerts               List security alerts
PATCH  /api/admin/alerts/:id           Update alert status
GET    /api/admin/incidents            List incidents
POST   /api/admin/incidents            Create incident
PATCH  /api/admin/incidents/:id        Update incident
GET    /api/admin/logs                 Audit log (filtered)
GET    /api/admin/system-health        System metrics
GET    /api/admin/policies             List policies
PATCH  /api/admin/policies/:key        Update policy
```

---

## 18. Environment & Configuration

```bash
# .env.example — copy to .env and fill in

# Server
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cybersuite

# Redis
REDIS_URL=redis://:password@localhost:6379

# JWT Secrets — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=<64-byte-random-hex>
JWT_REFRESH_SECRET=<64-byte-random-hex>

# AWS S3 (or MinIO)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=cybersuite-files

# Email (Resend)
RESEND_API_KEY=

# 2FA
TOTP_APP_NAME=CyberSuite

# Encryption
ENCRYPTION_MASTER_KEY=<32-byte-random-hex>   # For server-side symmetric encryption only

# Feature Flags
ENABLE_CHAT=true
ENABLE_MEDICAL=true
ENABLE_CONSULTATION=true
```

---

## Final Notes from the Architect

**What separates this from a student project:**
Every security decision has a reason. The vault is zero-knowledge — not because it sounds cool, but because if your database is breached, users lose nothing. Rate limiting sits at three levels (Nginx, Express global, per-route) because a single layer can be misconfigured. Audit logs are append-only and include IP, device, and action — because when something goes wrong, you need to reconstruct exactly what happened.

**What to build first:**
Auth → Vault → Admin. These three modules force you to get encryption, RBAC, and audit logging right from day one. Every other module inherits from these foundations. Get them wrong and you'll rebuild everything.

**The most common mistake:**
Building features before the security layer. In CyberSuite, security is the product. The UI is just the delivery mechanism.













Continue the implementation plan. First, check for all errors and fix them. Then identify what should be implemented next, what is missing, and what is not fully implemented. Present everything clearly and professionally