require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

let session = {};
let albums = [];

bot.start((ctx) => ctx.reply("Festival Cloud Bot Ready 🚀"));

bot.command("album", (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("Usage: /album holi 2026");

  session[ctx.from.id] = {
    name: text,
    files: []
  };

  ctx.reply(`Album started: ${text}\nSend photos then /close`);
});

bot.on("photo", (ctx) => {
  const user = session[ctx.from.id];
  if (!user) return;

  const fileId = ctx.message.photo.pop().file_id;
  user.files.push(fileId);

  ctx.reply(`Added (${user.files.length})`);
});

bot.command("close", async (ctx) => {
  const user = session[ctx.from.id];
  if (!user || user.files.length === 0)
    return ctx.reply("No active album");

  await ctx.reply("Preview Ready", Markup.inlineKeyboard([
    Markup.button.callback("✅ Save", "save"),
    Markup.button.callback("❌ Cancel", "cancel")
  ]));
});

bot.action("save", async (ctx) => {
  const user = session[ctx.from.id];
  if (!user) return;

  const media = user.files.map(id => ({
    type: "photo",
    media: id
  }));

  await bot.telegram.sendMediaGroup(
    process.env.CHANNEL_ID,
    media
  );

  albums.push(user);
  delete session[ctx.from.id];

  ctx.reply("Album Saved ✅");
});

bot.action("cancel", (ctx) => {
  delete session[ctx.from.id];
  ctx.reply("Album Cancelled ❌");
});

bot.command("search", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  const found = albums.find(a => a.name.includes(query));

  if (!found) return ctx.reply("Not found");

  const media = found.files.map(id => ({
    type: "photo",
    media: id
  }));

  await ctx.replyWithMediaGroup(media);
});

bot.launch();
