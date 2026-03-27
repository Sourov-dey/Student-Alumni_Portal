import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read seeded users
const e2eDataPath = path.join(__dirname, 'e2e_data.json');
const e2eData = JSON.parse(fs.readFileSync(e2eDataPath, 'utf8'));
const resumePath = path.join(__dirname, 'e2e_resume.pdf');

describe('End-to-End Jobs Flow (Post & Apply)', () => {
  let driver;

  beforeAll(async () => {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }, 30000);

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  const injectAuth = async (userType) => {
    const data = e2eData[userType];
    // Load base URL before setting localStorage
    await driver.get('http://localhost:5173/');
    await driver.executeScript(`
      localStorage.setItem('au_token', '${data.token}');
      localStorage.setItem('au_user', '${JSON.stringify(data.user)}');
    `);
  };

  const clearAuth = async () => {
    await driver.executeScript('localStorage.clear();');
  };

  it('Alumni can successfully post a new job', async () => {
    // 1. Authenticate as Alumni
    await injectAuth('alumni');
    
    // 2. Navigate to Post Job
    await driver.get('http://localhost:5173/post-job');
    
    // 3. Fill Form
    // Wait for form render
    const titleInput = await driver.wait(until.elementLocated(By.name('title')), 5000);
    await titleInput.sendKeys('Senior Selenium Engineer');
    
    await driver.findElement(By.name('company')).sendKeys('TechAuto E2E Inc.');
    await driver.findElement(By.name('location')).sendKeys('Remote');
    await driver.findElement(By.name('department')).sendKeys('QA');
    await driver.findElement(By.name('description')).sendKeys('Writing automated pipelines for global systems.');
    await driver.findElement(By.name('requirements')).sendKeys('React, Selenium, Node.js');

    // 4. Submit
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();

    // 5. Verify Redirect (Job Card or Details appearing)
    // We get redirected to /jobs/:id or /jobs. Let's wait until 'Senior Selenium Engineer' is visible
    const newJobHeader = await driver.wait(
      until.elementLocated(By.xpath("//*[contains(text(), 'Senior Selenium Engineer')]")),
      10000
    );
    expect(await newJobHeader.isDisplayed()).toBe(true);

    // clear storage before next step
    await clearAuth();
  }, 30000);

  it('Student can browse and apply to the posted job', async () => {
    // 1. Authenticate as Student
    await injectAuth('student');
    
    // 2. Navigate to Jobs list
    await driver.get('http://localhost:5173/jobs');
    
    // 3. Find The Job Card that Alumni Just Created and Click View
    // Since jobs display descending, it should be the first one, or we can look for the title text
    const jobTitleElement = await driver.wait(
      until.elementLocated(By.xpath("//h3[contains(., 'Senior Selenium Engineer')]")),
      10000
    );
    // Move up to the card then find 'View Details' link OR simply click the card link
    const jobCard = await jobTitleElement.findElement(By.xpath("./ancestor::*[contains(@class, 'job-card')]"));
    const viewDetailsBtn = await jobCard.findElement(By.xpath(".//a[contains(., 'View') or contains(@class, 'btn')]"));
    await viewDetailsBtn.click();

    // 4. Fill Application Sidebar
    // Wait for job-detail page to load
    const applySection = await driver.wait(until.elementLocated(By.className('application-form')), 8000);
    
    // Phone
    await driver.findElement(By.css('input[type="tel"]')).sendKeys('555-0199');
    
    // Resume (Attach file via absolute path)
    const fileInput = await driver.findElement(By.css('input[type="file"]'));
    await fileInput.sendKeys(resumePath);
    
    // Cover
    await driver.findElement(By.css('textarea')).sendKeys('Here is my automated cover letter demonstrating my Selenium skills.');
    
    // 5. Trigger Review Modal
    const applyBtn = await driver.findElement(By.xpath("//button[contains(., 'Review & Apply')]"));
    await applyBtn.click();
    
    // 6. Confirm Modal
    const confirmBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Confirm & Submit')]")), 5000);
    await driver.wait(until.elementIsVisible(confirmBtn), 5000);
    await confirmBtn.click();

    // 7. Verify Success state 
    // The "Applied successfully" message might be a local div state message.
    const successMsg = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class, 'success') and contains(., 'Applied successfully')]")),
      10000
    );
    
    expect(await successMsg.isDisplayed()).toBe(true);
    
  }, 40000);
});
