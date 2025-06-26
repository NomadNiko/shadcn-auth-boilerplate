const puppeteer = require('puppeteer');

async function testSavePayload() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  let capturedPayload = null;
  
  // Intercept requests to capture the exact payload
  page.on('request', request => {
    if (request.url().includes('shifts/bulk') && request.method() === 'POST') {
      capturedPayload = request.postData();
    }
  });
  
  // Track console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('BULK') || text.includes('save') || text.includes('operations')) {
      console.log('Browser console:', text);
    }
  });
  
  try {
    console.log('=== Testing Save Payload ===\n');
    
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
    
    // Select existing schedule
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
        
        // Make a change by selecting and moving a shift
        console.log('3. Making a change...');
        const existingShifts = await page.$$('.text-xs.p-1.mb-1.rounded.cursor-move');
        
        if (existingShifts.length > 0) {
          // Click on first shift to select it
          await existingShifts[0].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to move it - click on a different day cell
          const dayCells = await page.$$('.min-h-\\[80px\\]');
          if (dayCells.length > 10) {
            await dayCells[10].click(); // Click on different cell
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Made a change by moving shift');
          }
        }
        
        // Clear captured payload
        capturedPayload = null;
        
        // Click Save Draft
        console.log('\\n4. Clicking Save Draft...');
        const saveDraftButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => button.textContent?.includes('Save Draft'));
        });
        
        if (saveDraftButton.asElement()) {
          await saveDraftButton.asElement()?.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          if (capturedPayload) {
            console.log('\\n📦 CAPTURED PAYLOAD:');
            console.log(capturedPayload);
            
            // Try to parse as JSON
            try {
              const parsed = JSON.parse(capturedPayload);
              console.log('\\n🔍 PARSED PAYLOAD:');
              console.log(JSON.stringify(parsed, null, 2));
              
              if (parsed.operations && parsed.operations.length > 0) {
                console.log('\\n📋 OPERATIONS:');
                parsed.operations.forEach((op, index) => {
                  console.log(`Operation ${index + 1}:`);
                  console.log(`  Type: "${op.type}" (${typeof op.type})`);
                  console.log(`  Client ID: ${op.clientId}`);
                  if (op.data) console.log(`  Data:`, op.data);
                  if (op.id) console.log(`  ID: ${op.id}`);
                });
              }
            } catch (e) {
              console.log('Failed to parse payload as JSON:', e.message);
            }
          } else {
            console.log('❌ No payload captured');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();
  }
}

testSavePayload();