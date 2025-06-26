const puppeteer = require('puppeteer');

async function testManualNavigation() {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 500  // Slow down for visibility
  });
  const page = await browser.newPage();
  
  try {
    console.log('=== Manual Navigation Test ===');
    
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
      console.log('✅ Clicking "Create New Schedule"');
      await createButton.asElement()?.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check initial week
      let pageText = await page.evaluate(() => document.body.textContent);
      console.log('Initial week contains June:', pageText.includes('June'));
      console.log('Initial week contains July:', pageText.includes('July'));
      
      // Try to find the right arrow button using different selectors
      console.log('Looking for navigation buttons...');
      
      // Try multiple selectors for the next button
      const nextSelectors = [
        'button[aria-label="Next week"]',
        'button svg[data-lucide="arrow-right"]',
        'button:has(svg[data-lucide="arrow-right"])',
        'button svg.lucide-arrow-right'
      ];
      
      let clickedNext = false;
      for (const selector of nextSelectors) {
        try {
          const nextButton = await page.$(selector);
          if (nextButton) {
            console.log(`Found next button with selector: ${selector}`);
            for (let i = 0; i < 3; i++) {
              await nextButton.click();
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              pageText = await page.evaluate(() => document.body.textContent);
              console.log(`After click ${i + 1}: July detected:`, pageText.includes('July'));
              
              if (pageText.includes('July')) {
                console.log('✅ Successfully navigated to July week!');
                clickedNext = true;
                break;
              }
            }
            break;
          }
        } catch (e) {
          console.log(`Selector ${selector} failed:`, e.message);
        }
      }
      
      if (!clickedNext) {
        console.log('⚠️ Could not find next button, trying manual approach...');
        
        // Get all buttons and look for one with arrow icon
        const allButtons = await page.$$('button');
        console.log(`Found ${allButtons.length} buttons on page`);
        
        for (let i = 0; i < allButtons.length; i++) {
          const buttonText = await page.evaluate(btn => btn.textContent, allButtons[i]);
          const hasArrow = await page.evaluate(btn => {
            const svg = btn.querySelector('svg');
            return svg && (svg.outerHTML.includes('arrow-right') || svg.outerHTML.includes('ArrowRight'));
          }, allButtons[i]);
          
          if (hasArrow) {
            console.log(`Button ${i} has arrow, clicking...`);
            await allButtons[i].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            pageText = await page.evaluate(() => document.body.textContent);
            if (pageText.includes('July')) {
              console.log('✅ Found July week via manual button search!');
              clickedNext = true;
              break;
            }
          }
        }
      }
      
      // Check final state
      pageText = await page.evaluate(() => document.body.textContent);
      
      if (pageText.includes('Schedule exists:') || pageText.includes('Schedule found for this week')) {
        console.log('🎉 SUCCESS: Existing schedule detected!');
        
        if (pageText.includes('Edit Schedule')) {
          console.log('🎉 SUCCESS: Button changed to "Edit Schedule"!');
          console.log('✨ Create New Schedule dialog feature is working correctly!');
        }
      } else if (pageText.includes('July')) {
        console.log('✅ In July week but no schedule detected (might be different July week)');
      } else {
        console.log('ℹ️ Still in original week - navigation may not have worked');
      }
      
      console.log('\nPage content sample:', pageText.substring(0, 200));
      
    } else {
      console.log('❌ Could not find Create New Schedule button');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testManualNavigation();