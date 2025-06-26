const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    // Navigate and login
    console.log('🚀 Navigating to login page...');
    await page.goto('http://localhost:3000/auth/login');
    
    // Login
    await page.type('input[name="email"]', 'admin@nomadsoft.us');
    await page.type('input[name="password"]', 'secret');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForNavigation();
    console.log('✅ Logged in successfully');
    
    // Navigate to schedule manager
    await page.goto('http://localhost:3000/schedule-manager');
    await page.waitForSelector('[data-testid="schedule-card"]', { timeout: 10000 });
    
    // Click on the first schedule
    await page.click('[data-testid="schedule-card"]');
    await page.waitForSelector('[data-testid="assign-button"]');
    
    // Click assign button
    await page.click('[data-testid="assign-button"]');
    await page.waitForSelector('.schedule-grid', { timeout: 15000 });
    console.log('✅ Schedule grid loaded');
    
    // Wait a bit for everything to settle
    await page.waitForTimeout(2000);
    
    // Test 1: Move a shift from one day to another using click-to-move
    console.log('🧪 Testing shift movement between days...');
    
    // Find an existing shift to move
    const existingShifts = await page.$$('.text-xs.p-1.mb-1.rounded.cursor-move');
    if (existingShifts.length === 0) {
      console.log('❌ No existing shifts found');
      return;
    }
    
    console.log(`📊 Found ${existingShifts.length} existing shifts`);
    
    // Click on the first shift to select it
    console.log('🎯 Selecting first shift for movement...');
    await existingShifts[0].click();
    await page.waitForTimeout(500);
    
    // Check if shift is selected (should have yellow border)
    const isSelected = await page.evaluate((el) => {
      return el.classList.contains('ring-yellow-400');
    }, existingShifts[0]);
    
    if (!isSelected) {
      console.log('❌ Shift was not selected (no yellow border)');
      return;
    }
    console.log('✅ Shift selected (has yellow border)');
    
    // Get the shift's current position info
    const originalInfo = await page.evaluate((el) => {
      const shiftText = el.textContent;
      const parentCell = el.closest('[data-employee-id]') || el.closest('[data-day-index]');
      return {
        text: shiftText,
        parentType: parentCell ? (parentCell.hasAttribute('data-employee-id') ? 'employee' : 'unassigned') : 'unknown',
        employeeId: parentCell?.getAttribute('data-employee-id'),
        dayIndex: parentCell?.getAttribute('data-day-index')
      };
    }, existingShifts[0]);
    
    console.log('📍 Original shift location:', originalInfo);
    
    // Find a different employee cell to move the shift to
    const employeeCells = await page.$$('[data-employee-id][data-day-index]');
    console.log(`📊 Found ${employeeCells.length} employee day cells`);
    
    if (employeeCells.length === 0) {
      console.log('❌ No employee cells found');
      return;
    }
    
    // Find a target cell that's different from the current location
    let targetCell = null;
    for (const cell of employeeCells) {
      const cellInfo = await page.evaluate((el) => ({
        employeeId: el.getAttribute('data-employee-id'),
        dayIndex: el.getAttribute('data-day-index')
      }), cell);
      
      // Pick a different cell
      if (cellInfo.employeeId !== originalInfo.employeeId || cellInfo.dayIndex !== originalInfo.dayIndex) {
        targetCell = cell;
        console.log('🎯 Target cell selected:', cellInfo);
        break;
      }
    }
    
    if (!targetCell) {
      console.log('❌ Could not find a different target cell');
      return;
    }
    
    // Click on the target cell to move the shift
    console.log('🔄 Moving shift to target cell...');
    await targetCell.click();
    await page.waitForTimeout(1000);
    
    // Check if the shift moved correctly
    console.log('🔍 Checking if shift moved...');
    
    // Count shifts before and after
    const shiftsAfterMove = await page.$$('.text-xs.p-1.mb-1.rounded.cursor-move');
    console.log(`📊 Shifts after move: ${shiftsAfterMove.length} (was ${existingShifts.length})`);
    
    if (shiftsAfterMove.length > existingShifts.length) {
      console.log('❌ DUPLICATE DETECTED! More shifts after move than before');
      
      // Get details of all shifts
      const allShiftTexts = [];
      for (const shift of shiftsAfterMove) {
        const text = await page.evaluate(el => el.textContent, shift);
        allShiftTexts.push(text);
      }
      console.log('📋 All shifts:', allShiftTexts);
      
    } else if (shiftsAfterMove.length === existingShifts.length) {
      console.log('✅ Shift count unchanged - likely moved correctly');
    } else {
      console.log('⚠️ Fewer shifts after move - unexpected');
    }
    
    // Test saving
    console.log('💾 Testing save...');
    const saveButton = await page.$('button:has-text("Save Draft")');
    if (saveButton) {
      await saveButton.click();
      await page.waitForTimeout(2000);
      
      // Check for success message or errors
      const successMessage = await page.$('text="saved successfully"');
      const errorMessage = await page.$('text="error"');
      
      if (successMessage) {
        console.log('✅ Save successful');
      } else if (errorMessage) {
        console.log('❌ Save failed with error');
      } else {
        console.log('⚠️ Save completed but no clear success/error message');
      }
      
      // Check shift count after save
      await page.waitForTimeout(1000);
      const shiftsAfterSave = await page.$$('.text-xs.p-1.mb-1.rounded.cursor-move');
      console.log(`📊 Shifts after save: ${shiftsAfterSave.length}`);
      
      if (shiftsAfterSave.length !== existingShifts.length) {
        console.log('❌ Shift count changed after save - indicates data persistence issue');
      }
    } else {
      console.log('❌ Save button not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();