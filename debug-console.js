const puppeteer = require('puppeteer');

async function captureConsoleLogs() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('🚀') || text.includes('📋') || text.includes('🔄') || text.includes('✅') || text.includes('❌') || text.includes('🎯') || text.includes('📊')) {
      console.log(`[DEBUG] ${text}`);
    } else {
      console.log(`[CONSOLE] ${text}`);
    }
  });
  
  try {
    console.log('=== Login ===');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'admin@nomadsoft.us');
    await page.type('input[name="password"]', 'secret');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✓ Login successful');
    
    console.log('\n=== Navigate to Schedule Manager ===');
    await page.goto('http://localhost:3000/schedule-manager/assign', { waitUntil: 'networkidle0' });
    
    // Wait for any React hooks to run
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n=== Checking for schedule selector ===');
    
    // Try to find the "Edit Existing Schedule" button by its text
    const editButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Edit Existing Schedule'));
    });
    
    if (editButton.asElement()) {
      console.log('Found "Edit Existing Schedule" button, clicking...');
      await editButton.asElement()?.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Now look for schedule cards
      const scheduleCards = await page.$$('.cursor-pointer');
      console.log(`Found ${scheduleCards.length} clickable schedule elements`);
      
      if (scheduleCards.length > 0) {
        console.log('Clicking first schedule...');
        await scheduleCards[0].click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✓ Selected schedule');
      }
    } else {
      console.log('❌ Could not find "Edit Existing Schedule" button');
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: '/tmp/debug-screen.png' });
    }
    
    console.log('\n=== Final wait for hooks ===');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureConsoleLogs();