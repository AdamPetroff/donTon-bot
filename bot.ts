import { Bot, InlineKeyboard, Context } from "grammy";
import express from "express";
import { Menu } from "@grammyjs/menu";

const bot = new Bot("5563535936:AAEek7k-jbfEvsovR69DuqOcQ_he20UyNYY"); // <-- place your bot token in this string

const port = process.env.PORT || 8081;

type Choices = "rock" | "paper" | "scissors";

type Game = {
  player1: string;
  player2: string;
  player1Choice?: Choices;
  player2Choice?: Choices;
  winner?: 1 | 2;
  isDone?: boolean;
  level: number;
};

const state: {
  players: { [userId: string]: string };
  hasStarted: boolean;
  hasEnded: boolean;
  winner?: number;
  games: Game[];
} = {
  players: {},
  hasStarted: false,
  hasEnded: false,
  games: [],
};

const server = express();
server.use(express.json());

server.get("/players", (req, res) => {
  return res.send(state.players);
});

server.post<undefined, undefined, { userId: string; userName: string }>(
  "/register",
  (req, res) => {
    const userId = req.body.userId;

    state.players[userId] = req.body.userName;
    bot.api.sendMessage(userId, "You've been added to the game");

    res.send();
  }
);

function createGame(player1: string, player2: string, level: number) {
  const game: Game = {
    player1,
    player2,
    level,
  };

  function getRandomChoice() {
    return (["paper", "rock", "scissors"] as Choices[])[
      Math.floor(Math.random() * 3)
    ];
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
    .catch(() => {});
  bot.api
    .sendMessage(player2, `You will be playing with ${state.players[player1]}`)
    .catch(() => {});
  sendChoices(player1).catch(() => {});
  sendChoices(player2).catch(() => {});

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
  } else {
    res.status(401).send("There has to be an event number of players");
  }
});

function getWinner(player1Choice: Choices, player2Choice: Choices): 1 | 2 | 0 {
  if (player1Choice === player2Choice) {
    return 0;
  }
  if (player1Choice === "paper") {
    if (player2Choice === "rock") {
      return 1;
    } else {
      return 2;
    }
  }
  if (player1Choice === "rock") {
    if (player2Choice === "scissors") {
      return 1;
    } else {
      return 2;
    }
  }
  if (player1Choice === "scissors") {
    if (player2Choice === "paper") {
      return 1;
    } else {
      return 2;
    }
  }
  return 0;
}

server.listen(port);

console.log("listening on port: ", port);

function sendChoices(chatId: string) {
  const inlineKeyboard = new InlineKeyboard()
    .text("rock", "rock")
    .row()
    .text("paper", "paper")
    .row()
    .text("scissors", "scissors");

  return bot.api
    .sendMessage(chatId, "Choose your weapon", {
      reply_markup: inlineKeyboard,
    })
    .catch(() => {});
}

const menu = new Menu("menu")
  .row()
  .text("begin", begin)
  .text("test register", register)
  .text("register 15 bots", registerBots)
  .text("start competition", begin);

bot.use(menu);

bot.command("start", async (ctx) => {
  await ctx.reply("Here is your menu", { reply_markup: menu });
});

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
  } else {
    ctx.reply("There has to be an event number of players");
  }
});

bot.command("game", ({ from }) => sendChoices(String(from?.id)));

function _register(userId: string, userName: string) {
  state.players[userId] = userName;
  bot.api.sendMessage(userId, "You've been added to the game");
}

function register(ctx: Context) {
  const userId = String(ctx.from?.id);

  const userName = ctx.from?.username
    ? "@" + ctx.from.username
    : ctx.from?.first_name + " " + ctx.from?.last_name;

  _register(userId, userName);
}

bot.command("register", register);

function registerBots(ctx: Context) {
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

bot.command("web", async (ctx) => {
  const keyboard = new InlineKeyboard().game("Start jesus");
  // Pass the name of the game you created in BotFather, for example "my_game".
  // await ctx.replyWithGame("jesus", { reply_markup: keyboard });

  const chatId = ctx.from?.id;
  if (chatId) {
    await ctx.api.sendGame(chatId, "jesus", { reply_markup: keyboard });
  }
});

bot.command("players", (ctx) => {
  const message = Object.values(state.players).join(", ");
  if (message) ctx.reply(message);
});

bot.command("games1", (ctx) => {
  ctx.reply(
    JSON.stringify(
      state.games.filter(({ level }) => level === 1),
      undefined,
      2
    )
  );
});
bot.command("games2", (ctx) => {
  ctx.reply(
    JSON.stringify(
      state.games.filter(({ level }) => level === 2),
      undefined,
      2
    )
  );
});
bot.command("games3", (ctx) => {
  ctx.reply(
    JSON.stringify(
      state.games.filter(({ level }) => level === 3),
      undefined,
      2
    )
  );
});
bot.command("games4", (ctx) => {
  ctx.reply(
    JSON.stringify(
      state.games.filter(({ level }) => level === 4),
      undefined,
      2
    )
  );
});

function judgeGame(game: Game, ctx?: Context) {
  if (game.player1Choice && game.player2Choice && !game.isDone) {
    const winner = getWinner(game.player1Choice, game.player2Choice);
    if (winner === 0) {
      ctx?.reply("it's a draw");

      game.isDone = true;

      createGame(game.player1, game.player2, game.level);

      return;
    } else {
      const winnerId = winner === 1 ? game.player1 : game.player2;
      const loserId = winner === 1 ? game.player2 : game.player1;
      bot.api.sendMessage(loserId, "You lost").catch(() => {});
      bot.api.sendMessage(winnerId, "You won").catch(() => {});

      const nextLevel = game.level + 1;
      const randomWinnerGameIndex = state.games.findIndex(
        ({ winner, isDone, level }) => winner && !isDone && level === game.level
      );

      if (randomWinnerGameIndex !== -1) {
        const randomGame = state.games[randomWinnerGameIndex];
        const winnerToPairWith =
          randomGame.winner === 1 ? randomGame.player1 : randomGame.player2;

        game.isDone = true;
        randomGame.isDone = true;

        createGame(winnerId, winnerToPairWith, nextLevel);
      } else {
        game.winner = winner;
        if (state.games.filter((item) => !item.isDone).length === 1) {
          bot.api.sendMessage(winnerId, "You won everything").catch(() => {});

          Object.keys(state.players).forEach((id) => {
            bot.api
              .sendMessage(id, `${state.players[winnerId]} won the competition`)
              .catch(() => {});
          });
        }
      }
    }
  }
}

function handleChoice(choice: Choices, ctx: Context) {
  const userId = String(ctx.from?.id);

  const gameIndex = state.games.findIndex(
    (item) =>
      (item.player1 === userId || item.player2 === userId) &&
      !item.winner &&
      !item.isDone
  );

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

bot.on("callback_query:game_short_name", async (ctx) => {
  const url = `https://chapie-test-test.herokuapp.com/?userId=${ctx.from.id}&userName=${ctx.from.username}&test=4`;
  await ctx.answerCallbackQuery({
    url,
  });
});

// Start the bot (using long polling)
bot.start();

bot.init().then(() => {
  const {
    can_join_groups,
    can_read_all_group_messages,
    supports_inline_queries,
  } = bot.botInfo;
  console.log({
    can_join_groups,
    can_read_all_group_messages,
    supports_inline_queries,
  });
});
