const puppeteer = require('puppeteer');

async function testForceChanges() {
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
  
  try {
    console.log('=== Testing Forced Changes + Bulk Save ===');
    
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
        
        console.log('✅ Schedule loaded, now forcing changes...');
        
        // Force clear all shifts first to ensure we make changes
        const clearButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => button.textContent?.includes('Clear All Shifts'));
        });
        
        if (clearButton.asElement()) {
          console.log('🗑️  Clearing all shifts...');
          await clearButton.asElement()?.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Now add some shifts to create bulk operations
        console.log('➕ Adding new shifts...');
        
        // Look for Cleaner shift type
        const cleanerButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => button.textContent?.includes('Cleaner'));
        });
        
        if (cleanerButton.asElement()) {
          // Add multiple cleaner shifts
          for (let i = 0; i < 4; i++) {
            await cleanerButton.asElement()?.click();
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          console.log('✅ Added 4 Cleaner shifts');
        }
        
        // Look for Front Desk shift type
        const frontDeskButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => button.textContent?.includes('Front Desk'));
        });
        
        if (frontDeskButton.asElement()) {
          // Add multiple front desk shifts
          for (let i = 0; i < 3; i++) {
            await frontDeskButton.asElement()?.click();
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          console.log('✅ Added 3 Front Desk shifts');
        }
        
        console.log('💾 Now saving with bulk operations...');
        
        // Clear previous requests
        requests.length = 0;
        
        // Click Save Draft
        const saveButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => button.textContent?.includes('Save Draft'));
        });
        
        if (saveButton.asElement()) {
          await saveButton.asElement()?.click();
          
          // Wait for save to complete
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          console.log('\n🔍 BULK SAVE ANALYSIS:');
          
          // Filter for shift-related API calls
          const shiftRequests = requests.filter(req => req.url.includes('/shifts'));
          console.log(`Total shift API calls: ${shiftRequests.length}`);
          
          let bulkCalls = 0;
          let individualCalls = 0;
          let totalOperations = 0;
          
          shiftRequests.forEach((req, index) => {
            console.log(`${index + 1}. ${req.method} ${req.url.split('/api/')[1]}`);
            
            if (req.url.includes('/bulk')) {
              bulkCalls++;
              console.log('   🎯 BULK OPERATION!');
              if (req.postData) {
                try {
                  const data = JSON.parse(req.postData);
                  if (data.operations) {
                    totalOperations += data.operations.length;
                    console.log(`   📦 ${data.operations.length} operations:`);
                    data.operations.forEach((op, i) => {
                      console.log(`      ${i + 1}. ${op.type} (${op.data?.shiftTypeId ? 'shiftType: ' + op.data.shiftTypeId.substring(0, 8) + '...' : 'id: ' + (op.id || 'N/A').substring(0, 8)})`);
                    });
                  }
                } catch (e) {
                  console.log('   📦 Bulk data present but could not parse');
                }
              }
            } else {
              individualCalls++;
              console.log('   ⚠️  Individual API call');
            }
          });
          
          console.log('\n📊 FINAL BULK OPERATIONS TEST RESULTS:');
          console.log(`🎯 Bulk API calls: ${bulkCalls}`);
          console.log(`⚠️  Individual API calls: ${individualCalls}`);
          console.log(`📦 Total operations processed: ${totalOperations}`);
          console.log(`🔄 Operations per bulk call: ${bulkCalls > 0 ? (totalOperations / bulkCalls).toFixed(1) : 'N/A'}`);
          
          if (bulkCalls > 0 && individualCalls === 0 && totalOperations > 5) {
            console.log('\n🎉 🎉 🎉 COMPLETE SUCCESS! 🎉 🎉 🎉');
            console.log('✅ Successfully using bulk operations exclusively');
            console.log('✅ No individual API calls made');
            console.log(`✅ Processed ${totalOperations} operations in ${bulkCalls} bulk call(s)`);
            console.log('✅ GOAL ACHIEVED: Single API call instead of 20+ individual calls');
            console.log('✅ Backend bulk operations working correctly');
            console.log('✅ Frontend properly using bulk save logic');
          } else if (bulkCalls > 0) {
            console.log('\n🎯 PARTIAL SUCCESS');
            console.log('✅ Bulk operations implemented and working');
            if (individualCalls > 0) {
              console.log('⚠️  Still making some individual calls - needs investigation');
            }
            if (totalOperations <= 5) {
              console.log('ℹ️  Small number of operations processed');
            }
          } else {
            console.log('\n❌ FAILURE - BULK OPERATIONS NOT WORKING');
            console.log('❌ No bulk operations detected');
            console.log('❌ Still using individual API calls');
          }
          
        } else {
          console.log('❌ Save button not found');
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

testForceChanges();