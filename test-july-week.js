const puppeteer = require('puppeteer');

async function testJulyWeek() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Testing July Week with Existing Schedule ===');
    
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
    
    // Click "Create New Schedule"
    const createButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Create New Schedule'));
    });
    
    if (createButton.asElement()) {
      console.log('✅ Found "Create New Schedule" button');
      await createButton.asElement()?.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Navigate forward to July week (about 2 weeks from current June week)
      console.log('Navigating to July week...');
      for (let i = 0; i < 3; i++) {
        const nextButton = await page.$('button[aria-label="Next week"], button svg[aria-hidden="true"] + .lucide-arrow-right')
          || await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(button => {
              const svg = button.querySelector('svg');
              return svg && (svg.innerHTML.includes('arrow-right') || button.getAttribute('aria-label') === 'Next week');
            });
          });
        
        if (nextButton.asElement?.()) {
          await nextButton.asElement().click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const pageText = await page.evaluate(() => document.body.textContent);
          console.log(`Week ${i + 1}: Contains July 7:`, pageText.includes('July 7'));
          console.log(`Week ${i + 1}: Contains July 8:`, pageText.includes('July 8'));
          
          if (pageText.includes('July 7') || pageText.includes('July 8')) {
            console.log('✅ Found July week!');
            break;
          }
        }
      }
      
      // Check current week for existing schedule
      const pageText = await page.evaluate(() => document.body.textContent);
      
      if (pageText.includes('Schedule exists:') || pageText.includes('Schedule found for this week')) {
        console.log('🎉 SUCCESS: Existing schedule detected for July week!');
        
        // Check all the expected features
        const hasOpacity = await page.evaluate(() => {
          return document.querySelector('.opacity-60') !== null;
        });
        console.log('✅ Week display grayed out:', hasOpacity);
        
        if (pageText.includes('Edit Schedule')) {
          console.log('✅ SUCCESS: Button text changed to "Edit Schedule"');
          
          // Test the Edit Schedule button
          const editButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(button => button.textContent?.includes('Edit Schedule'));
          });
          
          if (editButton.asElement()) {
            console.log('Testing Edit Schedule functionality...');
            await editButton.asElement()?.click();
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check if schedule editor loaded
            const finalPageText = await page.evaluate(() => document.body.textContent);
            
            if (finalPageText.includes('Cleaner') && finalPageText.includes('Front Desk')) {
              console.log('🎉 COMPLETE SUCCESS: Edit Schedule opened with both shifts visible!');
              console.log('✨ The Create New Schedule dialog feature is working perfectly!');
            } else if (finalPageText.includes('Cleaner') || finalPageText.includes('Front Desk')) {
              console.log('✅ PARTIAL SUCCESS: Edit Schedule opened with shifts');
            } else {
              console.log('❌ Edit Schedule did not load shifts properly');
            }
          }
        } else {
          console.log('❌ Button text did not change to "Edit Schedule"');
        }
      } else {
        console.log('❌ No existing schedule detected for July week');
        console.log('Page content preview:', pageText.substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testJulyWeek();