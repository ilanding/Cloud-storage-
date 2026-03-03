require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

let sessions = {};
let albums = [];

// Start
bot.start((ctx) => {
  ctx.reply("Festival Cloud Bot Ready 🚀");
});

// Create Album
bot.command("album", (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");

  if (!text) return ctx.reply("Usage: /album holi 2026");

  sessions[ctx.from.id] = {
    name: text,
    files: []
  };

  ctx.reply(`Album started: ${text}\nSend photos then type /close`);
});

// Receive Photos
bot.on("photo", (ctx) => {
  const session = sessions[ctx.from.id];
  if (!session) return;

  const fileId = ctx.message.photo.pop().file_id;
  session.files.push(fileId);

  ctx.reply(`📸 Added (${session.files.length})`);
});

// Close Album (Preview)
bot.command("close", async (ctx) => {
  const session = sessions[ctx.from.id];

  if (!session || session.files.length === 0) {
    return ctx.reply("No active album ❌");
  }

  await ctx.reply(
    `📦 Album Preview\nName: ${session.name}\nFiles: ${session.files.length}`,
    Markup.inlineKeyboard([
      [Markup.button.callback("✅ Save Album", "save_album")],
      [Markup.button.callback("❌ Cancel", "cancel_album")]
    ])
  );
});

// Save Album
bot.action("save_album", async (ctx) => {
  await ctx.answerCbQuery();

  const session = sessions[ctx.from.id];
  if (!session) return ctx.reply("Session expired ❌");

  try {
    const media = session.files.map(id => ({
      type: "photo",
      media: id
    }));

    await bot.telegram.sendMediaGroup(
      process.env.CHANNEL_ID,
      media
    );

    albums.push(session);
    delete sessions[ctx.from.id];

    ctx.reply("✅ Album Saved Successfully");

  } catch (err) {
    console.log(err);
    ctx.reply("Error while saving ❌");
  }
});

// Cancel Album
bot.action("cancel_album", async (ctx) => {
  await ctx.answerCbQuery();
  delete sessions[ctx.from.id];
  ctx.reply("❌ Album Cancelled");
});

// Search Album
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

// Simple Ping Test
bot.command("ping", (ctx) => {
  ctx.reply("Bot is alive ✅");
});

bot.launch();
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
