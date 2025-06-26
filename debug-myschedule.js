const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  try {
    console.log('🚀 Navigating to login page...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle2' });
    
    // Login with test credentials
    console.log('🔐 Logging in...');
    await page.type('input[type="email"]', 'admin@nomadsoft.us');
    await page.type('input[type="password"]', 'secret');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Login successful, on dashboard');
    
    // Navigate to My Schedule
    console.log('📅 Navigating to My Schedule...');
    await page.goto('http://localhost:3000/my-schedule', { waitUntil: 'networkidle2' });
    
    // Wait a bit for data to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot
    await page.screenshot({ path: '/var/dev/myschedule-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as myschedule-debug.png');
    
    // Get the page content and debug info
    const debugInfo = await page.evaluate(() => {
      // Get the summary statistics
      const summaryCards = Array.from(document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-3 .text-2xl.font-bold')).map(el => el.textContent);
      
      // Get schedule grid info
      const scheduleGrids = Array.from(document.querySelectorAll('.border.border-slate-700.rounded-lg'));
      
      // Get any visible shifts
      const shiftElements = Array.from(document.querySelectorAll('.rounded-md.p-2.text-xs'));
      
      // Get active tab
      const activeTab = document.querySelector('.bg-primary.text-primary-foreground')?.textContent?.trim();
      
      // Check for error messages
      const errors = Array.from(document.querySelectorAll('.text-red-400')).map(el => el.textContent);
      
      return {
        summaryStats: summaryCards,
        scheduleGridCount: scheduleGrids.length,
        visibleShifts: shiftElements.length,
        shiftDetails: shiftElements.map(el => el.textContent),
        activeTab: activeTab,
        errors: errors,
        url: window.location.href,
        pageTitle: document.title
      };
    });
    
    console.log('📊 Debug Info:', JSON.stringify(debugInfo, null, 2));
    
    // Check if there are any network errors or failed requests
    console.log('🌐 Checking for any console errors...');
    
    // Check if we can find the schedule cards
    const scheduleCards = await page.$$('.border-slate-700.bg-card');
    console.log(`📋 Found ${scheduleCards.length} schedule cards`);
    
    // Try to find the specific schedule grid
    const scheduleGrid = await page.$('.border.border-slate-700.rounded-lg.overflow-hidden');
    if (scheduleGrid) {
      console.log('🗓️ Found schedule grid, checking contents...');
      
      const gridContent = await page.evaluate((grid) => {
        const weekDays = Array.from(grid.querySelectorAll('.grid.grid-cols-8 > div')).slice(1, 8).map(el => el.textContent.trim());
        const shiftRows = Array.from(grid.querySelectorAll('.grid.grid-cols-8.min-h-\\[120px\\] > div')).slice(1).map(el => ({
          content: el.textContent.trim(),
          isEmpty: el.children.length === 0,
          hasShifts: el.querySelectorAll('.rounded-md.p-2').length > 0
        }));
        
        return {
          weekDays: weekDays,
          shiftRows: shiftRows
        };
      }, scheduleGrid);
      
      console.log('📅 Grid Content:', JSON.stringify(gridContent, null, 2));
    } else {
      console.log('❌ No schedule grid found');
    }
    
    // Check local storage for any cached data
    const localStorageData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });
    
    console.log('💾 Local Storage:', JSON.stringify(localStorageData, null, 2));
    
    // Wait a bit more to see if data loads
    console.log('⏳ Waiting 5 more seconds for any delayed data loading...');
    await page.waitForTimeout(5000);
    
    // Take another screenshot
    await page.screenshot({ path: '/var/dev/myschedule-debug-final.png', fullPage: true });
    console.log('📸 Final screenshot saved as myschedule-debug-final.png');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    await page.screenshot({ path: '/var/dev/myschedule-error.png', fullPage: true });
  } finally {
    console.log('🏁 Test completed');
    await browser.close();
  }
})();