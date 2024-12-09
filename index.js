require("dotenv").config();
const Page = require("./modules/page");
const Recaptcha = require("./modules/recaptcha");

var player = require("play-sound")((opts = {}));

const URI = process.env.PREFECTURE_URL;

async function recaptcha(page) {
  const recaptcha = new Recaptcha(page.page, page.browser);
  const recaptchaRequired = await recaptcha.checkRecaptchaRequired();
  if (recaptchaRequired) {
    await recaptcha.requestRecaptchaResolution();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await recaptcha.solveRecaptcha();
    return true;
  }
  return false;
}

async function check() {
  const page = new Page(URI);
  await page.create();
  async function navigate() {
    console.log("current url", page.getUrl());
    await recaptcha(page);
    const hasCreneau = await page.hasCreneau();
    if (hasCreneau) {
      player.play("./classic.mp3", function (err) {
        if (err) throw err;
      });
      await new Promise((resolve) => setTimeout(resolve, 30000000));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await page.reload();
      await navigate();
    }
  }
  await navigate();
}

check();
