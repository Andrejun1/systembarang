# Refactor Reminder H-2: Guide & Verification

## Status ✅
Refactoring completed successfully. No TypeScript errors.

## What Changed

### File Modified
- `app/api/reminder/route.ts`

### Core Changes

#### 1. **New Timezone Utility Functions** (Lines 75-120)

**`formatDateInJakarta(date: Date): string`**
- Converts any JavaScript Date to YYYY-MM-DD format in Asia/Jakarta timezone
- Ignores time component, focuses only on date
- Used to get "today" and calculate H-2 date

Example:
```typescript
formatDateInJakarta(new Date("2026-05-14T10:30:00Z"))
// Returns: "2026-05-14" (in Jakarta timezone)
```

**`getDateRangeInUTC(dateStr: string): { start: string; end: string }`**
- Converts YYYY-MM-DD (in Jakarta context) to UTC timestamp range
- Creates boundaries: [00:00:00+07:00 to 23:59:59+07:00] (Jakarta time)
- Returns ISO strings in UTC for database queries
- Handles timezone offset conversion automatically

Example:
```typescript
getDateRangeInUTC("2026-05-20")
// Returns:
// {
//   start: "2026-05-19T17:00:00.000Z",  // 2026-05-20 00:00 Jakarta in UTC
//   end:   "2026-05-20T16:59:59.000Z"   // 2026-05-20 23:59 Jakarta in UTC
// }
```

#### 2. **H-2 Query Refactor** (Lines 289-361)

**Logic Change:**
```
BEFORE: Exact 48-hour window from "now - 48 hours" to "now"
        Problem: Misses records due to 23:59 deadline time

AFTER:  DATE(deadline) = TODAY + 2 DAYS (in Asia/Jakarta timezone)
        Benefit: Stable, day-based, no timezone/time-of-day issues
```

**Implementation:**
```typescript
const todayJakarta = formatDateInJakarta(now);                        // e.g., "2026-05-14"
const h2Date = formatDateInJakarta(new Date(now.getTime() + 2*24*60*60*1000)); // e.g., "2026-05-16"
const h2Range = getDateRangeInUTC(h2Date);                            // UTC boundaries

// Query: Find all loans where deadline falls on H-2 date
.gte("deadline", h2Range.start)
.lte("deadline", h2Range.end)
```

#### 3. **Deadline Query Refactor** (Lines 407-459)

**Logic Change:**
```
BEFORE: Local datetime range (problematic with UTC database)
        Problem: Timezone misalignment between client datetime and UTC storage

AFTER:  DATE(deadline) = TODAY (in Asia/Jakarta timezone)
        Benefit: Explicit timezone handling, UTC-safe
```

**Implementation:**
```typescript
const todayJakarta = formatDateInJakarta(now);              // e.g., "2026-05-14"
const todayRange = getDateRangeInUTC(todayJakarta);         // UTC boundaries

// Query: Find all loans where deadline is today (Jakarta timezone)
.gte("deadline", todayRange.start)
.lte("deadline", todayRange.end)
```

## Example Scenarios

### Scenario 1: H-2 Reminder (Before vs After)

**Setup:**
- Current time: 14 May 2026 10:00 AM UTC / 14 May 2026 5:00 PM WIB
- Deadline: 16 May 2026 23:59:59 WIB

**Before Refactor:**
```
h2Start = now - 48 hours = 12 May 10:00 UTC
h2End = now + 1 min = 14 May 10:01 UTC

Query: deadline BETWEEN "2026-05-12T10:00:00Z" AND "2026-05-14T10:01:00Z"
Result: ❌ MISS - 16 May deadline is OUTSIDE this range
```

**After Refactor:**
```
todayJakarta = "2026-05-14"
h2Date = "2026-05-16"
h2Range.start = "2026-05-15T17:00:00Z" (16 May 00:00 Jakarta in UTC)
h2Range.end = "2026-05-16T16:59:59Z"   (16 May 23:59 Jakarta in UTC)

Query: deadline BETWEEN "2026-05-15T17:00:00Z" AND "2026-05-16T16:59:59Z"
Result: ✅ HIT - 16 May 23:59 WIB deadline IS within this range
```

### Scenario 2: Deadline Reminder

**Setup:**
- Current time: 16 May 2026 10:00 AM UTC / 16 May 2026 5:00 PM WIB
- Deadline: 16 May 2026 23:59:59 WIB

**After Refactor:**
```
todayJakarta = "2026-05-16"
todayRange.start = "2026-05-15T17:00:00Z" (16 May 00:00 Jakarta in UTC)
todayRange.end = "2026-05-16T16:59:59Z"   (16 May 23:59 Jakarta in UTC)

Query: deadline BETWEEN "2026-05-15T17:00:00Z" AND "2026-05-16T16:59:59Z"
Result: ✅ HIT - 16 May 23:59 WIB deadline is today (Jakarta timezone)
```

## Critical Implementation Details

### 1. Timezone Offset in String Creation
```typescript
// CORRECT: Creates timestamp in +07:00 timezone
const start = new Date(`2026-05-20T00:00:00+07:00`);

// WRONG: Assumes UTC, gets wrong time
const start = new Date(`2026-05-20T00:00:00`);
```

### 2. toISOString() Automatic Conversion
```typescript
// JavaScript Date.toISOString() automatically converts to UTC
const d = new Date("2026-05-20T00:00:00+07:00");
d.toISOString()  // "2026-05-19T17:00:00.000Z" ✅ Correct
```

### 3. Email Null Check
- Removed `.is("email", null, { not: true })` (not supported by Supabase client)
- Email null check still happens in the loop:
```typescript
if (!loan.email || typeof loan.email !== "string") {
  skippedH2.push({ id: loan.id, reason: "Email tidak tersedia" });
  continue;
}
```

## Testing Checklist

- [ ] **Deploy to staging first** - Not directly to production
- [ ] **Check Vercel logs** - Look for `[H-2]` and `[DEADLINE]` console logs
- [ ] **Verify dates in logs** - Should show Jakarta timezone dates
- [ ] **Test with upcoming H-2 date** - Manually trigger or wait for cron
- [ ] **Check email deliverability** - Verify emails are sent
- [ ] **Database records updated** - reminder_h2_sent_at and reminder_deadline_sent_at populated
- [ ] **No duplicate emails** - NULL checks prevent resending
- [ ] **Response format unchanged** - JSON structure same as before

## Rollback Plan

If issues occur:
1. Git checkout previous version of `app/api/reminder/route.ts`
2. Redeploy to Vercel
3. No database changes needed (only query logic changed)

## Key Improvements

✅ **Timezone-Safe**: Explicit Asia/Jakarta timezone handling  
✅ **Stable**: Date-based instead of exact timestamp  
✅ **Debuggable**: Console logs show calculated dates  
✅ **Production-Ready**: No breaking changes to response format  
✅ **Backward Compatible**: Works with existing database schema  
✅ **No Duplicates**: Email NOT NULL and reminder_sent_at checks intact  

## Files Changed
- ✅ `app/api/reminder/route.ts` - Query logic refactored

## Files NOT Changed
- ✅ `DATABASE_STRUCTURE.sql` - No schema changes needed
- ✅ Database - Only query logic changed, no migrations required
- ✅ Response format - Still returns same JSON structure
- ✅ Email content - HTML and text templates unchanged

## Next Steps

1. Review the changes in your IDE
2. Test in staging environment with Vercel preview
3. Check logs for `[H-2]` and `[DEADLINE]` console output
4. Deploy to production when confident
5. Monitor Vercel logs for first live execution
