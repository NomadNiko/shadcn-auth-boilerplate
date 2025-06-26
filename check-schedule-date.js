const axios = require('axios');

async function checkScheduleDate() {
  try {
    console.log('=== Checking Schedule Date Format ===');
    
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
    
    console.log('Schedule details:');
    console.log('- Name:', schedule.name);
    console.log('- Start Date:', schedule.startDate);
    console.log('- End Date:', schedule.endDate);
    
    // Parse and format dates
    const startDate = new Date(schedule.startDate);
    const endDate = new Date(schedule.endDate);
    
    console.log('\nParsed dates:');
    console.log('- Start Date (Date object):', startDate);
    console.log('- Start Date (ISO string):', startDate.toISOString());
    console.log('- Start Date (YYYY-MM-DD):', startDate.toISOString().split('T')[0]);
    console.log('- Start Date (Locale string):', startDate.toLocaleDateString());
    
    console.log('\nWeek details:');
    console.log('- Day of week (0=Sunday):', startDate.getDay());
    console.log('- Is Monday?', startDate.getDay() === 1);
    
    // Calculate Monday of that week
    const monday = new Date(startDate);
    monday.setDate(startDate.getDate() - startDate.getDay() + 1);
    console.log('- Monday of week:', monday.toISOString().split('T')[0]);
    console.log('- Monday formatted:', monday.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    }));
    
    // Current date for reference
    console.log('\nCurrent date:', new Date().toISOString().split('T')[0]);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkScheduleDate();