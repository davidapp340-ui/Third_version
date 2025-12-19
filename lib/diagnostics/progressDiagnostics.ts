import { supabase } from '../supabase';
import { getCurrentUser } from '../authService';
import { getChildByUserId } from '../familyService';
import { getUserActiveTrackProgress, getTrackWithDays, getActiveTrainingTracks, startTrack } from '../trackService';

interface DiagnosticResult {
  passed: boolean;
  message: string;
  data?: any;
  fix?: string;
}

interface ProgressDiagnostics {
  userCheck: DiagnosticResult;
  childCheck: DiagnosticResult;
  progressCheck: DiagnosticResult;
  trackCheck: DiagnosticResult;
  trackDaysCheck: DiagnosticResult;
  rlsCheck: DiagnosticResult;
  overall: {
    allPassed: boolean;
    summary: string;
    suggestedFix?: string;
  };
}

export async function diagnoseProgressIssue(): Promise<ProgressDiagnostics> {
  const results: ProgressDiagnostics = {
    userCheck: { passed: false, message: '' },
    childCheck: { passed: false, message: '' },
    progressCheck: { passed: false, message: '' },
    trackCheck: { passed: false, message: '' },
    trackDaysCheck: { passed: false, message: '' },
    rlsCheck: { passed: false, message: '' },
    overall: { allPassed: false, summary: '' },
  };

  console.log('🔍 Starting Progress Page Diagnostics...\n');

  // 1. Check User Authentication
  console.log('1️⃣ Checking user authentication...');
  try {
    const user = await getCurrentUser();

    if (!user) {
      results.userCheck = {
        passed: false,
        message: 'No user authenticated',
        fix: 'User needs to log in first',
      };
      console.log('❌ No authenticated user found\n');
    } else {
      const userType = user.user_metadata?.user_type;
      results.userCheck = {
        passed: true,
        message: `User authenticated: ${user.id}`,
        data: { userId: user.id, userType },
      };
      console.log(`✅ User authenticated: ${user.id} (${userType})\n`);

      if (userType === 'parent') {
        console.log('⚠️  Warning: Parent accounts cannot access Progress page\n');
        results.userCheck.fix = 'Log in with a child account instead';
      }
    }
  } catch (error) {
    results.userCheck = {
      passed: false,
      message: `Auth error: ${error}`,
      fix: 'Check authentication setup',
    };
    console.log(`❌ Authentication error: ${error}\n`);
  }

  if (!results.userCheck.passed || results.userCheck.data?.userType === 'parent') {
    results.overall = {
      allPassed: false,
      summary: 'Cannot proceed: User not authenticated or is a parent',
      suggestedFix: results.userCheck.fix,
    };
    return results;
  }

  // 2. Check Child Account
  console.log('2️⃣ Checking child account...');
  try {
    const user = await getCurrentUser();
    const child = await getChildByUserId(user!.id);

    if (!child) {
      results.childCheck = {
        passed: false,
        message: 'No child account found for this user',
        fix: 'Create a child account linked to this user',
      };
      console.log('❌ No child account found\n');
    } else {
      results.childCheck = {
        passed: true,
        message: `Child found: ${child.name} (${child.id})`,
        data: child,
      };
      console.log(`✅ Child account exists: ${child.name} (ID: ${child.id})\n`);
    }
  } catch (error) {
    results.childCheck = {
      passed: false,
      message: `Error fetching child: ${error}`,
      fix: 'Check database connection and RLS policies',
    };
    console.log(`❌ Error fetching child: ${error}\n`);
  }

  if (!results.childCheck.passed) {
    results.overall = {
      allPassed: false,
      summary: 'Child account does not exist',
      suggestedFix: results.childCheck.fix,
    };
    return results;
  }

  const childId = results.childCheck.data!.id;

  // 3. Check User Track Progress
  console.log('3️⃣ Checking user track progress...');
  try {
    const progress = await getUserActiveTrackProgress(childId);

    if (!progress) {
      results.progressCheck = {
        passed: false,
        message: 'No active track progress found for this child',
        data: { childId },
        fix: 'Start a track for this child',
      };
      console.log('❌ No active track progress found\n');
      console.log('💡 This is the most common issue!\n');
    } else {
      results.progressCheck = {
        passed: true,
        message: `Progress found: Day ${progress.current_day}/30, ${progress.days_completed.length} days completed`,
        data: progress,
      };
      console.log(`✅ Track progress exists:`);
      console.log(`   Current day: ${progress.current_day}`);
      console.log(`   Days completed: ${progress.days_completed.length}`);
      console.log(`   Track ID: ${progress.track_id}\n`);
    }
  } catch (error) {
    results.progressCheck = {
      passed: false,
      message: `Error fetching progress: ${error}`,
      fix: 'Check user_track_progress table and RLS policies',
    };
    console.log(`❌ Error fetching progress: ${error}\n`);
  }

  // 4. Check Training Tracks Exist
  console.log('4️⃣ Checking training tracks...');
  try {
    const tracks = await getActiveTrainingTracks();

    if (tracks.length === 0) {
      results.trackCheck = {
        passed: false,
        message: 'No active training tracks found in system',
        fix: 'Create at least one active training track',
      };
      console.log('❌ No active training tracks in database\n');
    } else {
      results.trackCheck = {
        passed: true,
        message: `Found ${tracks.length} active track(s)`,
        data: tracks,
      };
      console.log(`✅ Active tracks found: ${tracks.length}`);
      tracks.forEach((track, i) => {
        console.log(`   ${i + 1}. ${track.name_he} (ID: ${track.id})`);
      });
      console.log();
    }
  } catch (error) {
    results.trackCheck = {
      passed: false,
      message: `Error fetching tracks: ${error}`,
      fix: 'Check training_tracks table',
    };
    console.log(`❌ Error fetching tracks: ${error}\n`);
  }

  // 5. Check Track Days (if progress exists)
  if (results.progressCheck.passed && results.progressCheck.data) {
    console.log('5️⃣ Checking track days...');
    try {
      const trackId = results.progressCheck.data.track_id;
      const track = await getTrackWithDays(trackId);

      if (!track) {
        results.trackDaysCheck = {
          passed: false,
          message: 'Track not found',
          fix: 'Track may have been deleted',
        };
        console.log('❌ Track not found\n');
      } else if (!track.track_days || track.track_days.length === 0) {
        results.trackDaysCheck = {
          passed: false,
          message: 'Track has no days configured',
          data: { trackId, dayCount: 0 },
          fix: 'Add 30 track_days entries for this track',
        };
        console.log('❌ Track has no days configured\n');
      } else if (track.track_days.length < 30) {
        results.trackDaysCheck = {
          passed: false,
          message: `Track only has ${track.track_days.length} days (should be 30)`,
          data: { trackId, dayCount: track.track_days.length },
          fix: 'Add missing days to reach 30 total',
        };
        console.log(`⚠️  Track only has ${track.track_days.length} days (expected 30)\n`);
      } else {
        results.trackDaysCheck = {
          passed: true,
          message: `Track has ${track.track_days.length} days configured`,
          data: { trackId, dayCount: track.track_days.length },
        };
        console.log(`✅ Track has ${track.track_days.length} days configured\n`);
      }
    } catch (error) {
      results.trackDaysCheck = {
        passed: false,
        message: `Error fetching track days: ${error}`,
        fix: 'Check track_days table',
      };
      console.log(`❌ Error fetching track days: ${error}\n`);
    }
  } else {
    results.trackDaysCheck = {
      passed: false,
      message: 'Skipped (no progress to check)',
    };
    console.log('5️⃣ Skipping track days check (no progress found)\n');
  }

  // 6. Check RLS Policies
  console.log('6️⃣ Checking RLS policies...');
  try {
    // Test if we can query the table
    const { data, error } = await supabase
      .from('user_track_progress')
      .select('id')
      .limit(1);

    if (error) {
      results.rlsCheck = {
        passed: false,
        message: `RLS policy may be blocking access: ${error.message}`,
        fix: 'Review and update RLS policies for user_track_progress',
      };
      console.log(`❌ RLS policy issue: ${error.message}\n`);
    } else {
      results.rlsCheck = {
        passed: true,
        message: 'RLS policies allow access',
      };
      console.log('✅ RLS policies working correctly\n');
    }
  } catch (error) {
    results.rlsCheck = {
      passed: false,
      message: `RLS check error: ${error}`,
      fix: 'Check database connection',
    };
    console.log(`❌ RLS check error: ${error}\n`);
  }

  // Generate Overall Summary
  console.log('═══════════════════════════════════════════\n');
  console.log('📊 DIAGNOSTIC SUMMARY\n');
  console.log('═══════════════════════════════════════════\n');

  const allChecks = [
    results.userCheck,
    results.childCheck,
    results.progressCheck,
    results.trackCheck,
    results.trackDaysCheck,
    results.rlsCheck,
  ];

  const passedCount = allChecks.filter((c) => c.passed).length;
  const totalCount = allChecks.length;

  console.log(`Checks passed: ${passedCount}/${totalCount}\n`);

  if (passedCount === totalCount) {
    results.overall = {
      allPassed: true,
      summary: 'All checks passed! Progress page should work correctly.',
    };
    console.log('✅ All diagnostics passed!\n');
    console.log('If Progress page still shows "no training course", try:');
    console.log('   1. Refresh the app (Cmd+R or Ctrl+R)');
    console.log('   2. Clear app cache');
    console.log('   3. Check for JavaScript errors in console\n');
  } else {
    // Find the first failed check
    const firstFailure = allChecks.find((c) => !c.passed);

    if (!results.progressCheck.passed) {
      results.overall = {
        allPassed: false,
        summary: '❌ No active track started for this child',
        suggestedFix: 'Run autoFixProgressIssue() to automatically start a track',
      };
      console.log('❌ PRIMARY ISSUE: No active track progress\n');
      console.log('This is why you see "You have not started a training course yet"\n');
      console.log('💡 QUICK FIX:');
      console.log('   Run: await autoFixProgressIssue()');
      console.log('   Or manually start a track for this child\n');
    } else if (firstFailure) {
      results.overall = {
        allPassed: false,
        summary: firstFailure.message,
        suggestedFix: firstFailure.fix,
      };
      console.log(`❌ ISSUE: ${firstFailure.message}\n`);
      if (firstFailure.fix) {
        console.log(`💡 FIX: ${firstFailure.fix}\n`);
      }
    }
  }

  console.log('═══════════════════════════════════════════\n');

  return results;
}

export async function autoFixProgressIssue(): Promise<{ success: boolean; message: string }> {
  console.log('🔧 Attempting to auto-fix Progress issue...\n');

  try {
    // Run diagnostics first
    const diagnostics = await diagnoseProgressIssue();

    if (diagnostics.overall.allPassed) {
      return {
        success: true,
        message: 'No issues found. Progress should already work.',
      };
    }

    // Check if the issue is missing progress
    if (!diagnostics.progressCheck.passed && diagnostics.childCheck.passed && diagnostics.trackCheck.passed) {
      console.log('💡 Detected: Child exists but has no track started\n');
      console.log('🔧 Applying fix: Starting track for child...\n');

      const childId = diagnostics.childCheck.data!.id;
      const tracks = diagnostics.trackCheck.data!;

      if (tracks.length === 0) {
        return {
          success: false,
          message: 'Cannot fix: No training tracks exist in the system',
        };
      }

      // Start the first available track
      const firstTrack = tracks[0];
      await startTrack(childId, firstTrack.id);

      console.log(`✅ Track started successfully!`);
      console.log(`   Track: ${firstTrack.name_he}`);
      console.log(`   Child: ${diagnostics.childCheck.data!.name}\n`);

      return {
        success: true,
        message: `Track "${firstTrack.name_he}" started for ${diagnostics.childCheck.data!.name}. Refresh the Progress page to see it.`,
      };
    }

    return {
      success: false,
      message: `Cannot auto-fix. Manual intervention required: ${diagnostics.overall.suggestedFix}`,
    };
  } catch (error) {
    console.error('❌ Auto-fix failed:', error);
    return {
      success: false,
      message: `Auto-fix failed: ${error}`,
    };
  }
}

// Export for use in React components
export async function runProgressDiagnosticsUI() {
  const results = await diagnoseProgressIssue();

  return {
    passed: results.overall.allPassed,
    summary: results.overall.summary,
    fix: results.overall.suggestedFix,
    details: results,
  };
}
