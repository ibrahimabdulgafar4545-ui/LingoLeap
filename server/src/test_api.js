async function runTests() {
  const baseUrl = 'http://localhost:5000/api';
  const username = `testuser_${Date.now()}`;
  const email = `test_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('--- STARTING INTEGRATION TESTS ---');

  try {
    // 1. REGISTER
    console.log(`1. Registering user: ${username}...`);
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, targetLanguage: 'English' })
    });
    const regData = await regRes.json();
    if (!regData.success) {
      throw new Error(`Registration failed: ${regData.message}`);
    }
    const token = regData.token;
    console.log('   Registration successful! Token received.');

    // 2. GET LESSONS
    console.log('2. Fetching lessons for English...');
    const lessonsRes = await fetch(`${baseUrl}/lessons?language=English`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const lessonsData = await lessonsRes.json();
    if (!lessonsData.success) {
      throw new Error(`Failed to fetch lessons: ${lessonsData.message}`);
    }
    const lessons = lessonsData.lessons;
    console.log(`   Fetched ${lessons.length} lessons. First lesson: "${lessons[0].title}" in Unit: "${lessons[0].unitTitle}"`);

    // 3. SUBMIT FIRST LESSON
    const firstLesson = lessons[0];
    console.log(`3. Submitting progress for lesson: "${firstLesson.title}"...`);
    
    // Simulate correct answers
    const answers = firstLesson.questions.map(q => ({
      questionIndex: 0,
      isCorrect: true,
      userAnswer: q.correctAnswer
    }));

    const submitRes = await fetch(`${baseUrl}/lessons/${firstLesson._id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ answers, totalQuestions: firstLesson.questions.length })
    });
    const submitData = await submitRes.json();
    if (!submitData.success) {
      throw new Error(`Submission failed: ${submitData.message}`);
    }
    console.log('   Submission successful!');
    console.log(`   Score: ${submitData.score}%`);
    console.log(`   XP Earned: ${submitData.xpEarned}`);
    console.log(`   Updated User XP: ${submitData.user.xp}, Level: ${submitData.user.level}, Streak: ${submitData.user.streakCount}`);

    // 4. CHECK LEADERBOARD
    console.log('4. Fetching leaderboard...');
    const lbRes = await fetch(`${baseUrl}/leaderboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const lbData = await lbRes.json();
    if (!lbData.success) {
      throw new Error(`Failed to fetch leaderboard: ${lbData.message}`);
    }
    console.log('   Leaderboard (Top 3):');
    lbData.leaders.slice(0, 3).forEach((leader, idx) => {
      console.log(`     ${idx + 1}. ${leader.username} - ${leader.xp} XP (Level ${leader.level})`);
    });

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test run encountered error:', err.message);
  }
}

runTests();
