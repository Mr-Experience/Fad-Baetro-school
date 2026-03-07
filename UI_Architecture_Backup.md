# Fad Maestro Academy - UI & Configuration Backup

This document serves as a permanent reference for the stable UI state and configurations as of March 7, 2026.

## 🚀 Deployment & Routing
- **Platform**: Netlify
- **Routing Fix**: A `_redirects` file exists in the `/public` directory to handle Single Page Application (SPA) routing.
  - Content: `/* /index.html 200`
  - This ensures direct URL access (e.g., refreshing `/portal/student`) does not result in a 404.

## 🎨 Branding & Logos (Static Assets)
The application has been migrated from dynamic logo fetching to **hardcoded static assets** for 100% stability.
- **Logo Asset**: `src/assets/logo.jpg`
- **Implementation**: Every header, footer, and login screen uses the `logoFallback` import directly.
- **Rationale**: Prevents broken images if database URLs are modified or invalid.

## 🏠 Homepage Layout
The homepage follows a clean, vertical narrative flow:
1. **Hero Section**
2. **Notice Banner**
3. **Admission Section**
4. **Welcome Section** (Full-width)
5. **Academics Section** (Full-width)
6. **News Section**
7. **School Portals** (Quick Access Cards)
8. **Testimonials**
9. **Inquiry Section** (Background image from Supabase)
10. **Footer** (With full portal links)

## 🔗 Portals & Navigation
Direct links are integrated into the **Footer** and the **School Portals** section:
- **Student**: `/portal/student`
- **Candidate**: `/portal/candidate`
- **Admin**: `/portal/admin/login`
- **Super Admin**: `/portal/superadmin`

## 📦 Technical Environment
- **React + Vite**
- **Supabase**: Used for data (Settings, Exams, News) but **not** for the primary logo.
- **Lucide-React**: Consistent iconography.

## 🗄️ Database Backup
A full database schema export (SQL) is maintained in the artifact: `full_database_setup.sql`.

---
*UI State locked and synchronized with GitHub.*
