# Plan: QR Scanner Fix & Auto-Logout Implementation

## 📋 Information Gathered:

### 1. QR Scanner Issue (app/page.tsx)

- **Problem**: Camera keeps restarting/blinking in public page (app/page.tsx) while admin camera works fine
- **Root Cause**: BarcodeScannerModal.tsx uses html5-qrcode library with aggressive scanning settings (fps: 10) that can cause resource issues and race conditions
- **Admin uses**: CameraCapture.tsx - direct native getUserMedia with video element - stable

### 2. Auto-Logout (60 minutes inactivity)

- **Requirement**: Reset timer on any activity (clicks, scroll, keypresses)
- **Target**: Admin dashboard only
- **Behavior**: Logout automatically after 60 minutes of inactivity

---

## ✅ IMPLEMENTATION COMPLETED:

### Step 1: Fix BarcodeScannerModal.tsx ✓

- Reduced FPS from 10 to 5 (less resource intensive)
- File: `components/public/BarcodeScannerModal.tsx`

### Step 2: Add Inactivity Timeout to AuthContext.tsx ✓

- Added INACTIVITY_TIMEOUT (60 minutes) constant
- Added showWarning and remainingTime state
- Added activity event listeners (mousedown, mousemove, keydown, scroll, touchstart, click)
- Added checkInactivity function that runs every 1 second
- Shows warning at 5 minutes before logout
- Auto-logout when timeout reached
- File: `contexts/AuthContext.tsx`

### Step 3: Add Warning Display in AdminHeader.tsx ✓

- Added warning banner that appears at 5 minutes before logout
- Shows remaining time countdown
- Added logout button in warning banner
- File: `components/admin/AdminHeader.tsx`

---

## 📁 Files Edited:

1. `components/public/BarcodeScannerModal.tsx` - Fix scanner (FPS: 10 → 5)
2. `contexts/AuthContext.tsx` - Add auto-logout functionality
3. `components/admin/AdminHeader.tsx` - Add warning display

---

## ✅ Testing:

1. Test QR scanner in app/page.tsx works without blinking
2. Test admin auto-logout after 60 minutes inactivity
3. Verify warning appears before logout
