#!/usr/bin/env node
/**
 * fhir-cli — The developer toolkit for building FHIR applications.
 *
 * Entry point: registers all commands with Commander and parses argv.
 */
import { Command } from 'commander';
import { newCommand } from './commands/new.js';
import { resourceCommand } from './commands/resource.js';
import { queryCommand } from './commands/query.js';
import { validateCommand } from './commands/validate.js';
import { pathCommand } from './commands/path.js';
import { igCommand } from './commands/ig.js';
import { doctorCommand } from './commands/doctor.js';
import { engineCommand } from './commands/engine.js';

const program = new Command();

program
  .name('fhir')
  .description('The developer toolkit for building FHIR applications')
  .version('0.3.0');

// Register commands
program.addCommand(newCommand);
program.addCommand(resourceCommand);
program.addCommand(queryCommand);
program.addCommand(validateCommand);
program.addCommand(pathCommand);
program.addCommand(igCommand);
program.addCommand(doctorCommand);
program.addCommand(engineCommand);

program.parse(process.argv);
