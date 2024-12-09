# RDV Préfecture

Cette application permet de vérifier en continu la disponibilité des créneaux sur le site des Yvelines. En cas de disponibilité, une alerte sonore est déclenchée pour informer l'utilisateur.

## Prérequis

- Node.js installé
- Un abonnement à [2Captcha](https://2captcha.com/enterpage) pour résoudre les captchas

## Installation

1. Créez un fichier `.env` contenant les variables suivantes :

    ```dotenv
    PREFECTURE_URL=l'URL de la page des RDV (l'URL peut varier selon le type de titre)
    CAPTCHA_SECRET_KEY=la clé secrète de 2Captcha (à générer dans le back-office après l'achat d'un solde)
    CAPTCHA_ID='#captchaFR_CaptchaImage'
    ```

2. Exécutez la commande suivante dans le terminal pour démarrer l'application :

    ```sh
    npm start
    ```
