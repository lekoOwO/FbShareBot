const { Bot } = require('grammy')

const bot = new Bot(process.env.token);

const DOMAIN = {
    "FACEBOOK": "FACEBOOK",
    "INSTAGRAM": "INSTAGRAM"
};
Object.freeze(DOMAIN);

function shortenUrl(url) {
    const rules = {
        [DOMAIN.FACEBOOK]: [
            [url => url.pathname === "/permalink.php", url => url.searchParams.get("story_fbid")],
            [url => /^\/groups\/\d+\/?$/.test(url.pathname), url => url.searchParams.get("multi_permalinks")],
        ],
        [DOMAIN.INSTAGRAM]: [
            [url => ["instagram.com", "www.instagram.com"].includes(url.hostname), url => url.pathname],
        ]
    };
    const regexs = {
        [DOMAIN.FACEBOOK]: [
            /^\/(?:.+)\/posts\/(\d+)\/?$/,
            /^\/groups\/(?:.+)\/user\/(\d+)\/?$/,
            /^\/(\d+)\/?$/
        ]
    };

    try {
        url = new URL(url);
        const path = url.pathname;

        let id, type;
        for(const [domain, [m, r]] of Object.entries(rules)) {
            if (m(url)) {
                id = r(url);
                type = domain;
                break;
            }
        }

        if (!id) {
            for(const [domain, dregexs] of Object.entries(regexs)) {
                for (const regex of dregexs) {
                    if (regex.test(path)) {
                        id = path.match(regex)[1];
                        type = domain;
                        break
                    }
                }
                if (id) break;
            }
        }

        switch(type) {
            case DOMAIN.FACEBOOK:
                return `fb.com/${id}`;
            case DOMAIN.INSTAGRAM:
                return `instagr.am/${id}`;
            default:
                return null;
        }
    } catch (e) {
        console.error(e);
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
        }
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