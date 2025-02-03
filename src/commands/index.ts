import { ChatInputCommandInteraction, SlashCommandBuilder, type SlashCommandOptionsOnlyBuilder } from 'discord.js';
import Roll from './roll';

export type Command = {
  builder: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
};

export const Ping: Command = {
  builder: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong.'),
  execute: async (interaction) => {
    void interaction.reply('Pong!');
  },
};


export const lookup = new Map<string, Command>([
  [Ping.builder.name, Ping],
  [Roll.builder.name, Roll],
]);
