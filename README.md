# IDIT - Intex Digitales Lagerverwaltungstool 🏭

A warehouse inventory tracking tool for Intex. Employees walk the floor, record pallet counts at storage locations, and save point-in-time snapshots.

## Getting Started

First, ensure you're in the `idit` directory:

```powershell
cd "c:\Users\pauls\OneDrive\Projekte\IntexSystemPrototype\idit"
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Tech Stack

- **Next.js** 16 with App Router
- **Prisma** 5 with SQLite database
- **Tailwind CSS** v4 (CSS variables for theming)
- **TypeScript** 5
- **PIN-based Authentication** (custom implementation)

## Project Setup

### Database

```powershell
# Generate Prisma client
npx prisma generate

# Create/run migrations
npx prisma migrate dev

# Seed database with test data
npx prisma db seed

# Open database GUI
npx prisma studio
```

### Build & Deploy

```powershell
npm run build
npm run start
```

## UI Language

All user-facing text is in **German**:
- Lagerbestand (inventory)
- Lagerplatz (storage location)
- Palette (pallet)
- Produkt (product)
- Lagerkonfiguration (settings)
- Übersicht (dashboard)

## Project Structure

```
src/
├── app/               # Next.js App Router pages
│   ├── (auth)/       # Login/authentication
│   ├── (dashboard)/  # Main application pages
│   └── api/          # API routes
├── components/        # React components
│   ├── auth/         # Authentication components
│   ├── features/     # Feature-specific components
│   ├── layout/       # Layout components
│   └── ui/           # Reusable UI components
├── lib/              # Utilities and helpers
├── types/            # TypeScript type definitions
prisma/
├── schema.prisma     # Database schema
├── seed.ts           # Database seeding script
└── migrations/       # Database migrations
```
