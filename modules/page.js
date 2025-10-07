const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

class Page {
  constructor(uri) {
    this.uri = uri;
    this.browser = null;
    this.page = null;
  }

  async create() {
    console.log('omar', puppeteer.executablePath());
    const options = {
      headless: true,
      executablePath: puppeteer.executablePath(),
      args: [
        "--no-sandbox",
        "--disable-gpu",
      ],
      // executablePath:
      //   process.env.NODE_ENV === "production"
      //     ? process.env.PUPPETEER_EXECUTABLE_PATH
      //     : puppeteer.executablePath(),
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

  async reload() {
    await this.page.reload({
      waitUntil: "domcontentloaded",
    });
  }

  async searchText(text) {
    const body = await this.page.evaluate(() => {
      return document.body.textContent;
    });

    return body.includes(text);
  }

  getUrl() {
    return this.page.url();
  }

  async isFirstStep() {
    return this.searchText("Constituez votre dossier");
  }

  async isSecondStep() {
    return (
      this.searchText("Choisissez votre créneau") ||
      this.searchText("Aucun créneau disponible")
    );
  }

  async checkAppointmentAvailability() {
    const content = await this.page.content();
    // console.log(content);
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
        console.error("Error parsing criteria:", error);
      }
    }

    console.log({ criteria });

    if (!criteria || criteria.datePremiereDispo === "") {
      console.log(
        "No appointment available from this date. Please try again later.",
      );
      return false;
    }
    return true;
  }

  async hasCreneau() {
    return await this.page.evaluate(() => {
      const firstCreneauBtn = document.querySelector(
        ".row.cellule.justify-center.radio-card label",
      );
      if (firstCreneauBtn !== null) {
        firstCreneauBtn.click();
        return true;
      }
      return false;
    });
  }
}

module.exports = Page;
