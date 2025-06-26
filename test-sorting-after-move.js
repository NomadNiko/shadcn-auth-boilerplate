const puppeteer = require('puppeteer');

async function testSortingAfterMove() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Testing Sorting After Shift Movement ===\n');
    
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
        
        // Get sorting before move
        const getShiftsByDay = async () => {
          return await page.evaluate(() => {
            const shiftsByDay = {};
            const shifts = Array.from(document.querySelectorAll('.text-xs.p-1.mb-1.rounded.cursor-move'));
            
            shifts.forEach((shift, index) => {
              const text = shift.textContent;
              const parent = shift.closest('[data-day-index]');
              const dayIndex = parent?.getAttribute('data-day-index');
              const isUnassigned = !shift.closest('[data-employee-id]');
              
              const timeMatch = text.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
              const startTime = timeMatch ? timeMatch[1] : 'Unknown';
              const shiftName = text.split(startTime)[0]?.trim();
              
              if (!shiftsByDay[dayIndex]) {
                shiftsByDay[dayIndex] = { assigned: [], unassigned: [] };
              }
              
              const shiftData = {
                index,
                shiftName,
                startTime,
                fullText: text.trim(),
                element: shift
              };
              
              if (isUnassigned) {
                shiftsByDay[dayIndex].unassigned.push(shiftData);
              } else {
                shiftsByDay[dayIndex].assigned.push(shiftData);
              }
            });
            
            return shiftsByDay;
          });
        };
        
        console.log('4. Checking initial sorting...');
        const initialSorting = await getShiftsByDay();
        
        // Check day 0 unassigned shifts
        if (initialSorting['0']?.unassigned?.length > 1) {
          console.log('Day 0 initial unassigned shifts:');
          initialSorting['0'].unassigned.forEach((shift, idx) => {
            console.log(`  ${idx + 1}. ${shift.startTime} - ${shift.shiftName}`);
          });
        }
        
        // Now try to move an assigned shift to unassigned to test sorting
        console.log('\n5. Moving an assigned shift to unassigned...');
        
        // Find an assigned shift to move
        const assignedShifts = await page.$$('[data-employee-id] .text-xs.p-1.mb-1.rounded.cursor-move');
        if (assignedShifts.length > 0) {
          // Click on first assigned shift to select it
          await assignedShifts[0].click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Click on an unassigned day cell to move it there
          const unassignedCells = await page.$$('[data-day-index]:not([data-employee-id])');
          if (unassignedCells.length > 0) {
            // Move to day 0 unassigned
            const targetCell = unassignedCells[0];
            await targetCell.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('6. Checking sorting after movement...');
            const afterMoveSorting = await getShiftsByDay();
            
            // Check if day 0 unassigned shifts are still sorted
            if (afterMoveSorting['0']?.unassigned?.length > 1) {
              console.log('Day 0 unassigned shifts after movement:');
              afterMoveSorting['0'].unassigned.forEach((shift, idx) => {
                console.log(`  ${idx + 1}. ${shift.startTime} - ${shift.shiftName}`);
              });
              
              // Check if sorted by start time
              const startTimes = afterMoveSorting['0'].unassigned.map(s => s.startTime);
              const sortedTimes = [...startTimes].sort();
              const isCorrectlySorted = JSON.stringify(startTimes) === JSON.stringify(sortedTimes);
              
              if (isCorrectlySorted) {
                console.log('✅ Shifts are correctly sorted by start time after movement');
              } else {
                console.log('❌ Shifts are NOT sorted by start time after movement');
                console.log(`  Current order: ${startTimes.join(', ')}`);
                console.log(`  Expected order: ${sortedTimes.join(', ')}`);
              }
            }
            
            // Test drag from shift type palette to ensure sorting works for new shifts too
            console.log('\n7. Testing drag from shift type palette...');
            
            // Find a shift type in the sidebar
            const shiftTypeButtons = await page.$$('.shift-type-item');
            if (shiftTypeButtons.length > 0) {
              // Drag a shift type to unassigned day 1
              const sourceShiftType = shiftTypeButtons[0];
              const targetUnassignedDay = unassignedCells[1]; // Day 1
              
              // Get the bounding boxes
              const sourceBox = await sourceShiftType.boundingBox();
              const targetBox = await targetUnassignedDay.boundingBox();
              
              if (sourceBox && targetBox) {
                // Perform drag and drop
                await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
                await page.mouse.down();
                await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
                await page.mouse.up();
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                console.log('8. Checking sorting after drag from palette...');
                const afterDragSorting = await getShiftsByDay();
                
                // Check if day 1 unassigned shifts are sorted
                if (afterDragSorting['1']?.unassigned?.length > 1) {
                  console.log('Day 1 unassigned shifts after drag from palette:');
                  afterDragSorting['1'].unassigned.forEach((shift, idx) => {
                    console.log(`  ${idx + 1}. ${shift.startTime} - ${shift.shiftName}`);
                  });
                  
                  const startTimes = afterDragSorting['1'].unassigned.map(s => s.startTime);
                  const sortedTimes = [...startTimes].sort();
                  const isCorrectlySorted = JSON.stringify(startTimes) === JSON.stringify(sortedTimes);
                  
                  if (isCorrectlySorted) {
                    console.log('✅ Shifts are correctly sorted by start time after drag from palette');
                  } else {
                    console.log('❌ Shifts are NOT sorted by start time after drag from palette');
                  }
                }
              }
            }
            
          } else {
            console.log('❌ No unassigned cells found');
          }
        } else {
          console.log('❌ No assigned shifts found to move');
        }
        
      } else {
        console.log('❌ No schedule cards found');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await browser.close();
  }
}

testSortingAfterMove();