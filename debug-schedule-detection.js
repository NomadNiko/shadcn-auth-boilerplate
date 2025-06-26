const puppeteer = require('puppeteer');

async function debugScheduleDetection() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs from the page
  page.on('console', (msg) => {
    console.log(`[PAGE] ${msg.text()}`);
  });
  
  try {
    console.log('=== Debug Schedule Detection Logic ===');
    
    // Login
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'admin@nomadsoft.us');
    await page.type('input[name="password"]', 'secret');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Navigate to Schedule Manager
    await page.goto('http://localhost:3000/schedule-manager/assign', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click "Create New Schedule"
    const createButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Create New Schedule'));
    });
    
    await createButton.asElement()?.click();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Inject debugging code into the page to check schedule detection
    const debugInfo = await page.evaluate(() => {
      // Check if schedules data is available
      const scheduleData = window.localStorage.getItem('schedules') || 'Not found in localStorage';
      
      // Look for React component state if possible
      const reactRoot = document.querySelector('#__next');
      let reactState = 'React state not accessible';
      
      // Check what's actually in the DOM
      const pageContent = document.body.textContent;
      const hasScheduleExists = pageContent.includes('Schedule exists:');
      const hasScheduleFound = pageContent.includes('Schedule found');
      const hasEditSchedule = pageContent.includes('Edit Schedule');
      const hasCreateSchedule = pageContent.includes('Create Schedule');
      
      // Check for any date-related content
      const dateContent = [];
      const dateRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/g;
      const matches = pageContent.match(dateRegex);
      if (matches) {
        dateContent.push(...matches);
      }
      
      return {
        scheduleData,
        reactState,
        hasScheduleExists,
        hasScheduleFound,
        hasEditSchedule,
        hasCreateSchedule,
        dateContent,
        fullTextSample: pageContent.substring(0, 500)
      };
    });
    
    console.log('Debug info from page:');
    console.log('- Has "Schedule exists":', debugInfo.hasScheduleExists);
    console.log('- Has "Schedule found":', debugInfo.hasScheduleFound);
    console.log('- Has "Edit Schedule":', debugInfo.hasEditSchedule);
    console.log('- Has "Create Schedule":', debugInfo.hasCreateSchedule);
    console.log('- Date content found:', debugInfo.dateContent);
    console.log('- Page content sample:', debugInfo.fullTextSample);
    
    // Now let's manually trigger schedule loading and check the network
    console.log('\nTesting schedule loading...');
    
    const scheduleRequests = [];
    page.on('response', response => {
      if (response.url().includes('/schedules')) {
        scheduleRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Force refresh the page to see network requests
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Schedule-related network requests:', scheduleRequests);
    
    // Navigate back to create view
    const createButton2 = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Create New Schedule'));
    });
    
    if (createButton2.asElement()) {
      await createButton2.asElement()?.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if schedules are being loaded in create view
      console.log('\nSchedule requests during create view:', scheduleRequests.filter(req => req.url.includes('/schedules')));
      
      // Try to access the component's schedules state directly
      const schedulesFromComponent = await page.evaluate(() => {
        // Try to find any schedules data in the window or component
        return {
          windowSchedules: window.schedules || 'Not in window',
          anyScheduleText: document.body.textContent.includes('July') || document.body.textContent.includes('June'),
          buttonText: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent).filter(text => text.includes('Schedule'))
        };
      });
      
      console.log('Component state check:', schedulesFromComponent);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugScheduleDetection();