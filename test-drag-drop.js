const puppeteer = require('puppeteer');

async function testDragDrop() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/') && request.method() !== 'GET') {
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    }
  });
  
  // Track console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('DEBUG') || text.includes('BULK') || text.includes('Draft save summary')) {
      consoleLogs.push(text);
    }
  });
  
  try {
    console.log('=== Testing Drag-Drop + Bulk Save ===');
    
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
    
    // Click "Edit Existing Schedule"
    const editButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Edit Existing Schedule'));
    });
    
    if (editButton.asElement()) {
      await editButton.asElement()?.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Click on first schedule
      const scheduleCards = await page.$$('.cursor-pointer');
      if (scheduleCards.length > 0) {
        await scheduleCards[0].click();
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('✅ Schedule loaded');
        
        // Clear all shifts first to ensure we're starting fresh
        const clearButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => button.textContent?.includes('Clear All Shifts'));
        });
        
        if (clearButton.asElement()) {
          console.log('🗑️  Clearing all shifts...');
          await clearButton.asElement()?.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Try to perform drag and drop operations
        console.log('🎯 Attempting drag and drop operations...');
        
        // Find draggable shift type elements
        const draggableElements = await page.$$('[data-rbd-draggable-id]');
        console.log(`Found ${draggableElements.length} draggable elements`);
        
        if (draggableElements.length > 0) {
          // Try to drag the first shift type to an unassigned area
          const sourceElement = draggableElements[0];
          
          // Find a droppable target (unassigned day)
          const droppableElements = await page.$$('[data-rbd-droppable-id]');
          console.log(`Found ${droppableElements.length} droppable elements`);
          
          if (droppableElements.length > 0) {
            // Find an unassigned day target
            const targetElement = await page.evaluateHandle(() => {
              const droppables = Array.from(document.querySelectorAll('[data-rbd-droppable-id]'));
              return droppables.find(el => el.getAttribute('data-rbd-droppable-id')?.includes('unassigned-day'));
            });
            
            if (targetElement.asElement()) {
              console.log('🎯 Performing drag and drop...');
              
              // Get the bounding boxes
              const sourceBox = await sourceElement.boundingBox();
              const targetBox = await targetElement.asElement().boundingBox();
              
              if (sourceBox && targetBox) {
                // Perform drag and drop
                await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
                await page.mouse.down();
                await new Promise(resolve => setTimeout(resolve, 100));
                await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
                await new Promise(resolve => setTimeout(resolve, 100));
                await page.mouse.up();
                
                console.log('✅ Drag and drop completed');
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }
        }
        
        // Alternative: Try to add shifts programmatically by interacting with the state
        console.log('🔧 Trying alternative method - direct UI interaction...');
        
        // Look for any buttons that might add shifts
        const allButtons = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button')).map(btn => ({
            text: btn.textContent,
            classes: btn.className
          }));
        });
        
        console.log('Available UI elements:', allButtons.filter(b => b.text && b.text.trim()).slice(0, 10));
        
        // Force add shifts by modifying the component state directly
        await page.evaluate(() => {
          // Try to trigger React state updates directly
          console.log('🔧 Attempting to add shifts programmatically...');
          
          // Simulate adding unassigned shifts to trigger bulk save
          const fakeShifts = [
            {
              id: 'unassigned-test-' + Date.now() + '-1',
              shiftTypeId: 'cleaner-shift-id',
              shiftType: { id: 'cleaner-shift-id', name: 'Cleaner', startTime: '09:00', endTime: '13:00', colorIndex: 0 },
              date: '2025-06-30',
              order: 1
            },
            {
              id: 'unassigned-test-' + Date.now() + '-2', 
              shiftTypeId: 'frontdesk-shift-id',
              shiftType: { id: 'frontdesk-shift-id', name: 'Front Desk', startTime: '14:00', endTime: '18:00', colorIndex: 1 },
              date: '2025-06-30',
              order: 2
            }
          ];
          
          // Store in window for debugging
          window.testShifts = fakeShifts;
          console.log('🔧 Test shifts created:', fakeShifts);
        });
        
        console.log('💾 Now attempting to save...');
        
        // Clear previous requests
        requests.length = 0;
        consoleLogs.length = 0;
        
        // Click Save Draft
        const saveButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => button.textContent?.includes('Save Draft'));
        });
        
        if (saveButton.asElement()) {
          await saveButton.asElement()?.click();
          
          // Wait for save to complete
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          console.log('\n📱 Console Debug Logs:');
          consoleLogs.forEach(log => console.log(`   ${log}`));
          
          console.log('\n🔍 Network Analysis:');
          const shiftRequests = requests.filter(req => req.url.includes('/shifts'));
          console.log(`Shift API calls: ${shiftRequests.length}`);
          
          shiftRequests.forEach((req, index) => {
            console.log(`${index + 1}. ${req.method} ${req.url.split('/api/')[1]}`);
            if (req.url.includes('/bulk')) {
              console.log('   🎯 BULK OPERATION!');
            }
          });
          
          const bulkCalls = shiftRequests.filter(req => req.url.includes('/bulk')).length;
          
          if (bulkCalls > 0) {
            console.log('\n🎉 SUCCESS: Bulk operations detected!');
          } else if (shiftRequests.length === 0) {
            console.log('\nℹ️  No API calls made - check debug logs for reason');
          } else {
            console.log('\n❌ Individual calls still being made');
          }
          
        } else {
          console.log('❌ Save button not found');
        }
        
      } else {
        console.log('❌ No schedules available');
      }
    } else {
      console.log('❌ Edit button not found');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testDragDrop();