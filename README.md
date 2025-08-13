# 🛒 Grocery Store – Full-Stack E‑Commerce Demo

[![Live on Vercel](https://img.shields.io/badge/Live-Vercel-000?logo=vercel)](https://grocery-store-ckfe.vercel.app/)
[![CI](https://img.shields.io/github/actions/workflow/status/Hikko218/Notes-Web-App/backend-test.yml?label=Build&logo=githubactions)](https://github.com/Hikko218/Grocery-Store/actions)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/heiko-ries-b35778374)

A modern, **end‑to‑end** TypeScript shop with **Next.js**, **NestJS**, **Prisma** and **PostgreSQL**.  
Includes **role‑based authentication**, an **admin dashboard**, robust **checkout flow** with cart persistence, and a clean, typed API.

---

## 🖼️ Preview

![Screenshot](./Frontend/public/Grocery_Store_Titel_Picture.png)

**Gallery:**
| Product List | Cart | Profile | Admin Dashboard |
|--------------|------|---------|-----------------|
| ![Products](./Frontend/public/Grocery_Store_Products.png) | ![Cart](./Frontend/public/Grocery_Store_Cart.png) | ![Profile](./Frontend/public/Grocery_Store_Profile.png) | ![Admin](./Frontend/public/Grocery_Store_Admin.png) |

---

## 🛠️ Tech Stack & Tools

![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-38BDF8?logo=tailwindcss)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-4169E1?logo=postgresql)
![JWT](https://img.shields.io/badge/Auth-JWT-000000)

---

## 🚀 Features

### Authentication & Roles
- **Register / Login** with **httpOnly cookies**; role‑aware UI for `user` and `admin`.  
- **Profile management** (first/last name, phone, email, password) via secure endpoints.  
- **Auto‑login after registration** for a seamless checkout.

### Cart & Checkout
- **Client cart** with persistence (**localStorage**) and safe re‑hydration on reload.  
- **Login redirect** when trying to checkout unauthenticated.  
- **Payment failure/cancel**: cart stays intact and is automatically restored; **payment success** clears cart only after confirmed success.

### Products
- Product list with **search** (`searchTerm`), **sort** (name/price), **filters** (category, optional brand), and **pagination** (`take/skip`).  
- **Admin CRUD**: create, edit, delete products with fields: `productId, name, price, category, brand, imageUrl, description`.  
- All **mutating routes** are **guarded** (admin‑only).

### Orders
- Orders are **linked to the user**.  
- Admin can find a user by **ID or email** and **include orders** in a single request (`?include=orders`, incl. items + product details).  
- **Order management**: update status, delete orders.

### Backend
- **NestJS** with **Guards (JWT)**, DTOs and **Prisma**.  
- Type‑safe mappings (e.g., **`Prisma.Decimal` → `number`**).  
- Optional **case‑insensitive product search** via ENV (`INSENSITIVE_SEARCH=true`).

### Frontend / UX
- **Next.js App Router** with client views, header/footer layouts and **admin tables**.  
- Placeholder links (FAQ/Support) route safely to `/` for demo purposes.  
- Strict TypeScript/ESLint config (no `any`, stable hooks).

---

## 🗺️ Architecture Diagram

```plaintext
[Frontend: Next.js/Vercel] --> [Backend: NestJS on Render] --> [Database: RDS PostgreSQL]
```

---

## 📦 Local Setup

### 1) Clone & install
```bash
git clone https://github.com/Hikko218/Grocery-Store.git
cd grocery-store

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..
```

### 2) Environment

**Frontend (`/frontend/.env`)**
```ini
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_IMAGE_URL=http://localhost:3000
```

**Backend (`/backend/.env`)**
```ini
DATABASE_URL=postgresql://user:pass@localhost:5432/grocery
JWT_SECRET=please-change-me
```

> Adjust DB credentials to your local setup; ensure PostgreSQL is running.

### 3) Prisma (backend)
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 4) Start dev servers
```bash
# frontend
cd frontend
npm run dev

# backend
cd backend
npm run start:dev
```

---

## ✅ Manual Test Plan
- **Auth**: register → auto‑login → protected routes accessible; logout → protected routes blocked.
- **Cart/Checkout**: add items → reload page → cart intact; simulate failure/cancel → cart restored; success → cart cleared.
- **Admin**: CRUD products, search/sort/filter; find user by email/ID with `?include=orders`; update order status.

## ✅ Jest Test Plan
- **Backend**: Run `npm run test:ci` testing with SQLite


---

## 🔗 Links

- [Live Application](https://grocery-store-ckfe.vercel.app/)
- [GitHub Repository](https://github.com/Hikko218/Grocery-Store)
- [Project Board](https://github.com/Hikko218/Grocery-Store/projects)






