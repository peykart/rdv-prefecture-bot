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
      // Download the captcha image and send it to a service that solves it
      const captchaImage = await this.page.waitForSelector(CAPTCHA_ID);

      const imageSrc = await captchaImage?.evaluate((el) => el.src);
      console.log({ imageSrc });

      if (imageSrc) {
        const newPage = await this.browser.newPage();
        await newPage.goto(imageSrc);

        const base64Image = await newPage.screenshot({ encoding: "base64" });

        // Send imageBase64 to a service that solves the captcha
        const data = {
          method: "base64",
          body: base64Image,
          key: SECRET_KEY,
        };

        const response = await axios.post(URL_ASK_RECAPTCHA, data);

        console.log({ response: response.data });
        // If the response contains 'OK', the captcha was successfully sent to the service
        if (response.data.includes("OK")) {
          // Get the captcha ID from the response
          const captchaId = response.data.split("|")[1];
          newPage.close();
          return (this.captchaId = captchaId);
        }
        newPage.close();
        // If the response does not contain 'OK', throw an error
        throw new Error("Error while requesting captcha resolution.");
      }
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
