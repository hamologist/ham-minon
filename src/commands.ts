import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

type Command = {
  builder: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
};

export const Ping: Command = {
  builder: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  execute: async (interaction) => {
    void interaction.reply('Pong!');
  },
};

export const lookup = new Map<string, Command>([
  [Ping.builder.name, Ping]
]);
