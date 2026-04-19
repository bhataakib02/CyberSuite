# 🛡️ CyberSuite Architecture & Documentation

## 1. System Architecture Diagram (Textual)

```mermaid
graph TD
    subgraph Frontend [React/Next.js Client (Vercel/CDN)]
        A1[Global Dashboards] --> A[React Router / Next App Router]
        A2[Role-Based Dashboards] --> A
        A3[Emergency & Public Routes] --> A
        A --> B[Zustand State & E2EE Key Manager]
        B --> C[Socket.io Client (Real-time)]
        B --> D[REST API Client (Axios/Fetch)]
    end

    subgraph Security Layer
        E1[WAF / Cloudflare] --> E2[Rate Limiting & Brute-force Protection]
        E2 --> E3[JWT Auth & RBAC Middleware]
    end

    subgraph Backend [Node.js / Express API]
        F1[Auth Service]
        F2[User & Role Management]
        F3[Verification System]
        F4[E2EE Vault & Files]
        F5[WebSockets/Chat Hub]
        F6[Audit & Logging Service]
        F7[Admin Intelligence]
    end

    subgraph Database [PostgreSQL via Prisma]
        DB1[(Users, Roles & Profiles)]
        DB2[(Encrypted Vault & Files)]
        DB3[(Chats & Consultations)]
        DB4[(Audit Logs & Incidents)]
    end

    C <--> E1
    D <--> E1
    E3 --> F1
    E3 --> F2
    E3 --> F3
    E3 --> F4
    E3 --> F5
    E3 --> F6
    E3 --> F7
    
    F1 <--> DB1
    F2 <--> DB1
    F3 <--> DB1
    F4 <--> DB2
    F5 <--> DB3
    F6 <--> DB4
    F7 <--> DB1
    F7 <--> DB4
```

## 2. Database Schema (Prisma / PostgreSQL)
A production-ready database schema is implemented at `backend/prisma/schema.prisma`. It handles everything from Zero-Trust encrypted data (AES/RSA) to RBAC, activity logging, and professional verification logic. Key models include:
- `User` and `Session`: Manages JWT refresh tokens, multi-device syncing, and RBAC flags.
- `VaultEntry`, `MedicalRecord`, `Message`: Stores End-to-End Encrypted payloads where the backend only sees ciphertext.
- `ProfessionalProfile`: Drives the multi-stage verification system for Lawyers, Doctors, etc.
- `ActivityLog`: Immutable system-wide audit trailing.

## 3. Backend API Structure (Node.js)
```text
backend/src/
├── index.ts                 # Entry point, Rate Limiting, Security Headers
├── middleware/
│   ├── auth.ts              # JWT verification and Role-Based Access Control
│   └── error.ts             # Global error handling
├── modules/
│   ├── auth/                # Login, Registration, 2FA, Session Management
│   ├── admin/               # System Health, Threat Logs, Verification Approval
│   ├── chat/                # E2EE Message Delivery, Sockets
│   ├── vault/               # AES Encrypted Password/Data Management
│   ├── files/               # Secure document handling (Zero-Knowledge)
│   ├── medical/             # Granular access control for Healthcare
│   ├── consultations/       # Secure Video/Chat for Professionals
│   └── ...
└── prisma/                  # ORM Models and Migrations
```

## 4. Frontend Structure (React / Next.js)
```text
frontend/app/
├── (auth)/                  # Login, Register, Recovery
├── (dashboard)/             # Protected Application Area
│   ├── layout.tsx           # Global Sidebar, Topbar, WebSocket init
│   ├── dashboard/           # Default User Security Overview
│   ├── admin/               # Intelligence Center for Admins
│   ├── lawyer/              # Legal Practice Hub
│   ├── academic/            # Academic Research Hub
│   ├── medical/             # Clinical Access / Health Vault
│   ├── student/             # Student Safety Toolkit
│   ├── emergency/           # Emergency ID Manager
│   └── ...
├── emergency/               # Public-facing Emergency Profile (QR scans)
├── components/              # Reusable UI (Buttons, Modals, Loaders)
├── store/                   # Zustand (Auth, E2EE Keys)
└── lib/                     # API wrappers, Socket.io client, E2EE Utils
```

## 5. Key Code Examples

### A. RBAC Middleware (`backend/src/middleware/auth.ts`)
```typescript
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

// Usage:
router.post('/verify-professional/:id', authenticate, requireRole('ADMIN'), verifyHandler);
```

### B. Dashboard Routing (`frontend/app/(dashboard)/layout.tsx`)
```tsx
const navigation = [
  { name: 'Secure Vault', href: '/vault', roles: ['USER', 'DOCTOR', 'LAWYER', 'STUDENT'] },
  { name: 'Case Manager', href: '/lawyer', roles: ['LAWYER'] },
  { name: 'Admin Intel', href: '/admin', roles: ['ADMIN'] },
].filter(item => item.roles.includes(user?.role || 'USER'));
```

### C. Verification System (`backend/src/modules/admin/admin.routes.ts`)
```typescript
router.post('/verify-professional/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { status } = req.body; // 'APPROVE' or 'REJECT'
  
  // 1. Update Professional Profile Status
  await prisma.professionalProfile.update({
    where: { id: req.params.id },
    data: { status: status === 'APPROVE' ? 'VERIFIED' : 'REJECTED' }
  });

  // 2. Grant system role capabilities if approved
  if (status === 'APPROVE') {
    await prisma.user.update({ where: { id: profile.userId }, data: { isVerified: true } });
  }

  // 3. Immutable System Audit Log
  await prisma.activityLog.create({
    data: { userId: req.user.userId, action: 'ADMIN_PROFESSIONAL_VERIFY', details: status }
  });
});
```
