import type { Action, Plugin } from '@elizaos/core';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import getLatestPriceUpdatesAction from './actions/actionGetLatestPriceUpdates.ts';
import getLatestPublisherCapsAction from './actions/actionGetLatestPublisherCaps.ts';
import getPriceFeedsAction from './actions/actionGetPriceFeeds.ts';
import getPriceUpdatesStreamAction from './actions/actionGetPriceUpdatesStream.ts';

// Start the loader
const spinner = ora({ text: chalk.cyan('Initializing Pyth Data Plugin...'), spinner: 'dots12', color: 'cyan' }).start();

// Simulate some loading time
await new Promise(resolve => setTimeout(resolve, 1000));

const actions: Action[] = [
  getPriceFeedsAction,
  getPriceUpdatesStreamAction,
  getLatestPriceUpdatesAction,
  getLatestPublisherCapsAction
].map(action => ({
  ...action,
  handler: async (runtime, input) => {
    // Adapt the handler to work with the older runtime interface
    const result = await action.handler(runtime as any, input);
    return result;
  }
}));

// Initial banner with chalk styling
console.log('\n' + chalk.cyan('┌────────────────────────────────────────┐'));
console.log(chalk.cyan('│') + chalk.yellow.bold('          PYTH DATA PLUGIN             ') + chalk.cyan(' │'));
console.log(chalk.cyan('├────────────────────────────────────────┤'));
console.log(chalk.cyan('│') + chalk.white('  Initializing Pyth Data Services...    ') + chalk.cyan('│'));
console.log(chalk.cyan('│') + chalk.white('  Version: 1.0.0                        ') + chalk.cyan('│'));
console.log(chalk.cyan('└────────────────────────────────────────┘'));

// Stop the loader
spinner.succeed(chalk.green('Pyth Data Plugin initialized successfully!'));

// Create a beautiful table for actions
const actionTable = new Table({
  head: [chalk.cyan('Action'), chalk.cyan('H'), chalk.cyan('V'), chalk.cyan('E'), chalk.cyan('Similes')],
  style: { head: [], border: ['cyan'] }
});

// Format and add action information
actions.forEach(action => {
  actionTable.push([
    chalk.white(action.name),
    typeof action.handler === 'function' ? chalk.green('✓') : chalk.red('✗'),
    typeof action.validate === 'function' ? chalk.green('✓') : chalk.red('✗'),
    action.examples?.length > 0 ? chalk.green('✓') : chalk.red('✗'),
    chalk.gray(action.similes?.join(', ') || 'none')
  ]);
});

// Display the action table
console.log('\n' + actionTable.toString());

// Plugin status with a nice table
const statusTable = new Table({ style: { border: ['cyan'] } });

statusTable.push([chalk.cyan('Plugin Status')], [chalk.white('Name    : ') + chalk.yellow('pyth-data')], [
  chalk.white('Actions : ') + chalk.green(actions.length.toString())
], [chalk.white('Status  : ') + chalk.green('Loaded & Ready')]);

console.log('\n' + statusTable.toString() + '\n');

export const pythDataPlugin: Plugin = {
  name: 'pyth-data',
  description: 'Pyth Data Plugin for price feeds and market data',
  actions,
  evaluators: []
};

export default pythDataPlugin;
