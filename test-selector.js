const puppeteer = require('puppeteer');

async function testSelector() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Testing Schedule Selector Dialog ===');
    
    // Login
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'admin@nomadsoft.us');
    await page.type('input[name="password"]', 'secret');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login successful');
    
    // Navigate to Schedule Manager
    await page.goto('http://localhost:3000/schedule-manager/assign', { waitUntil: 'networkidle0' });
    console.log('✅ Navigated to schedule manager');
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if selector dialog is shown
    const pageText = await page.evaluate(() => document.body.textContent);
    
    if (pageText.includes('Edit Existing Schedule') && pageText.includes('Create New Schedule')) {
      console.log('✅ SUCCESS: Schedule selector dialog is properly displayed');
      console.log('✅ User must now choose between editing existing or creating new');
      
      // Verify schedule editor is NOT automatically loaded
      if (!pageText.includes('Cleaner') && !pageText.includes('Front Desk')) {
        console.log('✅ SUCCESS: Schedule editor is NOT auto-loaded');
      } else {
        console.log('❌ FAILURE: Schedule editor was auto-loaded');
      }
    } else {
      console.log('❌ FAILURE: Schedule selector dialog not shown');
      console.log('Page content includes:', pageText.includes('Required Shifts') ? 'Schedule Editor' : 'Unknown content');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testSelector();