const { default: axios } = require("axios");

const URL_ASK_RECAPTCHA = "https://2captcha.com/in.php";
const URL_SUBMIT_RECAPTCHA = "https://2captcha.com/res.php";
const CAPTCHA_ID = process.env.CAPTCHA_ID;
const SECRET_KEY = process.env.CAPTCHA_SECRET_KEY;

class Recaptcha {
  constructor(page, browser) {
    this.page = page;
    this.browser = browser;

    this.recaptchaRequired = true;
    this.captchaId = null;
  }

  async checkRecaptchaRequired() {
    const body = await this.page.evaluate(() => {
      return document.body.textContent;
    });

    const recaptchaRequired = body.includes("code de sécurité");

    this.recaptchaRequired = recaptchaRequired;
    return recaptchaRequired;
  }

async requestRecaptchaResolution() {
  if (this.recaptchaRequired) {
    // Wait for captcha image to appear on page (up to 10 seconds)
    try {
      await this.page.waitForSelector('.captcha img', { timeout: 10000 });
    } catch (error) {
      console.error('Captcha image element did not appear within timeout');
      throw new Error('Captcha image not found on page');
    }

    const imageSrc = await this.page.evaluate(() => {
      let img = document.querySelector('.captcha img');
      if (!img) {
        img = document.querySelector('img[src^="data:image"]');
      }
      if (img && img.src && img.src.startsWith('data:image')) {
        return img.src;
      }
      return '';
    });
    console.log('Captcha imageSrc found');

    if (!imageSrc) {
      throw new Error("Captcha image not found or not base64-encoded on this page.");
    }

    const base64Data = imageSrc.split(',')[1];
    if (!base64Data) {
      throw new Error("Captcha base64 image data missing after splitting src.");
    }

    const data = {
      method: 'base64',
      body: base64Data,
      key: SECRET_KEY,
    };

    const response = await axios.post(URL_ASK_RECAPTCHA, data);
    console.log({ response: response.data });

    if (response.data.includes('OK')) {
      const captchaId = response.data.split('|')[1];
      return (this.captchaId = captchaId);
    }

    throw new Error('Error while requesting captcha resolution.');
  }
}


  async solveRecaptcha() {
    if (this.captchaId) {
      const data = {
        key: SECRET_KEY,
        action: "get",
        id: this.captchaId,
      };

      const response = await axios.get(URL_SUBMIT_RECAPTCHA, {
        params: data,
      });

      if (response.data.includes("CAPCHA_NOT_READY")) {
        console.log("Captcha not ready. Retrying in 2 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await this.solveRecaptcha();
      }

      // If the response contains 'OK', the captcha was successfully solved
      if (response.data.includes("OK")) {
        console.log("Captcha solved:", response.data);
        // Get the captcha solution from the response
        const captchaSolution = response.data.split("|")[1];

        // Fill the captcha input with the solution
        await this.page.type("#captchaFormulaireExtInput", captchaSolution);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await this.page.click("button[type=submit]");

        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      }
      return false;
    }
  }
}

module.exports = Recaptcha;
