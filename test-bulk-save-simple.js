const puppeteer = require('puppeteer');

async function testBulkSave() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track all network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    }
  });
  
  try {
    console.log('=== Testing Bulk Save Operations ===');
    
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
        
        console.log('📝 Schedule loaded, testing save operation...');
        
        // Clear requests to focus only on save operations
        requests.length = 0;
        
        // Click Save Draft button
        const saveDraftButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => 
            button.textContent?.includes('Save Draft') || 
            button.textContent?.includes('Save as Draft')
          );
        });
        
        if (saveDraftButton.asElement()) {
          console.log('🔄 Clicking Save Draft...');
          
          await saveDraftButton.asElement()?.click();
          
          // Wait for save to complete
          await new Promise(resolve => setTimeout(resolve, 8000));
          
          // Analyze network requests made during save
          const saveRequests = requests.filter(req => 
            req.url.includes('/shifts') && 
            (req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE')
          );
          
          console.log('\n🔍 SAVE OPERATION ANALYSIS:');
          console.log(`Total save-related API calls: ${saveRequests.length}`);
          
          let bulkCallCount = 0;
          let individualCallCount = 0;
          let bulkOperationCount = 0;
          
          saveRequests.forEach((req, index) => {
            console.log(`${index + 1}. ${req.method} ${req.url.split('/api/')[1]}`);
            
            if (req.url.includes('/bulk')) {
              bulkCallCount++;
              console.log('   🎯 BULK OPERATION!');
              if (req.postData) {
                try {
                  const data = JSON.parse(req.postData);
                  if (data.operations) {
                    bulkOperationCount += data.operations.length;
                    console.log(`   📦 Contains ${data.operations.length} operations:`, 
                      data.operations.map(op => op.type).join(', '));
                  }
                } catch (e) {
                  console.log('   📦 Bulk data present');
                }
              }
            } else {
              individualCallCount++;
              console.log('   ⚠️  Individual call');
            }
          });
          
          console.log('\n📊 FINAL RESULTS:');
          console.log(`🎯 Bulk API calls: ${bulkCallCount}`);
          console.log(`⚠️  Individual API calls: ${individualCallCount}`);
          console.log(`📦 Total operations processed: ${bulkOperationCount}`);
          
          // Success criteria
          if (bulkCallCount > 0 && individualCallCount === 0) {
            console.log('\n🎉 ✅ SUCCESS: Using bulk operations exclusively!');
            console.log('✅ All schedule changes saved in single API call');
            console.log('✅ No more multiple individual API calls');
            
            if (bulkOperationCount > 1) {
              console.log(`✅ Efficiently processed ${bulkOperationCount} operations in one request`);
            }
          } else if (bulkCallCount > 0 && individualCallCount > 0) {
            console.log('\n⚠️  PARTIAL: Mix of bulk and individual calls detected');
            console.log('❌ Still making some individual API calls');
          } else if (individualCallCount > 0) {
            console.log('\n❌ FAILURE: Still using individual API calls');
            console.log('❌ Bulk operations not implemented correctly');
          } else if (saveRequests.length === 0) {
            console.log('\nℹ️  No save operations detected');
            console.log('   (Schedule may already be up to date)');
          }
          
          // Test console output for debugging
          const consoleLogs = [];
          page.on('console', msg => {
            if (msg.text().includes('BULK') || msg.text().includes('🔥') || msg.text().includes('🚀')) {
              consoleLogs.push(msg.text());
            }
          });
          
          if (consoleLogs.length > 0) {
            console.log('\n📝 Console logs from bulk save:');
            consoleLogs.forEach(log => console.log(`   ${log}`));
          }
          
        } else {
          console.log('❌ Save Draft button not found');
        }
      } else {
        console.log('❌ No schedules found');
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

testBulkSave();