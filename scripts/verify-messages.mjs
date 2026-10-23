import { messages } from "../src/i18n/messages.mjs";
import { validateMessages } from "../src/i18n/validate-messages.mjs";

const count = validateMessages(messages);
console.log(
  `Validated ${count} messages in ${Object.keys(messages).length} locales.`,
);
