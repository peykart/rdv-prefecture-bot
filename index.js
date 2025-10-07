const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

require("dotenv").config();
const sendNotification = require('./telegram'); 
const urlsToCheck = process.env.PREFECTURE_URLS.split(',').map(url => url.trim());
const Page = require("./modules/page");
const Recaptcha = require("./modules/recaptcha");

var player = require("play-sound")((opts = {}));

async function recaptcha(page) {
  const recaptcha = new Recaptcha(page.page, page.browser);
  const recaptchaRequired = await recaptcha.checkRecaptchaRequired();
  
  if (recaptchaRequired) {
    // Check if previous captcha was invalid
    const currentUrl = page.getUrl();
    if (currentUrl.includes('error=invalidCaptcha')) {
      console.log('Previous captcha was invalid, waiting for new captcha...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    await recaptcha.requestRecaptchaResolution();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await recaptcha.solveRecaptcha();
    return true;
  }
  return false;
}


async function checkUrls(urls) {
  while (true) { 
    for (const url of urls) {
      console.log(`Starting check for ${url}`);
      const page = new Page(url);

      await page.create();
      await new Promise(resolve => setTimeout(resolve, 3000)); 

      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        console.log("current url", page.getUrl());
        
        // Check if previous captcha was invalid and reload page
        const currentUrl = page.getUrl();
        if (currentUrl.includes('error=invalidCaptcha')) {
          console.log('Invalid captcha detected, reloading page...');
          await page.reload();
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        await recaptcha(page);
        const hasCreneau = await page.hasCreneau();

        if (hasCreneau) {
          sendNotification(`A RDV SLOT IS AVAILABLE! 😍 BOOK IT HERE NOW: ${url}`);
          player.play("./classic.mp3", function (err) { if (err) throw err; });
          await new Promise(resolve => setTimeout(resolve, 30000000));
          break;
        } else {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 5000));
          await page.reload();
        }
      }
      await page.close();
    }
    
    console.log('\x1b[32mCompleted one full cycle. Starting again...\x1b[0m');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

checkUrls(urlsToCheck);


