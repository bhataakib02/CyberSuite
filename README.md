# 🛡️ CyberSuite

**CyberSuite** is a multi-role, security-first enterprise platform featuring Zero-Trust Architecture, End-to-End Encryption (E2EE), and a highly scalable microservice-ready backend. 

## Features

- **Multi-Role RBAC**: Distinct, customized dashboard environments for standard Users, Students, Academics, Doctors, Lawyers, Healthcare Staff, and Admins.
- **Enterprise-Grade Security**: Full E2EE implementation for sensitive data including medical records, legal cases, and encrypted chat channels. 
- **Immutable Audit Trails**: A sophisticated Admin Intelligence Center that logs all system-wide actions for compliance and threat analysis.
- **Zero-Knowledge Architecture**: The server acts as a blind relay for encrypted payloads (vault items, files, messages). Decryption only occurs client-side using user-specific private keys.
- **Modern Tech Stack**: 
  - Frontend: React / Next.js with Tailwind CSS, Zustand, Framer Motion, and Lucide React.
  - Backend: Node.js, Express, Socket.io, Prisma ORM, and PostgreSQL.

## Architecture

For a comprehensive overview of the system architecture, database schema, and directory layout, please see the [ARCHITECTURE.md](./ARCHITECTURE.md) document.

## Getting Started

1. Clone the repository and install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. Configure environment variables in `backend/.env` and `frontend/.env.local`.

3. Run database migrations:
   ```bash
   cd backend && npx prisma migrate dev
   ```

4. Start the development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

## License

Copyright © 2026. All Rights Reserved.
