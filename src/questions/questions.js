import { validateNumberStringInRange } from '../utils/questionUtils'


export const INITIAL_MODE = {
  type: 'list',
  name: 'mode',
  message: `
Welcome to Quorum Creator!

This tool allows you to easily create bash and docker files to start up a quorum network.
You can control consensus, privacy, network details and more for a customized setup.
Additionaly you can choose to deploy our chain explorer, Cakeshop, to easily view and monitor your network.

We have 3 options to help you start exploring Quorum:

  1.  Quickstart - our 1 click option to create a 3 node raft network with tessera and cakeshop

  2.  Replicate quorum-example 7nodes network - using pregenerated keys from quorum 7nodes example,
      this option allows you to choose the number of nodes (7 max), consensus mechanism, transaction manager, and the option to deploy cakeshop

  3.  Custom network - In addition to the options available in #2, this selection allows for further customization of your network.
      Choose to generate keys, customize ports for both bash and docker, use your own genesis file, or change the network id

Quorum Creator will generate your startup files and everything required to bring up your network.
All you need to do is go to the specified location and run ./start.sh

`,

  choices: [
    { name: 'Quickstart', value: 1 },
    { name: 'Replicate quorum-example 7nodes network', value: 2 },
    { name: 'Create Custom Network', value: 3 },
    { name: 'Exit', value: 4 }
  ]
}

export const NUMBER_NODES = {
  type: 'input', // bug with number type when invalid, can't delete old value
  name: 'numberNodes',
  message: 'Input the number of nodes you would like in your network - 3 is recommended for raft, 5 for istanbul',
  default: '7',
  validate: (input) => validateNumberStringInRange(input, 2, 7)
}

export const CONSENSUS_MODE = {
  type: 'list',
  name: 'consensus',
  message: 'Select your consensus mode - istanbul is a pbft inspired algorithm with transaction finality while raft provides faster blocktimes, transaction finality and on-demand block creation',
  choices: [
    'istanbul',
    'raft',
  ]
}

export const TRANSACTION_MANAGER = {
  type: 'list',
  name: 'transactionManager',
  message: 'Select tessera if you would like to use private transactions in your network',
  choices: [
    'tessera',
    'none',
  ]
}

export const DEPLOYMENT_TYPE = {
  type: 'list',
  name: 'deployment',
  message: 'Would you like to generate bash scripts or a docker-compose file to bring up your network?',
  choices: [
    'bash',
    'docker-compose',
    // 'kubernetes',
    // 'vagrant',
  ]
}

export const CAKESHOP = {
  type: 'confirm',
  name: 'cakeshop',
  message: 'Do you want to run cakeshop with your network?',
  default: false
}

export const KEY_GENERATION = {
  type: 'confirm',
  name: 'generateKeys',
  message: 'Would you like to generate keys for your network?',
  default: false
}

export const NETWORK_ID = {
  type: 'input',
  name: 'networkId',
  message: '10 is the default network id in quorum but you can use a different one',
  default: '10',
}

export const GENESIS_LOCATION = {
  type: 'input', // bug with number type when invalid, can't delete old value
  name: 'genesisLocation',
  message: 'If you would like to use your own genesis file: enter the file location:',
  default: 'none',
}

export const CUSTOMIZE_PORTS = {
  type: 'confirm',
  name: 'customizePorts',
  message: 'Would you like to customize your node ports?',
  default: false
}
