# RDV Préfecture Bot

This bot continuously checks for available appointment slots at a French prefecture. It can cycle through each guichet, bypass the reCaptcha, and check for availability. Once a slot becomes available, a sound notification will play, and a Telegram bot will also notify you of the available appointment as well as sending you the appropriate URL through which to book it.

## Requirements

- Node.js installed
- A [2Captcha](https://2captcha.com/enterpage) account

## Setup

1. Install [Node.js](https://nodejs.org/)
   
2. Create a Telegram bot using BotFather.
   Save the bot token for later. Find the chat ID and save this for later too.

4. Sign up for [2Captcha](https://2captcha.com/enterpage). You will need to top up your account with a dollar or two.
   Save the API key for later.

5. Create a file named `.env` (no extensions) containing the following:

    ```dotenv
    PREFECTURE_URLS=The URL of the page ending with '/cgu' you want to monitor for slots. If there are multiple, you may separate them with a comma
    CAPTCHA_SECRET_KEY=Your 2Captcha API key
    CAPTCHA_ID=input[name="captchaId"]
    TELEGRAM_BOT_TOKEN=Your Telegram bot token
    TELEGRAM_CHAT_ID=Your Telegram chat ID.
    ```
    An example `.env_template` for this file is included in the repo.

## Usage

1. Start the script using the following command in terminal:

    ```sh
    npm start
    ```
