import "./dotenv";

import { Client, Events, GatewayIntentBits } from "discord.js";
import { commandManager, logger } from "./config";

commandManager.load();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once(Events.ClientReady, (c) => {
  logger.info(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.GuildAvailable, (guild) => {
  commandManager.synchronize(guild.id);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commandManager.get(interaction.commandName);

  if (!command) {
    logger.warn(`Command '${interaction.commandName}' not found`);

    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.warn(
      `Error while executing command '${interaction.commandName}' - ${err}`,
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
