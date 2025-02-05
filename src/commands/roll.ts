import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from './index';

type TokenStates =
  | 'dice'
  | 'add-modifier'
  | 'subtract-modifier'
  | 'add-or-subtract'
  | 'dice-or-modifier'
  | 'invalid-roll';

type Dice = {
  count: number;
  sides: number;
  modifier: number;
};

const builder = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Roll a specified set of dice.')
  .addStringOption((option) => option
    .setName('text')
    .setDescription('Ex: 1d20 + 1d4 + 1d10 + 2')
    .setRequired(true)
  );

class InvalidRollError extends Error {}

class InputParser {
  static stopOn = {
    diceSplit: new Set(['d']),
    plusOrMinus: new Set(['+', '-']),
  };
  protected input: string;
  protected nextExpectedToken: TokenStates;
  protected currentIndex: number;
  protected dice: Dice[];

  constructor(input: string) {
    this.input = input;
    this.nextExpectedToken = 'dice';
    this.currentIndex = 0;
    this.dice = [];
  }

  protected buildToken(stopOn: Set<string>) {
    let token = '';
    while (this.currentIndex < this.input.length) {
      if (stopOn.has(this.input[this.currentIndex])) {
        break;
      }
      token += this.input[this.currentIndex];
      this.currentIndex += 1;
    }

    return token;
  }

  protected processDice() {
    let token = this.buildToken(InputParser.stopOn.diceSplit);
    const count = Number(token);
    if (Number.isNaN(count) || count <= 0 || token === '') {
      throw new InvalidRollError();
    }

    this.currentIndex += 1;

    token = this.buildToken(InputParser.stopOn.plusOrMinus);
    const sides = Number(token);
    if (Number.isNaN(sides) || sides <= 0 || token === '') {
      throw new InvalidRollError();
    }

    this.nextExpectedToken = 'add-or-subtract'
    this.dice.push({ count, sides, modifier: 0 });
  }

  protected processAddOrSubtract() {
    const token = this.input[this.currentIndex];
    this.currentIndex += 1;

    switch (token) {
      case '+': {
        this.nextExpectedToken = 'dice-or-modifier';
        break;
      }
      case '-': {
        this.nextExpectedToken = 'subtract-modifier';
        break;
      }
      default: {
        throw new InvalidRollError();
      }
    }
  }

  protected processModifier() {
    let token = this.buildToken(InputParser.stopOn.plusOrMinus);
    const modifier = Number(token);
    if (Number.isNaN(modifier) || modifier <= 0 || token === '') {
      throw new InvalidRollError();
    }
    this.dice[this.dice.length - 1].modifier += modifier * (this.nextExpectedToken === 'subtract-modifier' ? -1 : 1);
    this.nextExpectedToken = 'add-or-subtract';
  }

  protected processDiceOrModifier() {
    for (let i = this.currentIndex; i < this.input.length; i++) {
      if (this.input[i] === 'd') {
        this.nextExpectedToken = 'dice';
        return;
      }
      if (this.input[i] === '+') {
        this.nextExpectedToken = 'add-modifier';
        return;
      }
      if (this.input[i] === '-') {
        this.nextExpectedToken = 'add-modifier';
        return;
      }
    }

    if (this.nextExpectedToken === 'dice-or-modifier') {
      this.nextExpectedToken = 'add-modifier';
    }
  }

  public parse() {
    while (this.currentIndex < this.input.length) {
      switch (this.nextExpectedToken) {
        case 'dice': {
          this.processDice();
          break;
        }
        case 'add-or-subtract': {
          this.processAddOrSubtract();
          break;
        }
        case 'add-modifier':
        case 'subtract-modifier': {
          this.processModifier();
          break;
        }
        case 'dice-or-modifier': {
          this.processDiceOrModifier();
          break;
        }
        default: {
          throw new InvalidRollError();
        }
      }
    }

    if (this.nextExpectedToken === 'dice-or-modifier') {
      throw new InvalidRollError();
    }

    return this.dice;
  }
}

async function execute(interaction: ChatInputCommandInteraction) {
  const defer = interaction.deferReply();

  const text = interaction.options.getString('text', true).replaceAll(/\s/g, '');

  if (text.length === 0) {
    await defer;
    void interaction.editReply('No roll provided')
    return;
  }

  let dice: Dice[];
  try {
    dice = new InputParser(text).parse();
  } catch (err) {
    await defer;
    if (err instanceof InvalidRollError) {
      void interaction.editReply('I don\'t know how to roll that...');
      return;
    }

    void interaction.editReply('Server error while parsing roll.');
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
