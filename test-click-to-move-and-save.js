const puppeteer = require('puppeteer');

async function testClickToMoveAndSave() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track console logs and network requests
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('save') || text.includes('bulk') || text.includes('change') || text.includes('init')) {
      console.log('Browser console:', text);
    }
  });
  
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  try {
    console.log('=== Testing Click-to-Move and Save Issue ===\n');
    
    // Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'admin@nomadsoft.us');
    await page.type('input[name="password"]', 'secret');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login successful\\n');
    
    // Navigate to Schedule Manager
    console.log('2. Navigating to Schedule Manager...');
    await page.goto('http://localhost:3000/schedule-manager/assign', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click Edit Existing Schedule
    console.log('3. Selecting existing schedule...');
    const editButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Edit Existing Schedule'));
    });
    
    if (editButton.asElement()) {
      await editButton.asElement()?.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click on first schedule
      const scheduleCards = await page.$$('.cursor-pointer');
      if (scheduleCards.length > 0) {
        await scheduleCards[0].click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Schedule loaded\\n');
        
        // Test click-to-move functionality
        console.log('4. Testing click-to-move functionality...');
        
        // First, check if there are any shifts visible
        const existingShifts = await page.$$('.text-xs.p-1.mb-1.rounded.cursor-move');
        console.log(`Found ${existingShifts.length} existing shifts`);
        
        if (existingShifts.length > 0) {
          console.log('4a. Clicking on first shift to select it...');
          await existingShifts[0].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if shift was selected (yellow border)
          const selectedShift = await page.$('.ring-4.ring-yellow-400');
          if (selectedShift) {
            console.log('✅ Shift selected successfully (yellow border visible)');
            
            // Try to move it to a different day
            console.log('4b. Clicking on a different day cell to move shift...');
            const dayCells = await page.$$('.min-h-\\[80px\\]');
            if (dayCells.length > 7) { // Skip to a different day
              await dayCells[10].click(); // Click on different employee's cell
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log('✅ Attempted to move shift to different location');
            }
          } else {
            console.log('❌ Shift selection not working (no yellow border)');
          }
        } else {
          console.log('No existing shifts found - will test save without changes first');
        }
        
        // Test saving issue - record state before save
        console.log('\\n5. Testing save issue...');
        const initialState = await page.evaluate(() => {
          return {
            assignedShifts: document.querySelectorAll('.text-xs.p-1.mb-1.rounded.cursor-move').length,
            hasChanges: document.body.textContent?.includes('Has Changes: Yes'),
            debugInfo: document.querySelector('.fixed.bottom-4.right-4')?.textContent || 'No debug info'
          };
        });
        
        console.log('Initial state before save:', initialState);
        
        // Clear request log
        requests.length = 0;
        
        // Click Save Draft
        console.log('\\n6. Clicking Save Draft...');
        const saveDraftButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => button.textContent?.includes('Save Draft'));
        });
        
        if (saveDraftButton.asElement()) {
          await saveDraftButton.asElement()?.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check what API calls were made
          console.log('\\nAPI calls during save:');
          requests.forEach(req => {
            console.log(`  ${req.method} ${req.url} at ${req.timestamp}`);
          });
          
          // Record state after save
          const finalState = await page.evaluate(() => {
            return {
              assignedShifts: document.querySelectorAll('.text-xs.p-1.mb-1.rounded.cursor-move').length,
              hasChanges: document.body.textContent?.includes('Has Changes: Yes'),
              debugInfo: document.querySelector('.fixed.bottom-4.right-4')?.textContent || 'No debug info'
            };
          });
          
          console.log('\\nFinal state after save:', finalState);
          
          // Compare states
          if (initialState.assignedShifts !== finalState.assignedShifts) {
            console.log('❌ ISSUE: Number of shifts changed after save!');
            console.log(`  Before: ${initialState.assignedShifts}, After: ${finalState.assignedShifts}`);
          } else {
            console.log('✅ Shift count remained the same');
          }
          
          if (initialState.hasChanges && !finalState.hasChanges) {
            console.log('✅ Changes flag correctly cleared after save');
          } else if (initialState.hasChanges && finalState.hasChanges) {
            console.log('⚠️  Changes flag still shows true after save');
          }
          
        } else {
          console.log('❌ Save Draft button not found');
        }
        
      } else {
        console.log('❌ No schedule cards found');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Keep browser open for inspection
    await browser.close();
  }
}

testClickToMoveAndSave();