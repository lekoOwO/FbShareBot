const { Bot } = require('grammy')

const bot = new Bot(process.env.token);

function shortenUrl(url) {
    const rules = [
        [url => url.pathname === "/permalink.php", url => url.searchParams.get("story_fbid")],
        [url => /^\/groups\/\d+\/?$/.test(url.pathname), url => url.searchParams.get("multi_permalinks")]
    ];
    const regexs = [
        /^\/(?:.+)\/posts\/(\d+)\/?$/,
        /^\/groups\/(?:.+)\/user\/(\d+)\/?$/,
        /^\/(\d+)\/?$/
    ];

    try {
        url = new URL(url);
        const path = url.pathname;
        let fbid = null;

        for(const [m, r] of rules) {
            if (m(url)) {
                fbid = r(url);
                break;
            }
        }

        if (fbid === null) {
            for (const regex of regexs) {
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