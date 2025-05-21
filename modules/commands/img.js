const fetch = require("node-fetch");
const fs = require("fs");

module.exports.config = {
  name: "img",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "XAAV",
  description: "Generate an image using DALL-E Mini (Craiyon)",
  usePrefix: true,
  commandCategory: "img",
  usages: "img [prompt]",
  cooldowns: 10,
};

module.exports.run = async function ({ api, event, args }) {
  const prompt = args.join(" ");
  if (!prompt) {
    api.sendMessage("Please specify a prompt for the image!", event.threadID, event.messageID);
    api.setMessageReaction("❓", event.messageID, () => {}, true);
    return;
  }

  api.setMessageReaction("⏱️", event.messageID, () => {}, true);

  try {
    const res = await fetch("https://backend.craiyon.com/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();

    if (!data.images || !data.images.length) throw new Error("No image generated.");

    // Send only the first image for simplicity (you can loop to send all 9 if you want)
    const imgBuffer = Buffer.from(data.images[0], 'base64');
    const imgPath = `./miniimg_${Date.now()}.png`;
    fs.writeFileSync(imgPath, imgBuffer);

    api.sendMessage(
      { body: `Here is your image for: "${prompt}"`, attachment: fs.createReadStream(imgPath) },
      event.threadID,
      (err) => {
        fs.unlinkSync(imgPath);
        api.setMessageReaction(err ? "⚠️" : "", event.messageID, () => {}, true);
      },
      event.messageID
    );
  } catch (error) {
    api.sendMessage(
      "⚠️ Something went wrong: " + error,
      event.threadID,
      event.messageID,
    );
    api.setMessageReaction("⚠️", event.messageID, () => {}, true);
  }
};
