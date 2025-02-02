import { REST, Routes, type RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { clientId, guildId, token } from '../../config.json';
import { lookup } from '../commands';

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

const payload: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
for (const command of lookup.values()) {
  payload.push(command.builder.toJSON());
}


try {
  console.log('Started refreshing the slash commands.');

  // The put method is used to fully refresh all commands in the guild with the current set
  await rest.put(
    Routes.applicationGuildCommands(clientId, guildId),
    { body: payload },
  );

  console.log('Successfully reloaded the slash commands.');
} catch (error) {
  // And of course, make sure you catch and log any errors!
  console.error(error);
}

