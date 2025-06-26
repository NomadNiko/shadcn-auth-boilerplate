const puppeteer = require('puppeteer');

async function testDropZoneEffects() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Testing Enhanced Drop Zone Effects ===\n');
    
    // Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'admin@nomadsoft.us');
    await page.type('input[name="password"]', 'secret');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login successful\n');
    
    // Navigate to Schedule Manager
    console.log('2. Navigating to Schedule Manager...');
    await page.goto('http://localhost:3000/schedule-manager/assign', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click Edit Existing Schedule
    console.log('3. Selecting existing schedule...');
    const editButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Edit Existing Schedule'));
    });
    
    if (editButton.asElement()) {
      await editButton.asElement()?.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click on first schedule
      const scheduleCards = await page.$$('.cursor-pointer');
      if (scheduleCards.length > 0) {
        await scheduleCards[0].click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Schedule loaded\n');
        
        console.log('4. Testing drop zone visual effects...');
        console.log('   (You should see dramatic color changes and borders when dragging items over drop zones)');
        console.log('   - Employee day cells: Green background with green border');
        console.log('   - Unassigned day cells: Blue background with blue border'); 
        console.log('   - Employee sidebar items: Purple background with purple border');
        console.log('   - All drop zones include shadows and slight scaling effects');
        
        // Test instructions for manual verification
        console.log('\n5. Manual test instructions:');
        console.log('   a) Try dragging a shift type from the left panel over employee day cells');
        console.log('   b) Try dragging an existing shift over different day cells');
        console.log('   c) Try dragging a shift over employee items in the sidebar');
        console.log('   d) Observe the dramatic color changes, borders, shadows, and scaling');
        
        // Keep browser open for manual testing
        console.log('\n⏳ Browser will stay open for 30 seconds for manual testing...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
      } else {
        console.log('❌ No schedule cards found');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testDropZoneEffects();