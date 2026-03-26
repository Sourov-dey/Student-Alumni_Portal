import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('End-to-End Auth Navigation', () => {
  let driver;

  beforeAll(async () => {
    const options = new chrome.Options();
    options.addArguments('--headless=new'); // Run headless Chrome
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }, 30000); // 30 sec timeout for browser boot

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('navigates to the sign in page and displays the portal title', async () => {
    // Assuming frontend runs on 5173 via vite
    await driver.get('http://localhost:5173/login');
    
    // Wait until the primary heading is visible
    const loginHeader = await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(., 'Welcome Back')]")),
      10000
    );

    const isDisplayed = await loginHeader.isDisplayed();
    expect(isDisplayed).toBe(true);
    
    // Check if the submit button exists
    const submitButton = await driver.findElement(By.css("button[type='submit']"));
    const buttonText = await submitButton.getText();
    expect(buttonText).toMatch(/Sign In/i);
  }, 15000); // Test block timeout 15s

  it('navigates from login to signup via React client-side routing', async () => {
    await driver.get('http://localhost:5173/login');
    
    // Find the link that points to the registration anchor
    const registerLink = await driver.wait(
      until.elementLocated(By.xpath("//a[contains(., 'Sign Up')]")),
      10000
    );
    
    // Simulate real user click
    await registerLink.click();
    
    // Verify the Signup component DOM mounted and animation finished
    const signupHeader = await driver.wait(
      until.elementLocated(By.xpath("//h1[contains(., 'Join the Network')]")),
      10000
    );
    
    await driver.wait(until.elementIsVisible(signupHeader), 10000);
    expect(await signupHeader.isDisplayed()).toBe(true);
  }, 15000);
});
