import { CHAT_ID, TELEGRAM_BOT_TOKEN } from "./constents";


export const sendAlert = (message: string) => {
  try {
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.log("Chat bot error", err);
  }
};