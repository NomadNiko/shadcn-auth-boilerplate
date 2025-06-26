const puppeteer = require('puppeteer');

async function testFinalCreateDialog() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Final Test: Create New Schedule Dialog with Current Week ===');
    
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
    
    // Wait for selector dialog
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click "Create New Schedule"
    const createButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Create New Schedule'));
    });
    
    if (createButton.asElement()) {
      console.log('✅ Found "Create New Schedule" button');
      await createButton.asElement()?.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check the current page content
      const pageText = await page.evaluate(() => document.body.textContent);
      
      console.log('Page includes June 23:', pageText.includes('June 23'));
      console.log('Page includes June 24:', pageText.includes('June 24'));
      console.log('Page includes "Schedule exists":', pageText.includes('Schedule exists'));
      console.log('Page includes "Edit Schedule":', pageText.includes('Edit Schedule'));
      
      if (pageText.includes('Schedule exists:') || pageText.includes('Schedule found for this week')) {
        console.log('✅ SUCCESS: Existing schedule detected for current week!');
        
        // Check visual indicators
        const hasOpacity = await page.evaluate(() => {
          return document.querySelector('.opacity-60') !== null;
        });
        console.log('✅ Week display grayed out:', hasOpacity);
        
        // Check button text
        if (pageText.includes('Edit Schedule')) {
          console.log('✅ SUCCESS: Button text changed to "Edit Schedule"');
          
          // Test clicking Edit Schedule
          const editButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(button => button.textContent?.includes('Edit Schedule'));
          });
          
          if (editButton.asElement()) {
            console.log('Testing Edit Schedule button...');
            await editButton.asElement()?.click();
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check if schedule editor loaded with shifts
            const finalPageText = await page.evaluate(() => document.body.textContent);
            
            if (finalPageText.includes('Cleaner') && finalPageText.includes('Front Desk')) {
              console.log('🎉 COMPLETE SUCCESS: Edit Schedule opened with both shifts visible!');
            } else if (finalPageText.includes('Cleaner') || finalPageText.includes('Front Desk')) {
              console.log('✅ PARTIAL SUCCESS: Edit Schedule opened with one shift visible');
              console.log('Contains Cleaner:', finalPageText.includes('Cleaner'));
              console.log('Contains Front Desk:', finalPageText.includes('Front Desk'));
            } else {
              console.log('❌ FAILURE: Edit Schedule did not show shifts');
            }
          }
        } else {
          console.log('❌ FAILURE: Button text did not change to "Edit Schedule"');
        }
      } else {
        console.log('ℹ️ INFO: No existing schedule detected for current week');
        
        if (pageText.includes('Create Schedule')) {
          console.log('✅ Correctly showing "Create Schedule" button for empty week');
        }
      }
      
    } else {
      console.log('❌ Could not find "Create New Schedule" button');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testFinalCreateDialog();