const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create logs directory
const logsDir = path.join(__dirname, 'debug-logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

async function debugScheduleLoading() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture network requests
  const networkLogs = [];
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    console.log(`→ ${request.method()} ${request.url()}`);
    networkLogs.push({
      type: 'request',
      method: request.method(),
      url: request.url(),
      headers: request.headers(),
      postData: request.postData()
    });
    request.continue();
  });
  
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    console.log(`← ${status} ${url}`);
    
    let responseData = null;
    try {
      if (url.includes('/api/')) {
        responseData = await response.text();
      }
    } catch (e) {
      responseData = 'Could not read response body';
    }
    
    networkLogs.push({
      type: 'response',
      url,
      status,
      headers: response.headers(),
      data: responseData
    });
  });
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    console.log(`Console: ${text}`);
    consoleLogs.push({
      type: msg.type(),
      text,
      timestamp: new Date().toISOString()
    });
  });
  
  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', (error) => {
    console.error('Page Error:', error.message);
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    console.log('=== STEP 1: Login ===');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(logsDir, '01-login-page.png') });
    
    // Fill login form
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.type('input[name="email"]', 'admin@nomadsoft.us');
    await page.type('input[name="password"]', 'secret');
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(logsDir, '02-after-login.png') });
    
    console.log('=== STEP 2: Navigate to Schedule Manager ===');
    await page.goto('http://localhost:3000/schedule-manager/assign', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(logsDir, '03-schedule-manager-initial.png') });
    
    // Wait a bit for any dialogs or loading
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: path.join(logsDir, '04-schedule-manager-after-wait.png') });
    
    console.log('=== STEP 3: Check for Schedule Selector Dialog ===');
    const dialogExists = await page.$('.schedule-selector-dialog') !== null;
    console.log('Schedule selector dialog exists:', dialogExists);
    
    if (dialogExists) {
      await page.screenshot({ path: path.join(logsDir, '05-schedule-selector-dialog.png') });
      
      // Try to select the first schedule
      const firstSchedule = await page.$('button[data-schedule-id]');
      if (firstSchedule) {
        console.log('Clicking first schedule option...');
        await firstSchedule.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.screenshot({ path: path.join(logsDir, '06-after-schedule-selection.png') });
      }
    }
    
    console.log('=== STEP 4: Check Schedule Editor State ===');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for the schedule editor components
    const requiredShiftsSection = await page.$('.required-shifts-section');
    const scheduleGrid = await page.$('.schedule-grid');
    const employeeList = await page.$('.employee-list');
    
    console.log('Required shifts section exists:', !!requiredShiftsSection);
    console.log('Schedule grid exists:', !!scheduleGrid);
    console.log('Employee list exists:', !!employeeList);
    
    if (requiredShiftsSection) {
      const shiftsText = await page.evaluate((el) => el.textContent, requiredShiftsSection);
      console.log('Required shifts section content:', shiftsText);
    }
    
    await page.screenshot({ path: path.join(logsDir, '07-final-schedule-editor-state.png') });
    
    console.log('=== STEP 5: Check React DevTools State ===');
    // Execute some JavaScript to check component state
    const componentState = await page.evaluate(() => {
      // Try to find React components and their state
      const reactRoot = document.querySelector('#__next');
      if (reactRoot && reactRoot._reactInternalFiber) {
        return 'React fiber found';
      }
      return 'No React fiber found';
    });
    console.log('Component state check:', componentState);
    
  } catch (error) {
    console.error('Error during debugging:', error);
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    await page.screenshot({ path: path.join(logsDir, 'error-screenshot.png') });
  }
  
  // Save all logs
  fs.writeFileSync(
    path.join(logsDir, 'network-logs.json'), 
    JSON.stringify(networkLogs, null, 2)
  );
  
  fs.writeFileSync(
    path.join(logsDir, 'console-logs.json'), 
    JSON.stringify(consoleLogs, null, 2)
  );
  
  fs.writeFileSync(
    path.join(logsDir, 'page-errors.json'), 
    JSON.stringify(pageErrors, null, 2)
  );
  
  console.log('=== SUMMARY ===');
  console.log(`Network requests: ${networkLogs.filter(l => l.type === 'request').length}`);
  console.log(`Network responses: ${networkLogs.filter(l => l.type === 'response').length}`);
  console.log(`Console messages: ${consoleLogs.length}`);
  console.log(`Page errors: ${pageErrors.length}`);
  console.log(`Logs saved to: ${logsDir}`);
  
  await browser.close();
}

// Also test the API directly
async function testAPIDirectly() {
  console.log('\n=== TESTING API DIRECTLY ===');
  
  const axios = require('axios');
  const baseURL = 'http://localhost:3001';
  
  try {
    // First login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${baseURL}/api/v1/auth/email/login`, {
      email: 'admin@nomadsoft.us',
      password: 'secret'
    });
    
    const token = loginResponse.data.access_token;
    console.log('Login successful, token received');
    
    const authHeaders = { Authorization: `Bearer ${token}` };
    
    // Get all schedules
    console.log('2. Getting all schedules...');
    const schedulesResponse = await axios.get(`${baseURL}/api/v1/schedules`, {
      headers: authHeaders
    });
    console.log('Schedules:', JSON.stringify(schedulesResponse.data, null, 2));
    
    if (schedulesResponse.data && schedulesResponse.data.length > 0) {
      const firstSchedule = schedulesResponse.data[0];
      console.log(`\n3. Getting shifts for schedule ${firstSchedule.id}...`);
      
      const shiftsResponse = await axios.get(`${baseURL}/api/v1/schedules/${firstSchedule.id}/shifts`, {
        headers: authHeaders
      });
      console.log('Shifts response:', JSON.stringify(shiftsResponse.data, null, 2));
      
      // Also test shift types
      console.log('\n4. Getting shift types...');
      const shiftTypesResponse = await axios.get(`${baseURL}/api/v1/shift-types`, {
        headers: authHeaders
      });
      console.log('Shift types:', JSON.stringify(shiftTypesResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('API test error:', error.response?.data || error.message);
  }
}

// Run both tests
async function runAllTests() {
  try {
    await testAPIDirectly();
    await debugScheduleLoading();
  } catch (error) {
    console.error('Failed to run tests:', error);
  }
}

runAllTests();