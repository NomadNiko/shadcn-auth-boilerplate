const puppeteer = require('puppeteer');

async function testScheduleDisplay() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track console logs with detailed output
  page.on('console', async msg => {
    const text = msg.text();
    if (text.includes('[useScheduleData]') || text.includes('Schedule selected') || text.includes('Initialized local state') || text.includes('[AssignPage]') || text.includes('[useScheduleEdit]')) {
      console.log('Browser console:', text);
      
      // For logs with JSHandle objects, try to extract the actual values
      if (text.includes('JSHandle@') && msg.args().length > 1) {
        try {
          const logValue = await msg.args()[1].jsonValue();
          console.log('  -> Actual value:', JSON.stringify(logValue, null, 2));
        } catch (e) {
          // Ignore if we can't extract the value
        }
      }
    }
  });
  
  // Track errors
  page.on('error', err => {
    console.error('Page error:', err);
  });
  
  page.on('pageerror', err => {
    console.error('Page error:', err);
  });
  
  try {
    console.log('=== Testing Schedule Display ===\n');
    
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
    
    // Check what's displayed
    console.log('3. Checking initial display...');
    const pageContent = await page.content();
    
    // Check if we see the initial menu
    const hasEditButton = pageContent.includes('Edit Existing Schedule');
    const hasCreateButton = pageContent.includes('Create New Schedule');
    
    if (hasEditButton && hasCreateButton) {
      console.log('✅ Initial menu displayed correctly\n');
      
      // Click Edit Existing Schedule
      console.log('4. Clicking "Edit Existing Schedule"...');
      const editButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(button => button.textContent?.includes('Edit Existing Schedule'));
      });
      
      if (editButton.asElement()) {
        await editButton.asElement()?.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if schedules are loaded
        console.log('5. Checking if schedules are displayed...');
        const scheduleCards = await page.$$('.cursor-pointer');
        console.log(`Found ${scheduleCards.length} schedule cards`);
        
        if (scheduleCards.length > 0) {
          console.log('✅ Schedules are displayed\n');
          
          // Click on first schedule
          console.log('6. Clicking on first schedule...');
          await scheduleCards[0].click();
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Check if schedule data is loaded
          console.log('7. Checking if schedule data is displayed...');
          const calendarGrid = await page.$('.grid-cols-8');
          
          // Check for shift types in the sidebar
          const sidebarShiftTypes = await page.evaluate(() => {
            const elements = document.querySelectorAll('.cursor-move');
            return elements.length;
          });
          
          // Check for employee rows
          const employeeElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('.bg-primary.rounded-full');
            return elements.length;
          });
          
          console.log(`\n📊 Schedule Display Status:`);
          console.log(`- Calendar grid present: ${calendarGrid ? 'Yes' : 'No'}`);
          console.log(`- Shift types available: ${sidebarShiftTypes}`);
          console.log(`- Employee elements: ${employeeElements}`);
          
          // Check for specific UI elements
          const hasCalendarHeader = await page.$eval('body', body => body.textContent?.includes('Mon') && body.textContent?.includes('Sun'));
          const hasRequiredShifts = await page.$eval('body', body => body.textContent?.includes('Required Shifts'));
          const hasSaveButton = await page.$eval('body', body => body.textContent?.includes('Save Draft'));
          
          console.log(`- Calendar header (Mon-Sun): ${hasCalendarHeader ? 'Yes' : 'No'}`);
          console.log(`- Required Shifts row: ${hasRequiredShifts ? 'Yes' : 'No'}`);
          console.log(`- Save buttons: ${hasSaveButton ? 'Yes' : 'No'}`);
          
          // Check sidebar content
          const sidebarContent = await page.evaluate(() => {
            const sidebar = document.querySelector('.col-span-3');
            if (!sidebar) return 'No sidebar found';
            const hasAvailableShifts = sidebar.textContent?.includes('Available Shifts');
            const hasEmployees = sidebar.textContent?.includes('Employees');
            return { hasAvailableShifts, hasEmployees };
          });
          console.log(`- Sidebar content:`, sidebarContent);
          
          // Check for actual shifts in the calendar
          const shiftsInCalendar = await page.evaluate(() => {
            // Look for shift elements - they have specific colors and text
            const shiftElements = document.querySelectorAll('.text-xs.p-1.mb-1.rounded.cursor-move');
            const requiredShifts = document.querySelectorAll('[class*="bg-shift-"]');
            const employeeNames = Array.from(document.querySelectorAll('.bg-primary.rounded-full')).map(el => 
              el.nextElementSibling?.textContent || ''
            );
            return {
              shiftElements: shiftElements.length,
              requiredShifts: requiredShifts.length,
              employeeNames,
              hasNoUsersAssigned: document.body.textContent?.includes('No users assigned shifts')
            };
          });
          console.log(`- Shifts in calendar:`, shiftsInCalendar);
          
          if (!calendarGrid || sidebarShiftTypes === 0) {
            console.log('\n❌ ISSUE: Schedule data not displaying properly');
            
            // Get any error messages
            const errorText = await page.$eval('body', body => {
              const errorEl = body.querySelector('.text-destructive');
              return errorEl ? errorEl.textContent : null;
            });
            
            if (errorText) {
              console.log('Error message found:', errorText);
            }
          } else {
            console.log('\n✅ Schedule data is displaying correctly');
          }
          
        } else {
          console.log('❌ No schedules found in the list');
        }
      }
    } else {
      console.log('❌ Initial menu not displayed correctly');
      console.log('Page contains:', {
        hasEditButton,
        hasCreateButton
      });
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Keep browser open for inspection
    await browser.close();
  }
}

testScheduleDisplay();