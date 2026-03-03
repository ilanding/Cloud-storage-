require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

let sessions = {};
let albums = [];

// START
bot.start((ctx) => {
  ctx.reply("🚀 Festival Cloud Bot Ready");
});

// CREATE ALBUM
bot.command("album", async (ctx) => {
  try {
    const name = ctx.message.text.split(" ").slice(1).join(" ");
    if (!name) return ctx.reply("Usage: /album name");

    sessions[ctx.from.id] = { name, files: [] };
    await ctx.reply("📂 Album started. Send photos then /close");
  } catch (err) {
    console.log(err);
  }
});

// RECEIVE PHOTO
bot.on("photo", async (ctx) => {
  try {
    const session = sessions[ctx.from.id];
    if (!session) return;

    const fileId = ctx.message.photo.pop().file_id;

    if (session.files.includes(fileId)) {
      return ctx.reply("⚠ Duplicate photo");
    }

    session.files.push(fileId);
    await ctx.reply(`📸 Added (${session.files.length})`);
  } catch (err) {
    console.log(err);
  }
});

// CLOSE → PREVIEW
bot.command("close", async (ctx) => {
  try {
    const session = sessions[ctx.from.id];
    if (!session || session.files.length === 0)
      return ctx.reply("❌ No active album");

    await ctx.reply(
      `📦 Preview\n${session.name}\nFiles: ${session.files.length}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("✅ Save", "save_album")],
        [Markup.button.callback("❌ Cancel", "cancel_album")]
      ])
    );
  } catch (err) {
    console.log(err);
  }
});

// SAVE
bot.action("save_album", async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const session = sessions[ctx.from.id];
    if (!session) return ctx.reply("❌ Session expired");

    const media = session.files.map((id) => ({
      type: "photo",
      media: id
    }));

    await bot.telegram.sendMediaGroup(process.env.CHANNEL_ID, media);

    albums.push(session);
    delete sessions[ctx.from.id];

    await ctx.reply("✅ Album Saved to Channel");
  } catch (err) {
    console.log(err);
    ctx.reply("⚠ Error while saving");
  }
});

// CANCEL
bot.action("cancel_album", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    delete sessions[ctx.from.id];
    await ctx.reply("❌ Album Cancelled");
  } catch (err) {
    console.log(err);
  }
});

// SEARCH
bot.command("search", async (ctx) => {
  try {
    const query = ctx.message.text.split(" ").slice(1).join(" ");
    if (!query) return ctx.reply("Usage: /search name");

    const found = albums.find((a) =>
      a.name.toLowerCase().includes(query.toLowerCase())
    );

    if (!found) return ctx.reply("❌ Album not found");

    const media = found.files.map((id) => ({
      type: "photo",
      media: id
    }));

    await ctx.replyWithMediaGroup(media);
  } catch (err) {
    console.log(err);
  }
});

// LIST ALL ALBUMS
bot.command("albums", async (ctx) => {
  try {
    if (albums.length === 0)
      return ctx.reply("📂 No albums saved yet");

    let text = "📁 Your Albums:\n\n";
    albums.forEach((a, i) => {
      text += `${i + 1}. ${a.name} (${a.files.length} files)\n`;
    });

    await ctx.reply(text);
  } catch (err) {
    console.log(err);
  }
});

// DELETE
bot.command("delete", async (ctx) => {
  try {
    const name = ctx.message.text.split(" ").slice(1).join(" ");
    if (!name) return ctx.reply("Usage: /delete name");

    const index = albums.findIndex((a) =>
      a.name.toLowerCase() === name.toLowerCase()
    );

    if (index === -1) return ctx.reply("❌ Album not found");

    albums.splice(index, 1);
    await ctx.reply("🗑 Album deleted");
  } catch (err) {
    console.log(err);
  }
});

// STATS
bot.command("stats", async (ctx) => {
  try {
    let totalPhotos = 0;
    albums.forEach((a) => (totalPhotos += a.files.length));

    await ctx.reply(
      `📊 Stats\nAlbums: ${albums.length}\nPhotos: ${totalPhotos}`
    );
  } catch (err) {
    console.log(err);
  }
});

bot.launch();
