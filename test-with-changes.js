const puppeteer = require('puppeteer');

async function testWithChanges() {
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
    if (text.includes('BULK') || text.includes('🔥') || text.includes('🚀') || text.includes('API CALL')) {
      consoleLogs.push(text);
    }
  });
  
  try {
    console.log('=== Testing Schedule Changes + Bulk Save ===');
    
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
    
    // Create a new schedule to ensure we have something to modify
    const createButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Create New Schedule'));
    });
    
    if (createButton.asElement()) {
      console.log('📝 Creating new schedule for testing...');
      await createButton.asElement()?.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Click create schedule for current week
      const createWeekButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button => button.textContent?.includes('Create Schedule'));
      });
      
      if (createWeekButton.asElement()) {
        await createWeekButton.asElement()?.click();
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('✅ New schedule created, now testing modifications...');
        
        // Try to add some shifts by looking for shift type buttons
        const shiftTypeButtons = await page.$$('button');
        let foundCleanerButton = null;
        
        for (let button of shiftTypeButtons) {
          const text = await page.evaluate(btn => btn.textContent, button);
          if (text && text.includes('Cleaner')) {
            foundCleanerButton = button;
            break;
          }
        }
        
        if (foundCleanerButton) {
          console.log('🧹 Found Cleaner shift type, adding shifts...');
          
          // Add multiple shifts to create bulk operations
          for (let i = 0; i < 3; i++) {
            await foundCleanerButton.click();
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          console.log('✅ Added 3 Cleaner shifts');
        }
        
        // Look for Front Desk button too
        let foundFrontDeskButton = null;
        for (let button of shiftTypeButtons) {
          const text = await page.evaluate(btn => btn.textContent, button);
          if (text && text.includes('Front Desk')) {
            foundFrontDeskButton = button;
            break;
          }
        }
        
        if (foundFrontDeskButton) {
          console.log('🏢 Found Front Desk shift type, adding shifts...');
          
          for (let i = 0; i < 2; i++) {
            await foundFrontDeskButton.click();
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          console.log('✅ Added 2 Front Desk shifts');
        }
        
        // Clear previous requests
        requests.length = 0;
        consoleLogs.length = 0;
        
        console.log('\n💾 Now saving changes with bulk operations...');
        
        // Save the changes
        const saveDraftButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => 
            button.textContent?.includes('Save Draft')
          );
        });
        
        if (saveDraftButton.asElement()) {
          await saveDraftButton.asElement()?.click();
          
          // Wait for save operations to complete
          await new Promise(resolve => setTimeout(resolve, 8000));
          
          console.log('\n🔍 SAVE OPERATION RESULTS:');
          console.log(`Total API calls made: ${requests.length}`);
          
          let bulkCalls = 0;
          let individualCalls = 0;
          let totalOperations = 0;
          
          requests.forEach((req, index) => {
            console.log(`${index + 1}. ${req.method} ${req.url.split('/api/')[1]}`);
            
            if (req.url.includes('/bulk')) {
              bulkCalls++;
              console.log('   🎯 BULK OPERATION');
              if (req.postData) {
                try {
                  const data = JSON.parse(req.postData);
                  if (data.operations) {
                    totalOperations += data.operations.length;
                    console.log(`   📦 ${data.operations.length} operations:`, 
                      data.operations.map(op => `${op.type}(${op.data?.shiftTypeId || op.id})`).join(', '));
                  }
                } catch (e) {
                  console.log('   📦 Bulk data present');
                }
              }
            } else {
              individualCalls++;
              console.log('   ⚠️  Individual call');
            }
          });
          
          // Show console logs from frontend
          if (consoleLogs.length > 0) {
            console.log('\n📱 Frontend Console Logs:');
            consoleLogs.forEach(log => console.log(`   ${log}`));
          }
          
          console.log('\n📊 BULK OPERATIONS TEST RESULTS:');
          console.log(`🎯 Bulk API calls: ${bulkCalls}`);
          console.log(`⚠️  Individual API calls: ${individualCalls}`);
          console.log(`📦 Total operations in bulk: ${totalOperations}`);
          
          if (bulkCalls > 0 && individualCalls === 0) {
            console.log('\n🎉 ✅ PERFECT SUCCESS!');
            console.log('✅ Using bulk operations exclusively');
            console.log('✅ No individual API calls made');
            console.log(`✅ ${totalOperations} operations processed in ${bulkCalls} bulk call(s)`);
            console.log('✅ Achieved the goal: Single API call instead of 20+ calls');
          } else if (bulkCalls > 0) {
            console.log('\n⚠️  PARTIAL SUCCESS');
            console.log('✅ Bulk operations implemented');
            console.log('❌ Still making some individual calls');
          } else {
            console.log('\n❌ FAILURE');
            console.log('❌ No bulk operations detected');
            console.log('❌ Still using individual API calls');
          }
          
        } else {
          console.log('❌ Save Draft button not found');
        }
        
      } else {
        console.log('❌ Create Schedule button not found');
      }
    } else {
      console.log('❌ Create New Schedule button not found');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testWithChanges();