require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

let sessions = {};
let albums = [];

bot.start((ctx) => ctx.reply("Bot Ready 🚀"));

// Album Start
bot.command("album", async (ctx) => {
  const name = ctx.message.text.split(" ").slice(1).join(" ");
  if (!name) return ctx.reply("Usage: /album holi 2026");

  sessions[ctx.from.id] = { name, files: [] };
  await ctx.reply("Album started. Send photos then /close");
});

// Receive Photo
bot.on("photo", async (ctx) => {
  const session = sessions[ctx.from.id];
  if (!session) return;

  const fileId = ctx.message.photo.pop().file_id;
  session.files.push(fileId);

  await ctx.reply(`📸 Added (${session.files.length})`);
});

// Close → Preview
bot.command("close", async (ctx) => {
  const session = sessions[ctx.from.id];
  if (!session || session.files.length === 0)
    return ctx.reply("No active album ❌");

  await ctx.reply(
    `📦 Album Preview\n${session.name}\nFiles: ${session.files.length}`,
    Markup.inlineKeyboard([
      [Markup.button.callback("✅ Save Album", "save_album")],
      [Markup.button.callback("❌ Cancel", "cancel_album")]
    ])
  );
});

// Save
bot.action("save_album", async (ctx) => {
  await ctx.answerCbQuery();

  const session = sessions[ctx.from.id];
  if (!session) return ctx.reply("Session expired ❌");

  const media = session.files.map(id => ({
    type: "photo",
    media: id
  }));

  await bot.telegram.sendMediaGroup(process.env.CHANNEL_ID, media);

  albums.push(session);
  delete sessions[ctx.from.id];

  await ctx.reply("✅ Album Saved");
});

// Cancel
bot.action("cancel_album", async (ctx) => {
  await ctx.answerCbQuery();
  delete sessions[ctx.from.id];
  await ctx.reply("❌ Album Cancelled");
});

// Search
bot.command("search", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) return ctx.reply("Usage: /search holi");

  const found = albums.find(a =>
    a.name.toLowerCase().includes(query.toLowerCase())
  );

  if (!found) return ctx.reply("Album not found ❌");

  const media = found.files.map(id => ({
    type: "photo",
    media: id
  }));

  await ctx.replyWithMediaGroup(media);
});

bot.launch();
