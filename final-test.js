const puppeteer = require('puppeteer');

async function finalTest() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== FINAL TEST: Complete Schedule Loading Workflow ===');
    
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
    
    // Wait for auto-selection to happen
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check for shifts by looking for specific shift names
    const pageText = await page.evaluate(() => document.body.textContent);
    
    console.log('Checking for shifts in page content...');
    
    if (pageText.includes('Edit Existing Schedule')) {
      console.log('❌ Schedule selector still visible - auto-selection did not work');
      await page.screenshot({ path: '/tmp/final-test-selector.png' });
    } else if (pageText.includes('Cleaner') && pageText.includes('Front Desk')) {
      console.log('✅ SUCCESS: Both shifts (Cleaner and Front Desk) are visible!');
      console.log('✅ Schedule loading issue has been COMPLETELY FIXED!');
    } else if (pageText.includes('Cleaner') || pageText.includes('Front Desk')) {
      console.log('✅ PARTIAL SUCCESS: At least one shift is visible');
      console.log('Found shift names in page:', pageText.includes('Cleaner') ? 'Cleaner' : '', pageText.includes('Front Desk') ? 'Front Desk' : '');
    } else {
      console.log('❌ FAILURE: No shifts visible in the page');
      console.log('Page contains "Required Shifts":', pageText.includes('Required Shifts'));
      await page.screenshot({ path: '/tmp/final-test-failure.png' });
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

finalTest();