"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const express_1 = __importDefault(require("express"));
const menu_1 = require("@grammyjs/menu");
const bot = new grammy_1.Bot("5563535936:AAEek7k-jbfEvsovR69DuqOcQ_he20UyNYY"); // <-- place your bot token in this string
const port = process.env.PORT || 8081;
const state = {
    players: {},
    hasStarted: false,
    hasEnded: false,
    games: [],
};
const server = (0, express_1.default)();
server.use(express_1.default.json());
server.get("/players", (req, res) => {
    return res.send(state.players);
});
server.post("/register", (req, res) => {
    const userId = req.body.userId;
    state.players[userId] = req.body.userName;
    bot.api.sendMessage(userId, "You've been added to the game");
    res.send();
});
function createGame(player1, player2, level) {
    const game = {
        player1,
        player2,
        level,
    };
    function getRandomChoice() {
        return ["paper", "rock", "scissors"][Math.floor(Math.random() * 3)];
    }
    const player1IsBot = player1.includes("bot");
    const player2IsBot = player2.includes("bot");
    if (player1IsBot) {
        game.player1Choice = getRandomChoice();
    }
    if (player2IsBot) {
        game.player2Choice = getRandomChoice();
    }
    bot.api
        .sendMessage(player1, `You will be playing with ${state.players[player2]}`)
        .catch(() => { });
    bot.api
        .sendMessage(player2, `You will be playing with ${state.players[player1]}`)
        .catch(() => { });
    sendChoices(player1).catch(() => { });
    sendChoices(player2).catch(() => { });
    state.games.push(game);
    if (player1IsBot && player2IsBot) {
        judgeGame(game);
    }
}
function pairGames() {
    state.games = [];
    const keys = Object.keys(state.players);
    for (let i = 0; i < keys.length / 2; i++) {
        const player1 = keys[i];
        const player2 = keys[keys.length - 1 - i];
        createGame(player1, player2, 1);
    }
    state.hasStarted = true;
}
function begin() {
    if (Object.keys(state.players).length % 2 === 0) {
        pairGames();
    }
}
server.post("/begin", (req, res) => {
    if (Object.keys(state.players).length % 2 === 0) {
        pairGames();
        res.send();
    }
    else {
        res.status(401).send("There has to be an event number of players");
    }
});
function getWinner(player1Choice, player2Choice) {
    if (player1Choice === player2Choice) {
        return 0;
    }
    if (player1Choice === "paper") {
        if (player2Choice === "rock") {
            return 1;
        }
        else {
            return 2;
        }
    }
    if (player1Choice === "rock") {
        if (player2Choice === "scissors") {
            return 1;
        }
        else {
            return 2;
        }
    }
    if (player1Choice === "scissors") {
        if (player2Choice === "paper") {
            return 1;
        }
        else {
            return 2;
        }
    }
    return 0;
}
server.listen(port);
console.log("listening on port: ", port);
function sendChoices(chatId) {
    const inlineKeyboard = new grammy_1.InlineKeyboard()
        .text("rock", "rock")
        .row()
        .text("paper", "paper")
        .row()
        .text("scissors", "scissors");
    return bot.api
        .sendMessage(chatId, "Choose your weapon", {
        reply_markup: inlineKeyboard,
    })
        .catch(() => { });
}
const menu = new menu_1.Menu("menu")
    .row()
    .text("begin", begin)
    .text("test register", register)
    .text("register 15 bots", registerBots)
    .text("start competition", begin);
bot.use(menu);
bot.command("start", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply("Here is your menu", { reply_markup: menu });
}));
bot.command("commands", (ctx) => {
    ctx.reply(`
/register
/registerbots
/players
/games
/begin
  `);
});
bot.command("begin", (ctx) => {
    if (Object.keys(state.players).length % 2 === 0) {
        pairGames();
        ctx.reply("begun");
    }
    else {
        ctx.reply("There has to be an event number of players");
    }
});
bot.command("game", ({ from }) => sendChoices(String(from === null || from === void 0 ? void 0 : from.id)));
function _register(userId, userName) {
    state.players[userId] = userName;
    bot.api.sendMessage(userId, "You've been added to the game");
}
function register(ctx) {
    var _a, _b, _c, _d;
    const userId = String((_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id);
    const userName = ((_b = ctx.from) === null || _b === void 0 ? void 0 : _b.username)
        ? "@" + ctx.from.username
        : ((_c = ctx.from) === null || _c === void 0 ? void 0 : _c.first_name) + " " + ((_d = ctx.from) === null || _d === void 0 ? void 0 : _d.last_name);
    _register(userId, userName);
}
bot.command("register", register);
function registerBots(ctx) {
    state.players["bot0"] = "bot0";
    state.players["bot1"] = "bot1";
    state.players["bot2"] = "bot2";
    state.players["bot3"] = "bot3";
    state.players["bot4"] = "bot4";
    state.players["bot5"] = "bot5";
    state.players["bot6"] = "bot6";
    state.players["bot7"] = "bot7";
    state.players["bot8"] = "bot8";
    state.players["bot9"] = "bot9";
    state.players["bot10"] = "bot10";
    state.players["bot11"] = "bot11";
    state.players["bot12"] = "bot12";
    state.players["bot13"] = "bot13";
    state.players["bot14"] = "bot14";
    ctx.reply("bots added");
}
bot.command("registerbots", registerBots);
bot.command("web", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const keyboard = new grammy_1.InlineKeyboard().game("Start jesus");
    // Pass the name of the game you created in BotFather, for example "my_game".
    // await ctx.replyWithGame("jesus", { reply_markup: keyboard });
    const chatId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    if (chatId) {
        yield ctx.api.sendGame(chatId, "jesus", { reply_markup: keyboard });
    }
}));
bot.command("players", (ctx) => {
    const message = Object.values(state.players).join(", ");
    if (message)
        ctx.reply(message);
});
bot.command("games1", (ctx) => {
    ctx.reply(JSON.stringify(state.games.filter(({ level }) => level === 1), undefined, 2));
});
bot.command("games2", (ctx) => {
    ctx.reply(JSON.stringify(state.games.filter(({ level }) => level === 2), undefined, 2));
});
bot.command("games3", (ctx) => {
    ctx.reply(JSON.stringify(state.games.filter(({ level }) => level === 3), undefined, 2));
});
bot.command("games4", (ctx) => {
    ctx.reply(JSON.stringify(state.games.filter(({ level }) => level === 4), undefined, 2));
});
function judgeGame(game, ctx) {
    if (game.player1Choice && game.player2Choice && !game.isDone) {
        const winner = getWinner(game.player1Choice, game.player2Choice);
        if (winner === 0) {
            ctx === null || ctx === void 0 ? void 0 : ctx.reply("it's a draw");
            game.isDone = true;
            createGame(game.player1, game.player2, game.level);
            return;
        }
        else {
            const winnerId = winner === 1 ? game.player1 : game.player2;
            const loserId = winner === 1 ? game.player2 : game.player1;
            bot.api.sendMessage(loserId, "You lost").catch(() => { });
            bot.api.sendMessage(winnerId, "You won").catch(() => { });
            const nextLevel = game.level + 1;
            const randomWinnerGameIndex = state.games.findIndex(({ winner, isDone, level }) => winner && !isDone && level === game.level);
            if (randomWinnerGameIndex !== -1) {
                const randomGame = state.games[randomWinnerGameIndex];
                const winnerToPairWith = randomGame.winner === 1 ? randomGame.player1 : randomGame.player2;
                game.isDone = true;
                randomGame.isDone = true;
                createGame(winnerId, winnerToPairWith, nextLevel);
            }
            else {
                game.winner = winner;
                if (state.games.filter((item) => !item.isDone).length === 1) {
                    bot.api.sendMessage(winnerId, "You won everything").catch(() => { });
                    Object.keys(state.players).forEach((id) => {
                        bot.api
                            .sendMessage(id, `${state.players[winnerId]} won the competition`)
                            .catch(() => { });
                    });
                }
            }
        }
    }
}
function handleChoice(choice, ctx) {
    var _a;
    const userId = String((_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id);
    const gameIndex = state.games.findIndex((item) => (item.player1 === userId || item.player2 === userId) &&
        !item.winner &&
        !item.isDone);
    if (gameIndex === -1) {
        ctx.reply("game not found");
        return;
    }
    const game = state.games[gameIndex];
    if (game.player1 === userId) {
        game.player1Choice = choice;
    }
    if (game.player2 === userId) {
        game.player2Choice = choice;
    }
    judgeGame(game, ctx);
}
bot.callbackQuery("rock", (ctx) => handleChoice("rock", ctx));
bot.callbackQuery("paper", (ctx) => handleChoice("paper", ctx));
bot.callbackQuery("scissors", (ctx) => handleChoice("scissors", ctx));
bot.on("message", (ctx) => {
    if (ctx.message.text && /myid/.test(ctx.message.text)) {
        ctx.reply(String(ctx.from.id));
    }
});
bot.on("callback_query:game_short_name", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://chapie-test-test.herokuapp.com/?userId=${ctx.from.id}&userName=${ctx.from.username}&test=4`;
    yield ctx.answerCallbackQuery({
        url,
    });
}));
// Start the bot (using long polling)
bot.start();
bot.init().then(() => {
    const { can_join_groups, can_read_all_group_messages, supports_inline_queries, } = bot.botInfo;
    console.log({
        can_join_groups,
        can_read_all_group_messages,
        supports_inline_queries,
    });
});
