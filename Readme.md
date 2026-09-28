# 🛒 One Shop POS & Inventory Management System

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-blue?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-5.2-green?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-blue?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.6-FF4500?logo=betterauth)](https://better-auth.com/)
[![pnpm](https://img.shields.io/badge/pnpm-11.1-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

---

## 🌐 Live Demo

> 🔗 **Live Link:** [https://shop-inventory-management-tf5j.onrender.com](https://shop-inventory-management-tf5j.onrender.com)

---

## 📖 Introduction

**One Shop POS** is a modern, high-performance Cloud Point of Sale (POS) and inventory management web application built for supermarkets, retail outlets, cafes, and specialty stores. 

It provides an intuitive interface for cashiers to quickly register transactions, track inventory levels, apply custom discounts, generate instant thermal PDF invoices, and isolate multi-tenant shop data seamlessly.

### 💡 Problem It Solves

- ⏱️ **Digitalized Cashier Checkout:** Eliminates long customer queues with a fast, keyboard-friendly checkout register and instant stock deduction.
- 📦 **Manual Stock Errors:** Prevents overselling by automatically decrementing product inventory upon sale completion and issuing low-stock alerts.
- 🏪 **Multi-Store Management:** Removes the hassle of running multiple separate software setups by allowing store owners to manage separate shop profiles from a single unified account.
- 🧾 **Cluttered Invoice Creation:** Provides crisp, instant printable PDF & thermal receipt generation right inside the browser.

---

## 🖼️ Application Preview

![POS Screenshot](Screenshot232339.png)

---

## ✨ Key Features

- 🏪 **Multi-Tenant Shop Isolation:** Effortlessly switch between multiple store profiles under one account with complete data isolation.
- 📦 **Real-Time Inventory Management:** Manage item categories, track stock thresholds, and receive low-stock alerts.
- ⚡ **Automated Stock Deduction:** Backend automatically decrements product quantities in real-time when an order is completed.
- 💳 **Fast Checkout Register:** Add line-items, apply custom percentage discount overrides, and compute line subtotals dynamically.
- 🧾 **Instant Receipt & PDF Invoicing:** Client-side thermal receipt modal and PDF generation using `@react-pdf/renderer`.
- 🌍 **Multi-Language (i18n):** Internationalization supported out of the box with `next-intl`.
- 🔒 **Secure Authentication:** User and shop level authentication powered by `Better-Auth` with social login support.
- 📋 **Sales History Ledger:** Search, filter, and inspect past sales transactions and void improper orders.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **UI & Logic:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Base UI](https://base-ui.com/)
- **State Management & Data Fetching:** [Zustand](https://github.com/pmndrs/zustand), [TanStack React Query v5](https://tanstack.com/query/latest)
- **Localization:** [next-intl](https://next-intl-docs.vercel.app/)
- **PDF & Invoice Rendering:** [@react-pdf/renderer](https://react-pdf.org/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend (`/server`)
- **Runtime:** Node.js (ES Modules with `tsx`)
- **Framework:** [Express.js 5](https://expressjs.com/)
- **Database ORM:** [Prisma ORM 7](https://www.prisma.io/) with `@prisma/adapter-pg`
- **Database:** PostgreSQL
- **Authentication:** [Better Auth 1.6](https://better-auth.com/)
- **Validation:** [Zod 4](https://zod.dev/)
- **Email Service:** [Nodemailer](https://nodemailer.com/) / [Resend](https://resend.com/)

---

## 🚀 Steps to Clone & Run Locally

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v20+ recommended)
- **pnpm** (`npm i -g pnpm`) or `npm` / `yarn`
- **PostgreSQL** database instance (local or hosted, e.g., Supabase / Neon / Render)

---

### 1. Clone the Repository

```bash
git clone https://github.com/iamvishalkr/shop-inventory-management.git
cd shop-inventory-management
```

---

### 2. Backend Setup (`/server`)

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the `server` directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Configure the environment variables inside `server/.env`:
   ```env
   PORT=4000
   CLIENT_URL="http://localhost:3000"
   BETTER_AUTH_URL="http://localhost:4000"
   DATABASE_URL="postgresql://user:password@localhost:5432/web_shop_db"
   BETTER_AUTH_SECRET="your-super-secret-key"
   ```

5. Push Prisma Schema to PostgreSQL:
   ```bash
   npx prisma db push
   ```

6. Start the Backend Development Server:
   ```bash
   pnpm dev
   ```
   *The backend will start running on `http://localhost:4000`.*

---

### 3. Frontend Setup (`/client`)

1. Open a new terminal tab and navigate to the client folder:
   ```bash
   cd client
   ```

2. Install frontend dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the `client` directory:
   ```env
   NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"
   ```

4. Start the Frontend Development Server:
   ```bash
   pnpm dev
   ```
   *The frontend application will start running on `http://localhost:3000`.*

---

## 📁 Repository Structure

```
shop-inventory-management-MERN/
├── client/                     # Next.js 16 Frontend
│   ├── app/[locale]/           # App router pages with i18n support
│   ├── components/             # Reusable Shadcn UI & custom components
│   ├── hooks/                  # Custom React hooks
│   ├── i18n/                   # Navigation & locale config
│   ├── messages/               # Localization translation JSON files
│   ├── store/                  # Zustand state stores
│   └── package.json
│
├── server/                     # Express.js Backend API
│   ├── src/                    # Controllers, routes, services & middleware
│   ├── prisma/                 # Database schema definitions & migrations
│   └── package.json
│
└── Readme.md                   # Project documentation
```

---

## 📌 Future Roadmap & TODOs

- [ ] 📊 **Interactive Analytics Charts:** Integrate `recharts` for daily, weekly, and monthly revenue trends and peak sales hour visualizers.
- [ ] 📈 **Business & Financial Reports:** Implement downloadable PDF/Excel reports for profit margin calculations, tax summaries, and inventory valuation audits.
- [ ] 📈 **AI Anaylysis:** An AI analysis of the business and reports.
- [ ] 📈 **Multi lang translate:** Complete Translate to other languages.
<!-- - [ ] 🏷️ **Hardware Barcode Scanner Support:** Native keyboard wedge event listener for high-speed barcode scanning directly into the cart. -->

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [Issues page](https://github.com/iamvishalkr/shop-inventory-management-MERN/issues).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is [ISC](https://opensource.org/licenses/ISC) licensed.
