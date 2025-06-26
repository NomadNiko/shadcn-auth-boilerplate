const axios = require('axios');

async function debugDateMatching() {
  try {
    console.log('=== Debug Date Matching Issue ===');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/email/login', {
      email: 'admin@nomadsoft.us',
      password: 'secret'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Get schedules
    const schedulesResponse = await axios.get('http://localhost:3001/api/v1/schedules', { headers });
    const schedule = schedulesResponse.data[0];
    
    console.log('Backend schedule:');
    console.log('- Start Date:', schedule.startDate);
    console.log('- Start Date type:', typeof schedule.startDate);
    
    // Simulate frontend date calculation
    const today = new Date(); // Current date
    console.log('\nToday:', today.toISOString());
    
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - today.getDay() + 1); // Current week Monday
    console.log('Current Monday (frontend calc):', currentMonday.toISOString());
    
    const frontendStartDate = currentMonday.toISOString().split('T')[0];
    console.log('Frontend calculated start date:', frontendStartDate);
    
    // Backend date processing
    const backendDate = new Date(schedule.startDate);
    const backendStartDate = backendDate.toISOString().split('T')[0];
    console.log('Backend schedule start date:', backendStartDate);
    
    console.log('\nComparison:');
    console.log('Frontend:', frontendStartDate);
    console.log('Backend: ', backendStartDate);
    console.log('Match?', frontendStartDate === backendStartDate);
    
    // Calculate Monday from backend date
    const backendMonday = new Date(backendDate);
    backendMonday.setDate(backendDate.getDate() - backendDate.getDay() + 1);
    const backendMondayStr = backendMonday.toISOString().split('T')[0];
    console.log('\nBackend Monday calculation:', backendMondayStr);
    console.log('Matches frontend?', frontendStartDate === backendMondayStr);
    
    // Check if we're in the same week
    const daysDiff = Math.abs((currentMonday.getTime() - backendMonday.getTime()) / (1000 * 60 * 60 * 24));
    console.log('Days difference between Mondays:', daysDiff);
    console.log('Same week?', daysDiff < 7);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

debugDateMatching();