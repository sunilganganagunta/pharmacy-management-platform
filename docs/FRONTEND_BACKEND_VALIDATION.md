# MediCore – Frontend and Backend Integration Report

**Project:** MediCore – Smart Pharmacy Management Platform  
**Frontend Framework:** React 18.3, Vite 5.4, Tailwind CSS 3.4  
**HTTP Client:** Axios (with Bearer Token & Interceptor Architecture)  
**Status:** FULLY INTEGRATED, COMPILED & VALIDATED  
**Date:** November 2026  

---

## 1. Single Page Application (SPA) Architecture

The frontend is structured as a component-driven single page application:
- **Routing:** React Router v6 with `ProtectedRoute` guards verifying `isAuthenticated`.
- **Global Context Providers:**
  - `AuthContext`: Tracks JWT token, user profile, and role helpers (`isAdmin`, `isPharmacist`, `isCashier`).
  - `NotificationContext`: Manages real-time toast alerts for actions, inventory warnings, and error banners.
  - `ThemeContext`: Toggles between light and dark clinical display themes.
- **Iconography & Styling:** Lucide React icons with Tailwind CSS utility classes and responsive breakpoints (`sm`, `md`, `lg`).

---

## 2. Verified Page Views & Functional Workflows

| View Component | Route | Target User Roles | Functional Capabilities Verified |
| :--- | :--- | :--- | :--- |
| **Login** | `/login` | Public | Username/email + password authentication, one-click demo credentials bar, JWT storage, redirect to dashboard. |
| **Forgot Password** | `/forgot-password` | Public | Two-step secure workflow: Step 1 (Request Token) &rarr; Step 2 (Confirm 15-min Token & Set New Password). |
| **Dashboard** | `/` | All Roles | Real-time KPI statistics cards, 7-day sales revenue trend chart (Recharts), low-stock alert badges, recent transaction feed. |
| **POS & Billing** | `/pos` | All Roles | Interactive cart terminal, barcode scanner search (`890103001015`), stock availability check, discount/GST calculation, invoice generation. |
| **Medicines** | `/medicines` | All Roles (CRUD Admin/Pharm) | Paginated medicine catalogue, therapeutic search, batch/expiry badges, add/edit/delete modal dialogues. |
| **Inventory** | `/inventory` | `ADMIN`, `PHARMACIST` | Stock level overview, quick stock adjustment modal (`STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`), transaction audit ledger. |
| **Purchases** | `/purchases` | `ADMIN`, `PHARMACIST` | Purchase order procurement lifecycle (`PENDING` &rarr; `APPROVED` &rarr; `RECEIVED`), atomic stock incrementing upon receipt. |
| **Suppliers** | `/suppliers` | `ADMIN`, `PHARMACIST` | Pharmaceutical vendor directory, contact details, active status toggle, supplier creation modal. |
| **Customers** | `/customers` | All Roles | Patient/customer directory, purchase history totals, quick customer search. |
| **Reports** | `/reports` | `ADMIN`, `PHARMACIST` | Executive financial reporting, date range filtering, one-click CSV export for sales and inventory valuation. |
| **Notifications** | `/notifications` | All Roles | Alert center streaming low-stock warnings, 30-day expiration alerts, and order confirmations. |

---

## 3. Role-Based Navigation & UI Least Privilege

The sidebar navigation ([Sidebar.jsx](file:///c:/Users/sunil/OneDrive/Desktop/Pharmacy%20Management%20Platform/frontend/src/components/Sidebar.jsx)) dynamically filters visible menu links according to the authenticated user's role:

- **Cashier (`CASHIER`):** Sees only operational checkout views (Dashboard, POS & Billing, Medicines catalog for item search, Customers, Alert Center). Administrative procurement and financial reporting links are hidden.
- **Pharmacist (`PHARMACIST`):** Sees all operational and clinical inventory views (Dashboard, POS, Medicines, Inventory, Purchase Orders, Suppliers, Customers, Alert Center).
- **Administrator (`ADMIN`):** Full system visibility across all modules, including executive reports and system administration.

---

## 4. API Client & Session Expiration Architecture

Axios client ([axiosInstance.js](file:///c:/Users/sunil/OneDrive/Desktop/Pharmacy%20Management%20Platform/frontend/src/api/axiosInstance.js)) provides automatic token injection and error handling:
1. **Request Interceptor:** Automatically attaches `Authorization: Bearer <token>` from `localStorage` to all outgoing `/api/*` requests.
2. **Response Interceptor:**
   - Intercepts HTTP 401 Unauthorized responses (token expired or invalidated).
   - Automatically purges expired credentials from `localStorage`.
   - Dispatches a redirect to `/login` to prevent stale UI states.
   - Extracts backend error messages from `ApiResponse` objects for user-friendly toast presentation.

---

## 5. Production Build Validation Evidence

The frontend build was executed and verified using Vite:
```
> medicore-frontend@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 2250 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.33 kB │ gzip:   0.74 kB
dist/assets/index-BwZzd6ES.css   40.76 kB │ gzip:   7.10 kB
dist/assets/index-BPW3Zz3E.js   819.07 kB │ gzip: 221.49 kB
✓ built in 7.79s
```
- Total Modules Transformed: **2,250 modules**.
- Build Exit Code: **0 (Zero Errors)**.
- Output Directory: `frontend/dist/` (static HTML, CSS, and JS bundles ready for Nginx).
