const puppeteer = require('puppeteer');

async function testShiftSorting() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Testing Shift Sorting by Start Time ===\n');
    
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
        
        // Test current sorting
        console.log('4. Checking shift sorting in unassigned shifts...');
        
        // Get all shifts and their start times
        const shiftData = await page.evaluate(() => {
          const shifts = Array.from(document.querySelectorAll('.text-xs.p-1.mb-1.rounded.cursor-move'));
          return shifts.map((shift, index) => {
            const text = shift.textContent;
            const parent = shift.closest('[data-day-index]');
            const dayIndex = parent?.getAttribute('data-day-index');
            const isUnassigned = !shift.closest('[data-employee-id]');
            
            // Extract shift type name and time from text
            const timeMatch = text.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
            const startTime = timeMatch ? timeMatch[1] : 'Unknown';
            
            return {
              index,
              text: text.trim(),
              startTime,
              dayIndex,
              isUnassigned,
              order: index // Visual order in DOM
            };
          });
        });
        
        console.log('Found shifts:', shiftData);
        
        // Group by day and check if unassigned shifts are sorted by start time
        const shiftsByDay = {};
        shiftData.forEach(shift => {
          if (!shiftsByDay[shift.dayIndex]) {
            shiftsByDay[shift.dayIndex] = { assigned: [], unassigned: [] };
          }
          
          if (shift.isUnassigned) {
            shiftsByDay[shift.dayIndex].unassigned.push(shift);
          } else {
            shiftsByDay[shift.dayIndex].assigned.push(shift);
          }
        });
        
        console.log('\n5. Checking sorting by day:');
        
        Object.keys(shiftsByDay).forEach(dayIndex => {
          const day = shiftsByDay[dayIndex];
          
          if (day.unassigned.length > 1) {
            console.log(`\nDay ${dayIndex} - Unassigned shifts:`);
            day.unassigned.forEach((shift, idx) => {
              console.log(`  ${idx + 1}. ${shift.startTime} - ${shift.text.split(shift.startTime)[0]?.trim()}`);
            });
            
            // Check if sorted by start time
            const startTimes = day.unassigned.map(s => s.startTime);
            const sortedTimes = [...startTimes].sort();
            const isCorrectlySorted = JSON.stringify(startTimes) === JSON.stringify(sortedTimes);
            
            if (isCorrectlySorted) {
              console.log(`  ✅ Day ${dayIndex} unassigned shifts are correctly sorted by start time`);
            } else {
              console.log(`  ❌ Day ${dayIndex} unassigned shifts are NOT sorted by start time`);
              console.log(`    Current order: ${startTimes.join(', ')}`);
              console.log(`    Expected order: ${sortedTimes.join(', ')}`);
            }
          }
          
          if (day.assigned.length > 1) {
            console.log(`\nDay ${dayIndex} - Assigned shifts:`);
            day.assigned.forEach((shift, idx) => {
              console.log(`  ${idx + 1}. ${shift.startTime} - ${shift.text.split(shift.startTime)[0]?.trim()}`);
            });
            
            // Check if sorted by start time
            const startTimes = day.assigned.map(s => s.startTime);
            const sortedTimes = [...startTimes].sort();
            const isCorrectlySorted = JSON.stringify(startTimes) === JSON.stringify(sortedTimes);
            
            if (isCorrectlySorted) {
              console.log(`  ✅ Day ${dayIndex} assigned shifts are correctly sorted by start time`);
            } else {
              console.log(`  ❌ Day ${dayIndex} assigned shifts are NOT sorted by start time`);
              console.log(`    Current order: ${startTimes.join(', ')}`);
              console.log(`    Expected order: ${sortedTimes.join(', ')}`);
            }
          }
        });
        
      } else {
        console.log('❌ No schedule cards found');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Keep browser open for inspection
    await browser.close();
  }
}

testShiftSorting();