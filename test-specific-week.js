const puppeteer = require('puppeteer');

async function testSpecificWeek() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Testing Navigation to Specific Week with Existing Schedule ===');
    
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
      
      // Check what week we're currently viewing
      let pageText = await page.evaluate(() => document.body.textContent);
      console.log('Current week view includes June 23:', pageText.includes('June 23'));
      console.log('Current week view includes June 24:', pageText.includes('June 24'));
      
      // If we're not on the right week, navigate backwards to find June 2025
      let attempts = 0;
      while (!pageText.includes('June 23') && !pageText.includes('June 24') && attempts < 20) {
        console.log(`Attempt ${attempts + 1}: Navigating to previous week...`);
        
        // Click previous week button
        const prevButton = await page.$('button[aria-label="Previous week"], button:has(.lucide-arrow-left)');
        if (prevButton) {
          await prevButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          pageText = await page.evaluate(() => document.body.textContent);
          attempts++;
        } else {
          break;
        }
      }
      
      if (pageText.includes('June 23') || pageText.includes('June 24')) {
        console.log('✅ SUCCESS: Found June 2025 week');
        
        // Check for existing schedule indicators
        if (pageText.includes('Schedule exists:') || pageText.includes('Schedule found for this week')) {
          console.log('✅ SUCCESS: Existing schedule detected and displayed');
          
          if (pageText.includes('Edit Schedule')) {
            console.log('✅ SUCCESS: Button text changed to "Edit Schedule"');
            
            // Test the Edit Schedule functionality
            const editButton = await page.evaluateHandle(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              return buttons.find(button => button.textContent?.includes('Edit Schedule'));
            });
            
            if (editButton.asElement()) {
              console.log('Testing "Edit Schedule" button...');
              await editButton.asElement()?.click();
              await new Promise(resolve => setTimeout(resolve, 5000));
              
              // Check if we're now in the schedule editor with shifts
              const finalPageText = await page.evaluate(() => document.body.textContent);
              
              if (finalPageText.includes('Cleaner') && finalPageText.includes('Front Desk')) {
                console.log('✅ COMPLETE SUCCESS: Edit Schedule opened existing schedule with both shifts visible!');
              } else if (finalPageText.includes('Cleaner') || finalPageText.includes('Front Desk')) {
                console.log('✅ PARTIAL SUCCESS: Edit Schedule opened with at least one shift visible');
              } else {
                console.log('❌ FAILURE: Edit Schedule did not load shifts properly');
              }
            }
          } else {
            console.log('❌ FAILURE: Button text did not change to "Edit Schedule"');
          }
        } else {
          console.log('❌ FAILURE: Existing schedule not detected for June week');
        }
      } else {
        console.log('❌ FAILURE: Could not navigate to June 2025 week');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testSpecificWeek();