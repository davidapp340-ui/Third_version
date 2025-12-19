# How to Debug Progress Page Issue

## Problem
Progress page shows: **"You have not started a training course yet"**

## Quick Solution (3 Steps)

### Step 1: Add Diagnostic Button (Temporary)

Open `app/(tabs)/progress.tsx` and add the diagnostic button:

```tsx
import { ProgressDiagnosticButton } from '@/components/ProgressDiagnosticButton';

export default function ProgressScreen() {
  // ... existing code ...

  return (
    <View style={styles.container}>
      {/* ... existing JSX ... */}

      {/* ADD THIS - Temporary diagnostic button */}
      {__DEV__ && <ProgressDiagnosticButton />}
    </View>
  );
}
```

### Step 2: Run Diagnostics

1. Open your app
2. Navigate to Progress tab
3. **Tap the red "Diagnose" button** (bottom right)
4. Wait for results

### Step 3: Auto-Fix

If diagnostics show **"No active track progress"**:
1. Tap **"Auto-Fix Issue"** button
2. Wait for confirmation
3. **Refresh the app** (Cmd+R or Ctrl+R)
4. Progress page should now show the 30-day path!

---

## Manual Debugging (If Auto-Fix Doesn't Work)

### Option A: Run in Browser Console (Web)

```typescript
// Copy-paste into browser console
import { diagnoseProgressIssue, autoFixProgressIssue } from '@/lib/diagnostics/progressDiagnostics';

// Run diagnostics
await diagnoseProgressIssue();

// Auto-fix if possible
await autoFixProgressIssue();
```

### Option B: Check Database Directly

1. Open Supabase Dashboard → SQL Editor
2. Run this query:

```sql
-- Check if child has track progress
SELECT
  c.id as child_id,
  c.name as child_name,
  utp.id as progress_id,
  utp.current_day,
  utp.days_completed,
  tt.name_he as track_name
FROM children c
LEFT JOIN user_track_progress utp ON utp.child_id = c.id AND utp.completed_at IS NULL
LEFT JOIN training_tracks tt ON tt.id = utp.track_id
WHERE c.user_id = auth.uid()
LIMIT 1;
```

**Expected result:**
- If `progress_id` is **NULL** → Child has no track started (main issue)
- If `track_name` is **NULL** → Track doesn't exist

### Option C: Manually Start Track (SQL)

If diagnostics confirm "no track progress", run this SQL:

```sql
-- Start track for child
INSERT INTO user_track_progress (child_id, track_id, current_day, days_completed)
SELECT
  c.id,
  (SELECT id FROM training_tracks WHERE is_active = true ORDER BY display_order LIMIT 1),
  1,
  ARRAY[]::integer[]
FROM children c
WHERE c.user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM user_track_progress WHERE child_id = c.id AND completed_at IS NULL
  );
```

Then refresh your app.

---

## Understanding the Diagnostics

### ✅ Green Checkmark = Passed
Everything is working correctly

### ❌ Red X = Failed
This is causing the issue

### Common Results:

#### Result 1: "No active track progress found"
**Meaning:** Child exists but hasn't started any training track

**Fix:** Click "Auto-Fix Issue" or manually start track

**Why it happens:**
- Child was created but track wasn't auto-started
- Track was completed but new one not started
- Data was deleted/corrupted

---

#### Result 2: "No child account found"
**Meaning:** Logged-in user doesn't have a child account

**Fix:**
1. Log out
2. Create a child account (as parent)
3. Log in with child's code

**Why it happens:**
- Wrong account type
- Child not created yet
- User ID mismatch

---

#### Result 3: "Track has no days configured"
**Meaning:** Training track exists but has no 30 days

**Fix:** Contact admin to configure track_days table

**Why it happens:**
- Track not fully set up
- Data migration incomplete

---

#### Result 4: "Parent accounts cannot access"
**Meaning:** You're logged in as a parent

**Fix:** Log in with child account instead

**Why it happens:**
- Progress page is child-only by design
- Parents view children's progress differently

---

## Prevention: Auto-Start Track on Child Creation

To prevent this issue in the future, modify `lib/familyService.ts`:

```tsx
export async function addChild(familyId: string, childData: AddChildData) {
  // ... existing child creation code ...

  const child = childRecord as Child;

  // ... edge function call ...

  // ADD THIS: Auto-start first track
  try {
    const tracks = await getActiveTrainingTracks();
    if (tracks.length > 0) {
      await startTrack(child.id, tracks[0].id);
      console.log('✅ Auto-started track for child:', child.name);
    }
  } catch (error) {
    console.warn('⚠️ Could not auto-start track:', error);
  }

  return child;
}
```

Now all new children will automatically have a track started!

---

## Testing Your Fix

After applying fix:

1. **Refresh app** (Cmd+R or Ctrl+R)
2. Navigate to Progress tab
3. You should see:
   - 30-day winding path
   - Current day highlighted
   - Completed days with checkmarks
   - Locked future days

4. **Test interaction:**
   - Tap current day → Modal opens
   - See personalized greeting
   - See exercise cards
   - Horizontal scroll works

---

## Still Not Working?

Run through this checklist:

- [ ] Child account exists (`children` table)
- [ ] Child has `user_id` populated
- [ ] At least one active track exists (`training_tracks`)
- [ ] Track has 30 days (`track_days`)
- [ ] User track progress exists (`user_track_progress`)
- [ ] User is authenticated as child (not parent)
- [ ] No JavaScript errors in console
- [ ] App restarted after database changes
- [ ] Supabase connection working

If all checked and still broken:

1. Check `DEBUG_PROGRESS_ISSUE.md` for detailed steps
2. Review RLS policies in Supabase
3. Enable debug logging in code
4. Check network tab for failed API calls

---

## Quick Reference: Diagnostic Functions

```typescript
// In your code
import {
  diagnoseProgressIssue,
  autoFixProgressIssue,
  runProgressDiagnosticsUI
} from '@/lib/diagnostics/progressDiagnostics';

// Run full diagnostics (console output)
const results = await diagnoseProgressIssue();

// Auto-fix if possible
const fixResult = await autoFixProgressIssue();

// UI-friendly version
const uiResults = await runProgressDiagnosticsUI();
```

---

## Files Reference

- **Full Debug Guide**: `DEBUG_PROGRESS_ISSUE.md`
- **Diagnostic Script**: `lib/diagnostics/progressDiagnostics.ts`
- **Diagnostic UI**: `components/ProgressDiagnosticButton.tsx`
- **This Guide**: `HOW_TO_DEBUG_PROGRESS.md`

---

## Summary

**90% of cases:** Child has no active track progress

**Quick fix:**
1. Add diagnostic button to Progress page
2. Tap "Diagnose"
3. Tap "Auto-Fix Issue"
4. Refresh app

**Done!** 🎉
