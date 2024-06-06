const express = require('express');
const Page = require('./modules/page');
const Recaptcha = require('./modules/recaptcha');
const app = express();

const PORT = process.env.PORT || 4000;
const URI =
  'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/4083/cgu/?error=errorSessionInvalide';

app.get('/api', (req, res) => {
  const {uri} = req.query;
  try {
    const page = new Page(uri);

    page.create().then(() => {
      const recaptcha = new Recaptcha(page.page, page.browser);
      // 1) Verify if recaptcha is required
      recaptcha.checkRecaptchaRequired().then((recaptchaRequired) => {
        // Close the page and browser when done
        if (recaptchaRequired) {
          // 2) If recaptcha is required, solve it
          recaptcha.requestRecaptchaResolution().then(async (captchaId) => {
            new Promise((resolve) => setTimeout(resolve, 50000)).then(() => {
              console.log('Solving recaptcha...');
              recaptcha.solveRecaptcha(page.checkAppointmentAvailability, res);
            });
          });
        }
      });
    });
  } catch (error) {
    console.error('Error creating page:', error);

    res.status(500).json({
      status: 'error',
      message: 'Error creating page.',
      error: error,
    });
  }
});

app.get('/', (req, res) => {
  res.send('Render Puppeteer server is up and running!');
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
