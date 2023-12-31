import { Command } from "../command";
import {
  CommandInteraction,
  Events,
  Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { logger } from "../../config";
import { actionManager } from "./actions";

enum State {
  Connected = "connected",
  Disconnected = "disconnected",
}

class AssistCommand extends Command {
  private state: State = State.Disconnected;

  constructor() {
    const builder = new SlashCommandBuilder()
      .setName("assist")
      .setDescription("Evokes virtual assistant");

    super(builder);
  }

  public async execute(interaction: CommandInteraction): Promise<void> {
    if (this.state === State.Connected) {
      await interaction.reply({
        content: "Already connected to voice channel",
        ephemeral: true,
      });

      return;
    }

    const { user, client, guild } = interaction;

    const channel = guild?.members.cache.get(user.id)?.voice.channel;

    if (!channel) {
      await interaction.reply({
        content: "Only voice channel members can perform this action",
        ephemeral: true,
      });

      return;
    }

    const voiceConnection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    this.setState(State.Connected);

    const reply = await interaction.reply({
      components: [actionManager.rowComponent],
    });

    const interactionListener = async (interaction: Interaction) => {
      if (!interaction.isButton()) {
        return;
      }

      const action = actionManager.get(interaction.customId);

      if (!action) {
        logger.warn(`Action '${interaction.customId}' not found`);

        return;
      }

      try {
        await action.execute(interaction);
      } catch (err) {
        logger.error(
          `Error while executing action '${interaction.customId}' - ${err}`,
        );
      }
    };

    client.on(Events.InteractionCreate, interactionListener);

    const disconnectListener = () => {
      client.removeListener("interactionCreate", interactionListener);

      reply.delete();

      this.setState(State.Disconnected);

      actionManager.clear();
    };

    voiceConnection.on(VoiceConnectionStatus.Disconnected, disconnectListener);
    voiceConnection.on(VoiceConnectionStatus.Destroyed, disconnectListener);
  }

  private setState(state: State): void {
    this.state = state;

    logger.info(`Assist command state changed to '${state}'`);
  }
}

export default new AssistCommand();
