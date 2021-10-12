const { Bot } = require('grammy')

const bot = new Bot(process.env.token);

function shortenUrl(url) {
    try {
        url = new URL(url);
        const path = url.pathname;
        let fbid = null;

        if (path === "/permalink.php") {
            fbid = url.searchParams.get("story_fbid");
        } else {
            for (const regex of [
                /^\/(?:.+)\/posts\/(\d+)\/?$/,
                /^\/groups\/(?:.+)\/user\/(\d+)\/?$/,
                /^\/(\d+)\/?$/
            ]) {
                if (regex.test(path)) {
                    fbid = path.match(regex)[1];
                    break
                }
            }
        }
        return fbid ? `fb.com/${fbid}` : null;
    } catch (e) {
        return null;
    }
}

bot.on('message', ctx => {
    const text = ctx.message.text;
    console.log(`[*] Message: ${text}`)

    const reply = shortenUrl(text) || "Not Found."
    ctx.reply(reply);
})

bot.on("inline_query", (ctx) => {
    const text = ctx.inlineQuery.query;
    console.log(`[*] Inline Message: ${text}`)

    const reply = shortenUrl(text);
    ctx.answerInlineQuery([reply ? {
        type: "article",
        id: reply,
        title: "Shortened URL",
        input_message_content: {
            message_text:
                `<a href="${reply}">${reply}</a>`,
            parse_mode: "HTML",
        },
        url: reply,
    } : {
        type: "article",
        id: "NOT_FOUND",
        title: "NOT FOUND",
        input_message_content: {
            message_text:
                `FB URL NOT FOUND.`
        }
    }])
});
bot.catch((err) => { })
bot.start()