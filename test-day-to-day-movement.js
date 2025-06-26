const puppeteer = require('puppeteer');

async function testDayToDayMovement() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track console logs and network requests
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('save') || text.includes('bulk') || text.includes('change') || text.includes('init') || text.includes('move') || text.includes('click')) {
      console.log('Browser console:', text);
    }
  });
  
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  try {
    console.log('=== Testing Day-to-Day Shift Movement ===\n');
    
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
        
        // Test day-to-day movement
        console.log('4. Testing day-to-day shift movement...');
        
        // Find existing shifts and their current day positions
        const shiftsWithDayInfo = await page.evaluate(() => {
          const shifts = Array.from(document.querySelectorAll('.text-xs.p-1.mb-1.rounded.cursor-move'));
          return shifts.map((shift, index) => {
            const parentCell = shift.closest('[data-day-index]');
            const employeeCell = shift.closest('[data-employee-id]');
            return {
              index,
              text: shift.textContent.trim(),
              dayIndex: parentCell?.getAttribute('data-day-index'),
              employeeId: employeeCell?.getAttribute('data-employee-id'),
              isUnassigned: !employeeCell
            };
          });
        });
        
        console.log('Found shifts with day info:', shiftsWithDayInfo);
        
        if (shiftsWithDayInfo.length > 0) {
          const shiftToMove = shiftsWithDayInfo[0];
          console.log(`\n4a. Selected shift to move:`, shiftToMove);
          
          // Click on the shift to select it
          console.log('4b. Clicking on shift to select it...');
          const shifts = await page.$$('.text-xs.p-1.mb-1.rounded.cursor-move');
          await shifts[shiftToMove.index].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify selection (yellow border)
          const selectedShift = await page.$('.ring-4.ring-yellow-400');
          if (selectedShift) {
            console.log('✅ Shift selected successfully (yellow border visible)');
            
            // Find cells on different days - get all day cells and pick different ones
            console.log(`4c. Looking for day cells to move shift between days...`);
            
            // Get all available day cells (both employee and unassigned)
            const allDayCells = await page.evaluate(() => {
              const cells = Array.from(document.querySelectorAll('[data-day-index]'));
              return cells.map((cell, index) => ({
                index,
                dayIndex: cell.getAttribute('data-day-index'),
                employeeId: cell.getAttribute('data-employee-id') || 'unassigned',
                isUnassigned: !cell.getAttribute('data-employee-id')
              }));
            });
            
            console.log(`Found ${allDayCells.length} total day cells:`, allDayCells.slice(0, 5)); // Show first 5
            
            // Pick two different day indices for testing
            const availableDays = [...new Set(allDayCells.map(cell => cell.dayIndex))];
            console.log('Available days:', availableDays);
            
            if (availableDays.length >= 2) {
              const sourceDayIndex = availableDays[0];
              const targetDayIndex = availableDays[1];
              
              console.log(`4d. Will move shift from day ${sourceDayIndex} to day ${targetDayIndex}...`);
              
              // First, move to source day if not already there
              const sourceCells = await page.$$(`[data-day-index="${sourceDayIndex}"]`);
              if (sourceCells.length > 0) {
                console.log(`Moving to source day ${sourceDayIndex} first...`);
                await sourceCells[0].click();
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
              // Then move to target day
              const targetCells = await page.$$(`[data-day-index="${targetDayIndex}"]`);
              console.log(`Found ${targetCells.length} cells on target day ${targetDayIndex}`);
              
              if (targetCells.length > 0) {
                // Record shift count BEFORE move
                const beforeMoveCount = await page.evaluate(() => {
                  return document.querySelectorAll('.text-xs.p-1.mb-1.rounded.cursor-move').length;
                });
                console.log(`Shift count before move: ${beforeMoveCount}`);
                
                // Click on target cell to move the shift
                console.log(`Moving shift to target day ${targetDayIndex}...`);
                await targetCells[0].click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Record shift count AFTER move
                const afterMoveCount = await page.evaluate(() => {
                  return document.querySelectorAll('.text-xs.p-1.mb-1.rounded.cursor-move').length;
                });
                console.log(`Shift count after move: ${afterMoveCount}`);
                
                if (afterMoveCount > beforeMoveCount) {
                  console.log('❌ DUPLICATE CREATED! Shift was copied instead of moved');
                } else if (afterMoveCount === beforeMoveCount) {
                  console.log('✅ Shift count unchanged - likely moved correctly');
                } else {
                  console.log('⚠️ Shift count decreased - unexpected');
                }
                
                // Check if shift actually moved to the target day
                const shiftsAfterMove = await page.evaluate(() => {
                  const shifts = Array.from(document.querySelectorAll('.text-xs.p-1.mb-1.rounded.cursor-move'));
                  return shifts.map(shift => {
                    const parentCell = shift.closest('[data-day-index]');
                    const employeeCell = shift.closest('[data-employee-id]');
                    return {
                      text: shift.textContent.trim(),
                      dayIndex: parentCell?.getAttribute('data-day-index'),
                      employeeId: employeeCell?.getAttribute('data-employee-id')
                    };
                  });
                });
                
                console.log('\nShifts after movement:', shiftsAfterMove);
                
                // Check if our moved shift is now on the target day
                const movedShift = shiftsAfterMove.find(s => 
                  s.text === shiftToMove.text && 
                  s.dayIndex === targetDayIndex
                );
                
                if (movedShift) {
                  console.log('✅ Shift successfully moved to target day');
                } else {
                  console.log('❌ Shift not found on target day');
                }
                
              } else {
                console.log('❌ No target cells found on target day');
              }
            } else {
              console.log('❌ Need at least 2 different days to test movement');
            }
            
          } else {
            console.log('❌ Shift selection not working (no yellow border)');
          }
        } else {
          console.log('❌ No shifts found to test movement');
        }
        
        // Test saving the changes
        console.log('\n5. Testing save after day-to-day movement...');
        
        // Clear request log
        requests.length = 0;
        
        // Get state before save
        const beforeSaveState = await page.evaluate(() => {
          const shifts = Array.from(document.querySelectorAll('.text-xs.p-1.mb-1.rounded.cursor-move'));
          return {
            count: shifts.length,
            shifts: shifts.map(shift => {
              const parentCell = shift.closest('[data-day-index]');
              const employeeCell = shift.closest('[data-employee-id]');
              return {
                text: shift.textContent.trim(),
                dayIndex: parentCell?.getAttribute('data-day-index'),
                employeeId: employeeCell?.getAttribute('data-employee-id')
              };
            })
          };
        });
        
        console.log('State before save:', beforeSaveState);
        
        // Click Save Draft
        const saveDraftButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => button.textContent?.includes('Save Draft'));
        });
        
        if (saveDraftButton.asElement()) {
          await saveDraftButton.asElement()?.click();
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Get state after save
          const afterSaveState = await page.evaluate(() => {
            const shifts = Array.from(document.querySelectorAll('.text-xs.p-1.mb-1.rounded.cursor-move'));
            return {
              count: shifts.length,
              shifts: shifts.map(shift => {
                const parentCell = shift.closest('[data-day-index]');
                const employeeCell = shift.closest('[data-employee-id]');
                return {
                  text: shift.textContent.trim(),
                  dayIndex: parentCell?.getAttribute('data-day-index'),
                  employeeId: employeeCell?.getAttribute('data-employee-id')
                };
              })
            };
          });
          
          console.log('\nState after save:', afterSaveState);
          
          // Compare
          if (beforeSaveState.count !== afterSaveState.count) {
            console.log('❌ SAVE ISSUE: Shift count changed after save!');
            console.log(`  Before: ${beforeSaveState.count}, After: ${afterSaveState.count}`);
          } else {
            console.log('✅ Shift count preserved after save');
          }
          
          // Check if the movement persisted
          const persistedMovement = JSON.stringify(beforeSaveState.shifts) === JSON.stringify(afterSaveState.shifts);
          if (persistedMovement) {
            console.log('✅ Shift positions preserved after save');
          } else {
            console.log('❌ Shift positions changed after save');
          }
          
          console.log('\nAPI calls during save:');
          requests.forEach(req => {
            console.log(`  ${req.method} ${req.url}`);
          });
          
        } else {
          console.log('❌ Save Draft button not found');
        }
        
      } else {
        console.log('❌ No schedule cards found');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Keep browser open for inspection
    await browser.close();
  }
}

testDayToDayMovement();