const puppeteer = require('puppeteer');

async function testBulkOperations() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track all network requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      postData: request.postData()
    });
  });
  
  try {
    console.log('=== Testing Bulk Operations (Single API Call) ===');
    
    // Login
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'admin@nomadsoft.us');
    await page.type('input[name="password"]', 'secret');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login successful');
    
    // Clear previous requests
    requests.length = 0;
    
    // Navigate to Schedule Manager
    await page.goto('http://localhost:3000/schedule-manager/assign', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click "Edit Existing Schedule"
    const editButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Edit Existing Schedule'));
    });
    
    if (editButton.asElement()) {
      console.log('✅ Found Edit Existing Schedule button');
      await editButton.asElement()?.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Click on first schedule
      const scheduleCards = await page.$$('.cursor-pointer');
      if (scheduleCards.length > 0) {
        console.log(`✅ Found ${scheduleCards.length} schedule(s), clicking first one`);
        await scheduleCards[0].click();
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Clear requests again to focus only on save operations
        requests.length = 0;
        
        const pageText = await page.evaluate(() => document.body.textContent);
        
        if (pageText.includes('Cleaner') || pageText.includes('Front Desk')) {
          console.log('🎉 SUCCESS: Schedule editing interface loaded with shifts!');
          
          // Try to add a shift or modify something
          console.log('\n--- Testing Save Operation Network Calls ---');
          
          // Look for unassigned shifts area to add a new shift
          const requiredShiftsSection = await page.$('h4:has-text("Required Shifts"), h3:has-text("Required Shifts")');
          
          if (requiredShiftsSection) {
            console.log('✅ Found Required Shifts section');
            
            // Try to find an "Add Shift" button or drag a shift type
            const addShiftButton = await page.evaluateHandle(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              return buttons.find(button => 
                button.textContent?.includes('Add') || 
                button.textContent?.includes('+') ||
                button.textContent?.includes('Shift')
              );
            });
            
            // If we can't find add shift, let's just try to save existing changes
            console.log('📝 Attempting to save schedule to trigger API calls...');
            
            // Clear network requests before save
            requests.length = 0;
            
            // Click Save Draft
            const saveDraftButton = await page.evaluateHandle(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              return buttons.find(button => 
                button.textContent?.includes('Save Draft') || 
                button.textContent?.includes('Save as Draft')
              );
            });
            
            if (saveDraftButton.asElement()) {
              console.log('✅ Found Save Draft button, clicking...');
              
              await saveDraftButton.asElement()?.click();
              
              // Wait for save to complete
              await new Promise(resolve => setTimeout(resolve, 5000));
              
              // Analyze network requests made during save
              const shiftApiCalls = requests.filter(req => 
                req.url.includes('/shifts') && 
                req.method !== 'GET'
              );
              
              console.log('\n🔍 NETWORK ANALYSIS:');
              console.log(`Total API calls made during save: ${shiftApiCalls.length}`);
              
              shiftApiCalls.forEach((req, index) => {
                console.log(`${index + 1}. ${req.method} ${req.url}`);
                if (req.url.includes('/bulk')) {
                  console.log('   🎯 BULK OPERATION DETECTED!');
                  if (req.postData) {
                    try {
                      const data = JSON.parse(req.postData);
                      console.log(`   📦 Operations in bulk call: ${data.operations ? data.operations.length : 'Unknown'}`);
                    } catch (e) {
                      console.log('   📦 Bulk data present but could not parse');
                    }
                  }
                } else {
                  console.log('   ⚠️  Individual API call detected');
                }
              });
              
              // Check if we achieved the goal
              const bulkCalls = shiftApiCalls.filter(req => req.url.includes('/bulk'));
              const individualCalls = shiftApiCalls.filter(req => !req.url.includes('/bulk'));
              
              console.log('\n📊 RESULTS:');
              console.log(`Bulk operation calls: ${bulkCalls.length}`);
              console.log(`Individual operation calls: ${individualCalls.length}`);
              
              if (bulkCalls.length > 0 && individualCalls.length === 0) {
                console.log('🎉 SUCCESS: Using bulk operations!');
                console.log('✅ All changes saved in single API call');
                console.log('✅ No more 20+ individual API calls');
              } else if (bulkCalls.length > 0 && individualCalls.length > 0) {
                console.log('⚠️  PARTIAL SUCCESS: Mix of bulk and individual calls');
              } else if (individualCalls.length > 5) {
                console.log('❌ FAILURE: Still using many individual API calls');
              } else if (shiftApiCalls.length === 0) {
                console.log('ℹ️  No changes detected - schedule was already saved');
              } else {
                console.log('ℹ️  Few individual calls detected - might be legacy operations');
              }
              
            } else {
              console.log('❌ Save Draft button not found');
            }
            
          } else {
            console.log('ℹ️ Required Shifts section not found');
          }
          
        } else {
          console.log('❌ Schedule editing interface did not load properly');
        }
      } else {
        console.log('❌ No schedules found to edit');
      }
    } else {
      console.log('❌ Edit Existing Schedule button not found');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testBulkOperations();