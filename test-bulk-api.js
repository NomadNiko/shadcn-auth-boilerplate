const puppeteer = require('puppeteer');

async function testBulkAPI() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  let authToken = null;
  
  // Intercept requests to capture auth token
  page.on('request', request => {
    const authHeader = request.headers()['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }
  });
  
  try {
    console.log('=== Testing Bulk API Endpoint ===\n');
    
    // Login to get auth token
    console.log('1. Logging in to get auth token...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'admin@nomadsoft.us');
    await page.type('input[name="password"]', 'secret');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login successful');
    
    // Navigate to trigger API calls and capture token
    console.log('2. Navigating to capture auth token...');
    await page.goto('http://localhost:3000/schedule-manager/assign', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (authToken) {
      console.log('✅ Auth token captured');
      console.log('Token preview:', authToken.substring(0, 20) + '...');
      
      // Test the bulk operations endpoint directly
      console.log('\\n3. Testing bulk operations endpoint...');
      
      const testData = {
        operations: [
          {
            type: 'create',
            data: {
              shiftTypeId: '685c0a61509006e201de1a71',
              date: '2025-07-12',
              order: 1
            },
            clientId: 'test-1'
          }
        ]
      };
      
      const response = await page.evaluate(async (token, data) => {
        try {
          const response = await fetch('http://localhost:3001/api/v1/schedules/685cdfa239de7fad1413fdc6/shifts/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
          });
          
          const result = {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          };
          
          if (response.ok) {
            result.data = await response.json();
          } else {
            result.error = await response.text();
          }
          
          return result;
        } catch (error) {
          return {
            error: error.message,
            type: 'fetch_error'
          };
        }
      }, authToken, testData);
      
      console.log('\\nAPI Response:');
      console.log('Status:', response.status, response.statusText);
      console.log('Headers:', response.headers);
      
      if (response.error) {
        console.log('❌ API Error:');
        console.log(response.error);
        
        // Try to parse as JSON to see the actual error
        try {
          const errorObj = JSON.parse(response.error);
          console.log('Parsed error:', errorObj);
        } catch (e) {
          console.log('Raw error text:', response.error);
        }
      } else if (response.data) {
        console.log('✅ API Success:');
        console.log(response.data);
      }
      
    } else {
      console.log('❌ Could not capture auth token');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
  }
}

testBulkAPI();