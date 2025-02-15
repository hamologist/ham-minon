import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from './index';
import { z } from 'zod';

const invalidPayloadResponseSchema = z.object({
  statusCode: z.literal(400),
  error: z.literal('invalid-payload'),
  message: z.string(),
});

const validPayloadResponseSchema = z.object({
  output: z.string(),
});

const SERVER_ERROR_MESSAGE = 'Something went wrong while attempting to build the emojified message';

const builder = new SlashCommandBuilder()
  .setName('emojify')
  .setDescription('Spice up a message with emojis.')
  .addStringOption((option) => option
    .setName('message')
    .setDescription('This is where you put the message you want to emojify (limit 2000 characters).')
    .setRequired(true)
  );

async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const input = interaction.options.getString('message', true);

  if (input.length === 0) {
    void interaction.editReply('Nothing to emojify :-(')
    return;
  }

  if (input.length > 2000) {
    void interaction.editReply('That message is too big! (Limit: 2000 characters)');
    return;
  }

  const response = await fetch('localhost:3100', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input
    }),
  });
  const json = await response.json();

  if (response.status < 200 || response.status > 299) {
    const errorPayload = invalidPayloadResponseSchema.safeParse(json);

    if (errorPayload.success) {
      void interaction.editReply(errorPayload.data.message);
      return;
    }
    void interaction.editReply(SERVER_ERROR_MESSAGE);
    return;
  }

  const payload = validPayloadResponseSchema.safeParse(json);

  if (!payload.success) {
    void interaction.editReply(SERVER_ERROR_MESSAGE);
    return;
  }

  void interaction.editReply(payload.data.output);
}

export default {
  builder,
  execute,
} satisfies Command;
