import { Context } from "https://deno.land/x/grammy@v1.8.3/context.ts";

export async function onboarding(ctx: Context) {
  console.log("help command");
  await ctx.reply(
    `
👋 Привет! Я бот для генерации фотографий. 
Отправь мне фотографию, добавь описание и я сгенерирую для тебя новое фото

Правила простые:
1) Выбери любую фотографию из галереи
2) Добавь в описании, что ты хочешь сделать с этой фотографией
3) Отправь мне
4) Я сгенерирую для тебя новое фото

Ниже приведены скриншоты примеров сгенерированных фотографий
`,
  );
  await ctx.replyWithMediaGroup(
    [
      {
        type: "photo",
        media:
          "AgACAgIAAxkBAAICm2jQFzT8662KSxUsHSPbrLtRA-ULAAKt-DEbDMWJSkYgtCiYMdZFAQADAgADcwADNgQ",
      },
      {
        type: "photo",
        media:
          "AgACAgIAAxkBAAICpWjQF8QSOPvLEH_KIfEQYQ6p6I0-AAK9-DEbDMWJSjD1gT0WycbMAQADAgADcwADNgQ",
      },
      {
        type: "photo",
        media:
          "AgACAgIAAxkBAAICp2jQF8vZyditRe539WVwbL063bRSAAK--DEbDMWJShLXg5ux5CBUAQADAgADcwADNgQ",
      },
      {
        type: "photo",
        media:
          "AgACAgIAAxkBAAICqWjQF9LM2HeByDKK0e-y3crWWk-VAAK_-DEbDMWJShMVPqgESbktAQADAgADcwADNgQ",
      },
    ],
  );
  await ctx.reply(
    `⚠️ Важно:

- Опиши максимально подробно, что ты хочешь сделать со своей фотографией
- Если не добавишь описание, то я сгенерирую фотографию в мультяшном стиле
- Генерировать картинку только по описанию пока что не умею
- Иногда у меня могут быть проблемы с генерацией. В таком случае попытка не будет засчитана, и ты сможешь попробовать снова

📝 У тебя изначально есть 2 генерации. 
Попробуй, и если понравится, можешь купить дополнительные генерации.

💫 Для покупки дополнительных генераций нажми /subscriptions
🔢 Для просмотра количества доступных генераций нажми /limits

      `,
  );
}
