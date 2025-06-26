const puppeteer = require('puppeteer');

async function testExistingSchedule() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/') && request.method() !== 'GET') {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    }
  });
  
  // Track console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
  });
  
  try {
    console.log('=== Testing Existing Schedule Bulk Save ===');
    
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click "Edit Existing Schedule"
    const editButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Edit Existing Schedule'));
    });
    
    if (editButton.asElement()) {
      await editButton.asElement()?.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Click on first schedule
      const scheduleCards = await page.$$('.cursor-pointer');
      if (scheduleCards.length > 0) {
        await scheduleCards[0].click();
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('✅ Schedule loaded');
        
        // Check what buttons are available
        const allButtons = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button')).map(btn => btn.textContent);
        });
        
        console.log('Available buttons:', allButtons.filter(text => text && text.trim()));
        
        // Check page content to understand what we're working with
        const pageText = await page.evaluate(() => document.body.textContent);
        console.log('Page contains shifts:', pageText.includes('Cleaner') || pageText.includes('Front Desk'));
        
        // Look for any save-related button
        const saveButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => {
            const text = button.textContent || '';
            return text.includes('Save') || text.includes('Draft') || text.includes('Publish');
          });
        });
        
        if (saveButton.asElement()) {
          const buttonText = await page.evaluate(btn => btn.textContent, saveButton.asElement());
          console.log(`Found save button: "${buttonText}"`);
          
          // Clear previous requests
          requests.length = 0;
          consoleLogs.length = 0;
          
          // Click the save button
          await saveButton.asElement()?.click();
          
          // Wait for save to complete
          await new Promise(resolve => setTimeout(resolve, 8000));
          
          console.log('\n🔍 SAVE OPERATION ANALYSIS:');
          
          // Filter for shift-related API calls
          const shiftRequests = requests.filter(req => req.url.includes('/shifts'));
          console.log(`Shift-related API calls: ${shiftRequests.length}`);
          
          shiftRequests.forEach((req, index) => {
            console.log(`${index + 1}. ${req.method} ${req.url.split('/api/')[1]}`);
            
            if (req.url.includes('/bulk')) {
              console.log('   🎯 BULK OPERATION DETECTED!');
              if (req.postData) {
                try {
                  const data = JSON.parse(req.postData);
                  if (data.operations) {
                    console.log(`   📦 Operations: ${data.operations.length}`);
                    data.operations.forEach((op, i) => {
                      console.log(`      ${i + 1}. ${op.type} (clientId: ${op.clientId})`);
                    });
                  }
                } catch (e) {
                  console.log('   📦 Bulk data present but could not parse');
                }
              }
            } else {
              console.log('   ⚠️  Individual API call');
            }
          });
          
          // Show relevant console logs
          const relevantLogs = consoleLogs.filter(log => 
            log.includes('BULK') || 
            log.includes('🔥') || 
            log.includes('🚀') || 
            log.includes('operations') ||
            log.includes('save') ||
            log.includes('changes')
          );
          
          if (relevantLogs.length > 0) {
            console.log('\n📱 Relevant Console Logs:');
            relevantLogs.forEach(log => console.log(`   ${log}`));
          }
          
          // Check results
          const bulkCalls = shiftRequests.filter(req => req.url.includes('/bulk')).length;
          const individualCalls = shiftRequests.filter(req => !req.url.includes('/bulk')).length;
          
          console.log('\n📊 RESULTS:');
          console.log(`🎯 Bulk calls: ${bulkCalls}`);
          console.log(`⚠️  Individual calls: ${individualCalls}`);
          
          if (bulkCalls > 0 && individualCalls === 0) {
            console.log('\n🎉 SUCCESS: Using bulk operations!');
          } else if (bulkCalls > 0) {
            console.log('\n⚠️  MIXED: Some bulk, some individual');
          } else if (shiftRequests.length === 0) {
            console.log('\nℹ️  No changes to save');
          } else {
            console.log('\n❌ STILL USING INDIVIDUAL CALLS');
          }
          
        } else {
          console.log('❌ No save button found');
        }
        
      } else {
        console.log('❌ No schedules available');
      }
    } else {
      console.log('❌ Edit button not found');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testExistingSchedule();