# AI Agent Instructions for IDIT

## ⚠️ CRITICAL: Working Directory
The actual Next.js project is in the `idit` subfolder, NOT the workspace root.
**ALL terminal commands must be run from:**
```
c:\Users\pauls\OneDrive\Projekte\IntexSystemPrototype\idit
```

## ⚠️ CRITICAL: Dev Server
- Only ONE dev server should run at a time (port 3000)
- NEVER start a new terminal for the dev server
- To restart: `Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force; npm run dev`
- Always use background mode for dev server

## ⚠️ CRITICAL: Prisma Lock Issues (EPERM errors)

**If you see:** `EPERM: operation not permitted, rename '...\query_engine-windows.dll.node'`

**Solution - Run in PowerShell:**
```powershell
# Kill all node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Then rebuild
npm run build
```

**If that fails, do a full clean:**
```powershell
# Kill processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove Prisma client cache
Remove-Item -Recurse -Force node_modules\.prisma\client -ErrorAction SilentlyContinue

# Rebuild
npm run build
```

**Root cause:** Prisma query engine binary gets locked when:
- Multiple node processes access it simultaneously
- OneDrive/cloud sync interferes with file operations
- Previous build didn't clean up properly

## Project: IDIT - Intex Digitales Lagerverwaltungstool
A warehouse inventory tracking tool for Intex. Employees walk the floor, record pallet counts at storage locations, and save point-in-time snapshots.

## Tech Stack
| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 16.x | App Router |
| Prisma | 5.x | SQLite database |
| Better Auth | 1.4.x | Email/password auth |
| Tailwind CSS | 4.x | Uses CSS variables for theming |
| TypeScript | 5.x | Strict mode |

## UI Language: German 🇩🇪
All user-facing text MUST be in German:
- Dashboard → Übersicht
- Inventory → Lagerbestand
- Settings → Lagerkonfiguration
- Storage Location → Lagerplatz
- Pallet → Palette
- Product → Produkt
- Save → Speichern
- Delete → Löschen
- Add → Hinzufügen

## Key Directories
```
idit/
├── prisma/           # Database schema & migrations
├── src/
│   ├── app/          # Next.js App Router pages
│   │   ├── (auth)/   # Login/Register pages
│   │   ├── (dashboard)/ # Main app pages
│   │   └── api/      # API routes
│   ├── components/   # React components
│   │   ├── auth/     # Auth forms
│   │   ├── features/ # Feature components (inventory/)
│   │   ├── layout/   # Layout components
│   │   └── ui/       # Reusable UI components
│   ├── lib/          # Utilities (auth, prisma)
│   └── types/        # TypeScript types
```

## Database Models
- `User` - Authentication
- `StorageLocation` - Warehouse areas (UG, EG, OG, Halle 204, Halle 205)
- `ProductVariant` - Product types (Feuermaxx 3kg, Landi 2kg, Hellson 600g)
- `InventorySnapshot` - Point-in-time inventory captures
- `InventoryEntry` - Individual pallet counts per location/product

## Common Commands
```powershell
# Always cd first!
cd "c:\Users\pauls\OneDrive\Projekte\IntexSystemPrototype\idit"

npm run dev              # Start dev server (use background mode!)
npx prisma generate      # Regenerate Prisma client
npx prisma migrate dev   # Create new migration
npx prisma db seed       # Seed database with test data
npx prisma studio        # Open database GUI
```
