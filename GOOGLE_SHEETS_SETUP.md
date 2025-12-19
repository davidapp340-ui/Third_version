# Google Sheets Exercise Data Source

## Overview

Your Google Sheets URL has been embedded in the application code as the central data source for exercise information. This document explains how the system works and how to use it.

## 🔗 Your Data Source

**Google Sheets URL:**
```
https://docs.google.com/spreadsheets/d/1LBrZ_qRTsD0caYtnU1R6MOGjgALrPqADhtyd-fVVVig/edit?usp=sharing
```

**Sheet ID:** `1LBrZ_qRTsD0caYtnU1R6MOGjgALrPqADhtyd-fVVVig`

This URL is stored in: `lib/exercisesDataSource.ts`

## 📁 File Structure

### 1. **`lib/exercisesDataSource.ts`**
Central configuration file containing:
- Google Sheets URL and ID
- Functions to fetch data from the sheet
- CSV parsing utilities
- TypeScript interfaces

### 2. **`app/sync-exercises+api.ts`**
API endpoint that:
- Fetches data from your Google Sheets
- Updates the `eye_exercises` table
- Updates the `exercises_gallery` table
- Returns sync results

### 3. **`app/admin-sync.tsx`**
Admin interface screen for:
- Viewing the configured data source
- Triggering manual sync
- Viewing sync results

## 📊 Expected Google Sheets Format

Your spreadsheet should have the following columns:

### For `eye_exercises` table:
| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| `id` | ✓ | Unique exercise ID | MTIHA1, TNOA1 |
| `exercise_name` | ✓ | Exercise name | "Up Down", "Fast Blinking" |
| `icon` | | Icon identifier or URL | URL or "FALSE" |
| `description` | | Exercise description | "Stretching the eye muscles..." |
| `media_type` | | Media format | "Video" or "Audio" |
| `video_link` | | Video URL | https://... or "FALSE" |
| `audio_link` | | Audio URL | https://... or "FALSE" |

### For `exercises_gallery` table:
| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| `id` | ✓ | Links to exercise ID | MTIHA1 |
| `category` | ✓ | Category name | "Stretching" |
| `color` | ✓ | Hex color code | #FF6B6B |
| `display` | | Show in gallery | true/false |
| `display_order` | | Sort order | 1, 2, 3... |

## 🔑 Setup Requirements

### Step 1: Make Your Sheet Accessible

Your Google Sheet must be publicly accessible for the sync to work:

1. Open your Google Sheet
2. Click the **Share** button (top right)
3. Change access to **"Anyone with the link"**
4. Set permission to **"Viewer"**
5. Copy the link to verify

### Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
# Supabase Service Role Key (Required for admin operations)
# Get from: Supabase Dashboard > Settings > API > service_role
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Admin Secret (Required for sync API authorization)
ADMIN_SECRET=your-secure-random-string
```

**To get your Supabase Service Role Key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the `service_role` key (keep it secret!)

### Step 3: Update Admin Secret in Code

Edit `app/admin-sync.tsx` line ~35:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer your-secret-key', // Replace with your ADMIN_SECRET
},
```

## 🚀 How to Use

### Method 1: Using the Admin Screen

1. Navigate to `/admin-sync` in your app
2. Verify the Google Sheets URL is displayed
3. Click **"Sync Now"**
4. Review the sync results

### Method 2: Using the API Directly

```bash
curl -X POST https://your-app/sync-exercises \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-secret"
```

**Response:**
```json
{
  "success": true,
  "message": "Exercises synced successfully",
  "results": {
    "eyeExercises": {
      "updated": 10,
      "errors": 0
    },
    "gallery": {
      "updated": 5,
      "errors": 0
    }
  },
  "totalProcessed": 10
}
```

## 🔄 Workflow for Updating Exercises

1. **Update your Google Sheet** with new/modified exercise data
2. **Save the changes** in Google Sheets
3. **Open the app** and navigate to `/admin-sync`
4. **Click "Sync Now"** to pull the latest data
5. **Verify the results** on screen
6. **Check the app** to see updated exercises

## 🔧 Updating the Data Source

If you need to change to a different Google Sheet:

1. Open `lib/exercisesDataSource.ts`
2. Update the `GOOGLE_SHEETS_CONFIG` object:

```typescript
const GOOGLE_SHEETS_CONFIG = {
  editUrl: 'YOUR_NEW_GOOGLE_SHEETS_URL',
  sheetId: 'EXTRACT_SHEET_ID_FROM_URL',
  gids: {
    exercises: '0', // First tab = 0, second tab = 1, etc.
    gallery: '0',
  }
};
```

3. Save and restart your app

## 📋 Database Tables

### `eye_exercises`
Stores complete exercise information including name, description, media links, and metadata.

**Schema:**
- `id` (text, primary key)
- `exercise_name` (text)
- `icon` (text)
- `description` (text)
- `media_type` (text) - 'Video' or 'Audio'
- `video_link` (text)
- `audio_link` (text)
- `created_at`, `updated_at` (timestamps)

### `exercises_gallery`
Stores gallery display configuration for exercises.

**Schema:**
- `id` (text, primary key, foreign key to eye_exercises)
- `category` (text)
- `color` (text) - Hex format (#RRGGBB)
- `display` (boolean)
- `display_order` (integer)
- `created_at`, `updated_at` (timestamps)

## ⚠️ Current Status

**Database Status:**
- ✓ Tables created and configured
- ✓ Sample data exists (28 eye_exercises, 5 gallery items)
- ✓ Row Level Security enabled
- ✓ Foreign key constraints in place

**Code Status:**
- ✓ Data source configuration file created
- ✓ Sync API endpoint implemented
- ✓ Admin sync screen created
- ⚠️ Google Sheet needs to be made publicly accessible
- ⚠️ Environment variables need configuration

## 🐛 Troubleshooting

### "Access denied: Unable to retrieve content"
**Problem:** Google Sheet is not publicly accessible

**Solution:**
1. Open the sheet
2. Click Share
3. Change to "Anyone with the link can view"

### "Unauthorized" Error
**Problem:** Admin secret doesn't match

**Solution:**
1. Verify `ADMIN_SECRET` in `.env`
2. Ensure Authorization header matches: `Bearer your-secret-key`

### "No data found in Google Sheets"
**Problem:** Sheet is empty or format is incorrect

**Solution:**
1. Verify sheet has data rows (not just headers)
2. Check column names match expected format
3. Ensure first row contains column headers

### Foreign Key Constraint Error
**Problem:** Gallery references non-existent exercise

**Solution:**
1. Ensure all IDs in gallery exist in eye_exercises
2. Sync eye_exercises first, then gallery

### "Failed to fetch sheet data"
**Problem:** Network or permission issue

**Solution:**
1. Check internet connection
2. Verify sheet URL is correct
3. Test accessing the CSV export URL directly

## 🔐 Security Notes

1. **Never commit** `.env` file to version control
2. **Keep secret** your Supabase service role key
3. **Use strong** random strings for ADMIN_SECRET
4. **Restrict access** to admin sync endpoint in production
5. **Monitor** sync logs for suspicious activity

## 📚 Sample Data Format

Here's an example of how your Google Sheet should look:

| id | exercise_name | description | media_type | category | color | display | display_order |
|----|---------------|-------------|------------|----------|-------|---------|---------------|
| MTIHA1 | Up Down | Stretching the eye muscles from bottom up | Video | Stretching | #FF6B6B | TRUE | 1 |
| MTIHA2 | Right Left | Stretching horizontally | Video | Stretching | #FF6B6B | TRUE | 2 |
| TNOA1 | Fast Blinking | Rapid blinking for 30 seconds | Video | Focus & Blinking | #4ECDC4 | TRUE | 1 |

## 📞 Next Steps

1. ✓ Google Sheets URL is embedded in code
2. ⚠️ Make your Google Sheet publicly accessible
3. ⚠️ Configure environment variables in `.env`
4. ⚠️ Update the admin secret in `admin-sync.tsx`
5. ⚠️ Test the sync functionality
6. ⚠️ Verify data appears correctly in the app

---

**Questions or need to update the URL?** Simply ask and provide the new Google Sheets link!
