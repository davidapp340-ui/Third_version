import { fetchExercisesData } from '../lib/exercisesDataSource';

async function testFetch() {
  try {
    console.log('Fetching data from Google Sheets...\n');
    const data = await fetchExercisesData();

    console.log(`Found ${data.length} exercises\n`);

    if (data.length > 0) {
      console.log('First exercise sample:');
      console.log(JSON.stringify(data[0], null, 2));

      console.log('\n\nAll exercise IDs:');
      data.forEach(ex => console.log(`- ${ex.id}: ${ex.exercise_name}`));

      console.log('\n\nAvailable columns:');
      console.log(Object.keys(data[0]));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testFetch();
