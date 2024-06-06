const puppeteer = require('puppeteer');
require('dotenv').config();

class Page {
  constructor(uri) {
    this.uri = uri;
    this.browser = null;
    this.page = null;
  }

  async create() {
    const options = {
      args: [
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--single-process',
        '--no-zygote',
      ],
      executablePath:
        process.env.NODE_ENV === 'production'
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    };

    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.goto(this.uri);

    this.browser = browser;
    this.page = page;
  }

  async close() {
    await this.browser.close();
  }

  async checkAppointmentAvailability(page) {
    console.log(page);

    const content = await page.content();
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

      await page.close();

      // If no appointments are available according to the criteria, reload the page and check again
      return res.status(200).json({
        status: 'success',
        appointmentAvailable: false,
        message: `No appointment available from this date. Please try again later.`,
      });
    }

    await page.close();

    // If appointments may be available
    res.status(200).json({
      status: 'success',
      appointmentAvailable: true,
      message: `Appointments available between ${criteria.dateMin} and ${criteria.dateMax}. `,
    });
  }
}

module.exports = Page;
