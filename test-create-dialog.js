const puppeteer = require('puppeteer');

async function testCreateDialog() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Testing Create New Schedule Dialog Improvements ===');
    
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
      
      // Check if we're on the week that has an existing schedule
      const pageText = await page.evaluate(() => document.body.textContent);
      
      if (pageText.includes('Schedule exists:') || pageText.includes('Schedule found for this week')) {
        console.log('✅ SUCCESS: Existing schedule detected and displayed');
        
        // Check if button text changed to "Edit Schedule"
        if (pageText.includes('Edit Schedule')) {
          console.log('✅ SUCCESS: Button text changed to "Edit Schedule"');
          
          // Check if week display is grayed out
          const hasOpacity = await page.evaluate(() => {
            const elements = document.querySelectorAll('.opacity-60');
            return elements.length > 0;
          });
          
          if (hasOpacity) {
            console.log('✅ SUCCESS: Week display is grayed out for existing schedule');
          } else {
            console.log('⚠️ Week display graying might need adjustment');
          }
          
          // Test clicking the "Edit Schedule" button
          console.log('Testing "Edit Schedule" button...');
          const editButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(button => button.textContent?.includes('Edit Schedule'));
          });
          
          if (editButton.asElement()) {
            await editButton.asElement()?.click();
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check if we're now in the schedule editor with shifts
            const finalPageText = await page.evaluate(() => document.body.textContent);
            
            if (finalPageText.includes('Cleaner') || finalPageText.includes('Front Desk')) {
              console.log('✅ SUCCESS: "Edit Schedule" opened the existing schedule with shifts!');
            } else {
              console.log('❌ FAILURE: "Edit Schedule" did not load the schedule properly');
            }
          }
          
        } else {
          console.log('❌ FAILURE: Button text did not change to "Edit Schedule"');
        }
      } else {
        console.log('ℹ️ INFO: Currently viewing a week without existing schedule');
        
        // Navigate to the week with existing schedule (June 23-29, 2025)
        console.log('Navigating to find week with existing schedule...');
        // Since the existing schedule is for June 23-29, 2025, we might need to navigate
        // This would require more complex date navigation logic
      }
      
    } else {
      console.log('❌ FAILURE: Could not find "Create New Schedule" button');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testCreateDialog();