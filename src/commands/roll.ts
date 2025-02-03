import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from './index';

type TokenStates =
  | 'dice'
  | 'add-modifier'
  | 'subtract-modifier'
  | 'add-or-subtract'
  | 'dice-or-modifier'
  | 'invalid-roll';

const builder = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Roll a specified set of dice.')
  .addStringOption((option) => option
    .setName('text')
    .setDescription('Ex: 1d20 + 1d4 + 1d10 + 2')
    .setRequired(true)
  );

async function execute(interaction: ChatInputCommandInteraction) {
  const defer = interaction.deferReply();

  const text = interaction.options.getString('text', true);
  const chars = text.replaceAll(/\s/g, '').split("").toReversed();

  if (chars.length === 0) {
    await defer;
    void interaction.editReply('No roll provided')
    return;
  }

  let expectedToken: TokenStates = 'dice';
  const dice: { count: number; sides: number; modifier: number; }[] = [];

  main:
    do {
      switch (expectedToken) {
        case 'dice': {
          let token = '';
          while (chars.length > 0) {
            if (chars[chars.length - 1] === 'd') {
              break;
            }
            token += chars.pop();
          }

          const count = Number(token);
          if (Number.isNaN(count) || count <= 0 || token === '') {
            expectedToken = 'invalid-roll';
            break main;
          }

          chars.pop();

          token = '';
          while (chars.length > 0) {
            if (chars[chars.length - 1] === '+' || chars[chars.length - 1] === '-') {
              break;
            }
            token += chars.pop();
          }

          const sides = Number(token);
          if (Number.isNaN(sides) || sides <= 0 || token === '') {
              expectedToken = 'invalid-roll';
              break main;
          }

          dice.push({ count, sides, modifier: 0 });
          expectedToken = 'add-or-subtract'
          break;
        }
        case 'add-or-subtract': {
          const token = chars.pop();

          switch (token) {
            case '+': {
              expectedToken = 'dice-or-modifier';
              break;
            }
            case '-': {
              expectedToken = 'subtract-modifier';
              break;
            }
            default: {
              expectedToken = 'invalid-roll';
              break main;
            }
          }

          break;
        }
        case 'add-modifier':
        case 'subtract-modifier': {
          let token = '';
          while (chars.length > 0) {
            if (chars[chars.length - 1] === '+' || chars[chars.length - 1] === '-') {
              break;
            }
            token += chars.pop();
          }

          const modifier = Number(token);
          if (Number.isNaN(modifier) || modifier <= 0 || token === '') {
            expectedToken = 'invalid-roll';
            break main;
          }
          dice[dice.length - 1].modifier += modifier * (expectedToken === 'subtract-modifier' ? -1 : 1);
          expectedToken = 'add-or-subtract';
          break;
        }
        case 'dice-or-modifier': {
          for (let i = chars.length - 1; i >= 0; i--) {
            if (chars[i] === 'd') {
              expectedToken = 'dice';
              break;
            }
            if (chars[i] === '+') {
              expectedToken = 'add-modifier';
              break;
            }
            if (chars[i] === '-') {
              expectedToken = 'add-modifier';
              break;
            }
          }

          if (expectedToken === 'dice-or-modifier') {
            expectedToken = 'add-modifier';
          }
          break;
        }
      }
    } while (chars.length > 0);

  if (expectedToken === 'invalid-roll' || expectedToken === 'dice-or-modifier') {
    await defer;
    void interaction.editReply('I don\'t know how to roll that...');
    return;
  }

  await defer;
  void interaction.editReply('Roll payload has been generated');
  console.debug(dice);
}

export default {
  builder,
  execute,
} satisfies Command;
