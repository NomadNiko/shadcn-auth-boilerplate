const axios = require('axios');

async function testAPI() {
  try {
    console.log('=== Testing API Direct ===');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/email/login', {
      email: 'admin@nomadsoft.us',
      password: 'secret'
    });
    
    const token = loginResponse.data.token; // Use 'token' not 'access_token'
    console.log('✓ Login successful');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Get schedules
    const schedulesResponse = await axios.get('http://localhost:3001/api/v1/schedules', { headers });
    console.log('✓ Schedules retrieved:', schedulesResponse.data.length);
    
    if (schedulesResponse.data.length > 0) {
      const schedule = schedulesResponse.data[0];
      console.log('First schedule:', schedule.id, schedule.name);
      
      // Get shifts for this schedule
      console.log(`\n=== Testing shifts for schedule ${schedule.id} ===`);
      const shiftsResponse = await axios.get(`http://localhost:3001/api/v1/schedules/${schedule.id}/shifts`, { headers });
      console.log('Shifts response:', JSON.stringify(shiftsResponse.data, null, 2));
      
      // Count shifts
      const totalShifts = shiftsResponse.data.shifts.length + shiftsResponse.data.unassignedShifts.length;
      console.log(`\n✓ Total shifts found: ${totalShifts}`);
      console.log(`  - Assigned shifts: ${shiftsResponse.data.shifts.length}`);
      console.log(`  - Unassigned shifts: ${shiftsResponse.data.unassignedShifts.length}`);
      
      if (totalShifts > 0) {
        console.log('\n✓ SHIFTS EXIST IN DATABASE');
        console.log('The problem is definitely in the frontend - it\'s not loading the shifts');
      } else {
        console.log('\n✗ NO SHIFTS FOUND');
        console.log('The database actually has no shifts for this schedule');
      }
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
  }
}

testAPI();