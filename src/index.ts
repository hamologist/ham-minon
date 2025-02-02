import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import { token } from '../config.json';
import { lookup } from './commands';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(token);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = lookup.get(interaction.commandName);
  if (command === undefined) {
    console.debug('Unregistered command provided', {
      commandName: interaction.commandName,
    });
    return;
  }

  
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error('Error while executing command', {
      commandName: interaction.commandName,
      error,
    });
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});

