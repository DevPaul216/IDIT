# GitHub Copilot Instructions for IDIT

## Project Structure
This is a Next.js application located in the `idit` subfolder. The workspace root may open at the parent `IntexSystemPrototype` folder.

## Critical: Terminal Commands
**ALWAYS run terminal commands from the `idit` directory:**
```powershell
cd "c:\Users\pauls\OneDrive\Projekte\IntexSystemPrototype\idit"
```

## Dev Server Management
- There is typically ONE dev server running on port 3000
- **DO NOT** start multiple dev servers
- To restart the dev server, kill existing node processes first:
```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force; npm run dev
```
- Use `isBackground: true` when starting the dev server so it doesn't block

## Tech Stack
- Next.js 16 with App Router
- Prisma 5 with SQLite
- PIN-based Authentication (custom implementation)
- Tailwind CSS v4 (uses CSS variables for theming)
- TypeScript

## Language
All UI text must be in **German**. Use terms like:
- Lagerbestand (inventory)
- Paletten (pallets)
- Lagerplatz (storage location)
- Produkt (product)
- Snapshot (keep as-is)

## Database Commands
```powershell
npm run build          # Build project (includes prisma generate & migrations)
npx prisma generate    # After schema changes
npx prisma migrate dev # Create migrations
npx prisma db seed     # Seed test data
npx prisma studio     # Open database GUI
```
