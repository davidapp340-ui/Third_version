# Debug Guide: "No Training Course" Message

## Issue: Progress page shows "You have not started a training course yet"

---

## Step 1: Check Database Records

### 1.1 Verify Child Account Exists

Run this query in Supabase SQL Editor:

```sql
-- Check if child exists and has correct data
SELECT
  id,
  name,
  family_id,
  user_id,
  is_linked,
  created_at
FROM children
WHERE user_id = 'YOUR_USER_ID_HERE';
-- Replace YOUR_USER_ID_HERE with the logged-in user's ID
```

**Expected result:**
- Should return 1 row with child data
- `user_id` should NOT be null
- `is_linked` should be true

**If no rows:** Child account doesn't exist → Create child first
**If user_id is null:** Child not properly linked → Run edge function to create auth account

---

### 1.2 Check User Track Progress

```sql
-- Check if child has an active track
SELECT
  id,
  child_id,
  track_id,
  current_day,
  days_completed,
  started_at,
  last_activity_at,
  completed_at
FROM user_track_progress
WHERE child_id = 'YOUR_CHILD_ID_HERE'
  AND completed_at IS NULL;
-- Replace YOUR_CHILD_ID_HERE with the child's ID from step 1.1
```

**Expected result:**
- Should return 1 row (the active track)
- `completed_at` should be NULL
- `current_day` should be between 1-30
- `days_completed` should be an array

**If no rows:** ❌ **THIS IS YOUR ISSUE** → Track was never started
**If multiple rows:** Multiple active tracks (data integrity issue)

---

### 1.3 Verify Training Track Exists

```sql
-- Check if track exists and is active
SELECT
  id,
  name,
  name_he,
  total_days,
  is_active,
  created_at
FROM training_tracks
WHERE is_active = true;
```

**Expected result:**
- Should return at least 1 active track
- `is_active` should be true
- `total_days` should be 30

**If no rows:** No tracks in system → Create a track first

---

### 1.4 Check Track Days

```sql
-- Verify track has 30 days configured
SELECT
  track_id,
  COUNT(*) as day_count
FROM track_days
WHERE track_id = 'YOUR_TRACK_ID_HERE'
GROUP BY track_id;
-- Replace YOUR_TRACK_ID_HERE with track ID from step 1.3
```

**Expected result:**
- `day_count` should be 30

**If less than 30:** Track not fully configured → Add missing days

---

## Step 2: Check Application Code

### 2.1 Add Debug Logging

Add this to `app/(tabs)/progress.tsx` in the `loadData()` function:

```tsx
const loadData = async () => {
  try {
    const user = await getCurrentUser();
    console.log('🔍 [Progress Debug] User:', user?.id, user?.user_metadata?.user_type);

    if (!user) {
      console.log('❌ [Progress Debug] No user found');
      router.replace('/auth/child-login');
      return;
    }

    const child = await getChildByUserId(user.id);
    console.log('🔍 [Progress Debug] Child:', child?.id, child?.name);

    if (child) {
      setChildId(child.id);
      setChildName(child.name);

      const userProgress = await getUserActiveTrackProgress(child.id);
      console.log('🔍 [Progress Debug] User Progress:', userProgress);
      setProgress(userProgress);

      if (userProgress) {
        const track = await getTrackWithDays(userProgress.track_id);
        console.log('🔍 [Progress Debug] Track:', track?.name_he, 'Days:', track?.track_days?.length);
        setTrackWithDays(track);
      } else {
        console.log('❌ [Progress Debug] No active track found for child');
      }
    } else {
      console.log('❌ [Progress Debug] No child found for user');
    }
  } catch (error) {
    console.error('❌ [Progress Debug] Error:', error);
  } finally {
    setLoading(false);
  }
};
```

### 2.2 Check Console Output

Open your app and navigate to Progress tab. Look for these logs:

**Scenario A: No child found**
```
🔍 [Progress Debug] User: abc-123 child
❌ [Progress Debug] No child found for user
```
→ **Solution:** Child record missing, create it

**Scenario B: Child exists but no track**
```
🔍 [Progress Debug] User: abc-123 child
🔍 [Progress Debug] Child: child-456 שרה
🔍 [Progress Debug] User Progress: null
❌ [Progress Debug] No active track found for child
```
→ **Solution:** Start a track for the child

**Scenario C: Track exists but no days**
```
🔍 [Progress Debug] User: abc-123 child
🔍 [Progress Debug] Child: child-456 שרה
🔍 [Progress Debug] User Progress: {id: "prog-123", track_id: "track-001"}
🔍 [Progress Debug] Track: מסלול אימון Days: undefined
```
→ **Solution:** Track has no track_days, add them

---

## Step 3: Verify RLS Policies

### 3.1 Check user_track_progress RLS

```sql
-- Test if child can read their own progress
SET request.jwt.claims.sub = 'YOUR_USER_ID_HERE';

SELECT * FROM user_track_progress
WHERE child_id IN (
  SELECT id FROM children WHERE user_id = 'YOUR_USER_ID_HERE'
);
```

**If no results:** RLS policy blocking access → Fix RLS policy

### 3.2 Check Required RLS Policies

Verify these policies exist:

```sql
-- Check all RLS policies for user_track_progress
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_track_progress';
```

**Required policies:**
- Children can read their own progress
- Children can update their own progress

---

## Step 4: Common Fixes

### Fix #1: Start Track for Child

If `user_track_progress` is empty:

```tsx
// In your code or via Supabase SQL Editor
import { startTrack } from '@/lib/trackService';

// Get first active track
const tracks = await getActiveTrainingTracks();
const firstTrack = tracks[0];

// Start track for child
await startTrack(childId, firstTrack.id);
```

Or via SQL:

```sql
-- Start track for child
INSERT INTO user_track_progress (
  child_id,
  track_id,
  current_day,
  days_completed,
  started_at,
  last_activity_at
) VALUES (
  'YOUR_CHILD_ID',
  'YOUR_TRACK_ID',
  1,
  ARRAY[]::integer[],
  NOW(),
  NOW()
);
```

---

### Fix #2: Create Child Account

If child doesn't exist:

```tsx
import { addChild } from '@/lib/familyService';

// Parent must be logged in
const family = await getFamily(parentId);

const child = await addChild(family.id, {
  name: 'Child Name',
  age: 8
});
```

---

### Fix #3: Fix RLS Policy

If RLS is blocking:

```sql
-- Allow children to view their own progress
CREATE POLICY "Children can view own progress"
ON user_track_progress
FOR SELECT
TO authenticated
USING (
  child_id IN (
    SELECT id FROM children WHERE user_id = auth.uid()
  )
);
```

---

### Fix #4: Automatic Track Start

Modify child creation to auto-start track:

```tsx
// In lib/familyService.ts, after creating child
export async function addChild(familyId: string, childData: AddChildData) {
  // ... existing code ...

  const child = childRecord as Child;

  // ... edge function call ...

  // AUTO-START FIRST TRACK
  const tracks = await getActiveTrainingTracks();
  if (tracks.length > 0) {
    await startTrack(child.id, tracks[0].id);
  }

  return child;
}
```

---

## Step 5: Test with Mock Data

To isolate if it's a data issue vs UI issue:

```tsx
// Add to top of loadData() function
// TEMPORARY TEST ONLY
const { mockData } = await import('@/lib/mockProgressData');
setChildId(mockData.child.id);
setChildName(mockData.child.name);
setProgress(mockData.userProgress as any);
setTrackWithDays({
  ...mockData.track,
  track_days: mockData.trackDays
} as any);
setLoading(false);
return; // Skip real data
```

**If this works:** Data issue (database empty)
**If this fails:** UI/component issue

---

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Child account exists with `user_id` populated
- [ ] Child is linked (`is_linked = true`)
- [ ] At least one active training track exists (`training_tracks.is_active = true`)
- [ ] Track has 30 days configured (`track_days` count = 30)
- [ ] User has track progress record (`user_track_progress` row exists)
- [ ] RLS policies allow child to read own data
- [ ] User is authenticated as child (not parent)
- [ ] No JavaScript errors in console
- [ ] Supabase connection works (test other queries)

---

## Most Common Solution

**90% of cases:** Child exists but track was never started.

**Quick fix:**

```sql
-- Find child ID
SELECT id FROM children WHERE name = 'Child Name';

-- Find active track ID
SELECT id FROM training_tracks WHERE is_active = true LIMIT 1;

-- Start track
INSERT INTO user_track_progress (child_id, track_id, current_day, days_completed)
VALUES ('child-id-here', 'track-id-here', 1, ARRAY[]::integer[]);
```

Then refresh the Progress page.

---

## User Impact Analysis

### Impact of Each Issue:

1. **No track started**
   - User can't see progress
   - Can't access any exercises
   - Appears as if app is broken
   - **Severity:** HIGH

2. **Child account missing**
   - Can't access any child features
   - Entire app unusable for child
   - **Severity:** CRITICAL

3. **RLS blocking access**
   - Data exists but can't be retrieved
   - Security working correctly but too restrictive
   - **Severity:** HIGH

4. **Track not configured**
   - Admin/setup issue
   - Affects all users
   - **Severity:** CRITICAL

---

## Prevention Measures

### 1. Auto-start Track on Child Creation

```tsx
// Always start default track when child is created
export async function addChild(familyId: string, childData: AddChildData) {
  const child = await createChildRecord(familyId, childData);

  // Get default track
  const defaultTrack = await getActiveTrainingTracks();
  if (defaultTrack[0]) {
    await startTrack(child.id, defaultTrack[0].id);
  }

  return child;
}
```

### 2. Add Better Error Messages

```tsx
// Show specific error instead of generic message
if (!progress) {
  return (
    <View>
      <Text>No active track found</Text>
      <Button onPress={async () => {
        // Auto-start track
        const tracks = await getActiveTrainingTracks();
        await startTrack(childId, tracks[0].id);
        loadData(); // Refresh
      }}>
        Start Training Now
      </Button>
    </View>
  );
}
```

### 3. Add Data Validation

```tsx
// Check data integrity on load
const validateProgress = async (childId: string) => {
  const progress = await getUserActiveTrackProgress(childId);

  if (!progress) {
    console.warn('No progress found, auto-starting track');
    const tracks = await getActiveTrainingTracks();
    if (tracks[0]) {
      await startTrack(childId, tracks[0].id);
      return await getUserActiveTrackProgress(childId);
    }
  }

  return progress;
};
```

---

## Next Steps

1. **Run database queries** (Step 1) to identify which table has missing data
2. **Add debug logging** (Step 2.1) to see exactly where it fails
3. **Apply the fix** (Step 4) for your specific case
4. **Test** that Progress page now shows the 30-day path
5. **Implement prevention** (Prevention Measures) to avoid future issues

Most likely you need to run:
```sql
-- Quick fix SQL
INSERT INTO user_track_progress (child_id, track_id, current_day, days_completed)
SELECT
  c.id,
  (SELECT id FROM training_tracks WHERE is_active = true LIMIT 1),
  1,
  ARRAY[]::integer[]
FROM children c
WHERE NOT EXISTS (
  SELECT 1 FROM user_track_progress WHERE child_id = c.id
);
```

This will start tracks for all children who don't have one yet.
