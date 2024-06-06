const { default: axios } = require('axios');

const URL_ASK_RECAPTCHA = 'https://2captcha.com/in.php';
const URL_SUBMIT_RECAPTCHA = 'https://2captcha.com/res.php';

const CAPTCHA_ID = '#captchaFR_CaptchaImage';
const SECRET_KEY = 'd7889c8cfa4abe9811f324b22a7be8ca';

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

    const recaptchaRequired = body.includes('code de sécurité');

    this.recaptchaRequired = recaptchaRequired;
    return recaptchaRequired;
  }

  async requestRecaptchaResolution() {
    if (this.recaptchaRequired) {
      // Download the captcha image and send it to a service that solves it
      const captchaImage = await this.page.waitForSelector(CAPTCHA_ID);

      const imageSrc = await captchaImage?.evaluate((el) => el.src);

      if (imageSrc) {
        const newPage = await this.browser.newPage();
        await newPage.goto(imageSrc);

        const base64Image = await newPage.screenshot({ encoding: 'base64' });

        // Send imageBase64 to a service that solves the captcha
        const data = {
          method: 'base64',
          body: base64Image,
          key: SECRET_KEY,
        };

        const response = await axios.post(URL_ASK_RECAPTCHA, data);
        // If the response contains 'OK', the captcha was successfully sent to the service
        if (response.data.includes('OK')) {
          // Get the captcha ID from the response
          const captchaId = response.data.split('|')[1];

          return (this.captchaId = captchaId);
        }

        // If the response does not contain 'OK', throw an error
        throw new Error('Error while requesting captcha resolution.');
      }
    }
  }

  async solveRecaptcha(checkAppointmentAvailability, res) {
    if (this.captchaId) {
      const data = {
        key: SECRET_KEY,
        action: 'get',
        id: this.captchaId,
      };

      const response = await axios.get(URL_SUBMIT_RECAPTCHA, {
        params: data,
      });

      if (response.data.includes('CAPCHA_NOT_READY')) {
        console.log('Captcha not ready. Retrying in 2 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.solveRecaptcha();
      }

      // If the response contains 'OK', the captcha was successfully solved
      if (response.data.includes('OK')) {
        console.log('Captcha solved:', response.data);
        // Get the captcha solution from the response
        const captchaSolution = response.data.split('|')[1];

        // Fill the captcha input with the solution
        await this.page.type('#captchaFormulaireExtInput', captchaSolution);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await this.page.click('button[type=submit]');

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const content = await this.page.content();
        console.log(content);
        const criteriaRegex = /"critere":\s*(\{[^}]*\})/;
        const match = criteriaRegex.exec(content);

        // Initialize an object to store the criteria
        let criteria = null;

        // If a match was found
        if (match && match[1]) {
          try {
            // Parse the found JSON to get the criteria object
            criteria = JSON.parse(match[1]);
          } catch (error) {
            // Log an error message if the JSON parsing fails
            console.error('Error parsing criteria:', error);
          }
        }

        if (!criteria || criteria.datePremiereDispo === '') {
          console.log(
            'No appointment available from this date. Please try again later.'
          );

          await this.page.close();

          // If no appointments are available according to the criteria, reload the page and check again
          return res.status(200).json({
            status: 'success',
            appointmentAvailable: false,
            message: `No appointment available from this date. Please try again later.`,
          });
        }

        await this.page.close();

        // If appointments may be available
        res.status(200).json({
          status: 'success',
          appointmentAvailable: true,
          message: `Appointments available between ${criteria.dateMin} and ${criteria.dateMax}. `,
        });
      }
      return response.data;
    }
  }
}

module.exports = Recaptcha;
