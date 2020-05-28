import {
  formatNewLine,
  libRootDir,
  readFileToString,
  writeFile,
} from '../utils/fileUtils'
import { getFullNetworkPath } from './networkCreator'
import { buildCakeshopDir } from './cakeshopHelper'
import {
  isTessera,
  isCakeshop,
} from '../model/NetworkConfig'
import { info } from '../utils/log'
import { joinPath } from '../utils/pathUtils'
import {
  cidrhost,
  buildDockerIp,
} from '../utils/subnetUtils'
import { isQuorum260Plus } from './binaryHelper'

export function buildDockerCompose(config) {
  const hasTessera = isTessera(config.network.transactionManager)
  const hasCakeshop = isCakeshop(config.network.cakeshop)

  const quorumDefinitions = readFileToString(joinPath(
    libRootDir(),
    'lib/docker-compose-definitions-quorum.yml',
  ))

  const tesseraDefinitions = hasTessera ? readFileToString(joinPath(
    libRootDir(),
    'lib/docker-compose-definitions-tessera.yml',
  )) : ''

  const cakeshopDefinitions = hasCakeshop ? readFileToString(joinPath(
    libRootDir(),
    'lib/docker-compose-definitions-cakeshop.yml',
  )) : ''

  let services = config.nodes.map((node, i) => {
    let allServices = buildNodeService(config, node, i, hasTessera)
    if (hasTessera) {
      allServices = [allServices, buildTesseraService(config, node, i)].join('')
    }
    return allServices
  })
  if (hasCakeshop) {
    services = [services.join(''), buildCakeshopService(config)]
  }

  return [
    formatNewLine(quorumDefinitions),
    formatNewLine(tesseraDefinitions),
    formatNewLine(cakeshopDefinitions),
    'services:',
    services.join(''),
    buildEndService(config),
  ].join('')
}

export async function createDockerCompose(config) {
  info('Building docker-compose file...')
  const file = buildDockerCompose(config)

  const networkPath = getFullNetworkPath(config)
  const qdata = joinPath(networkPath, 'qdata')

  if (isCakeshop(config.network.cakeshop)) {
    buildCakeshopDir(config, qdata)
  }

  info('Writing start script...')
  const startCommands = `#!/bin/bash
docker-compose up -d`
  const stopCommand = `#!/bin/bash
docker-compose down`

  writeFile(joinPath(networkPath, 'docker-compose.yml'), file, false)
  writeFile(joinPath(networkPath, '.env'), createEnvFile(config, isTessera(config.network.transactionManager)), false)
  writeFile(joinPath(networkPath, 'start.sh'), startCommands, true)
  writeFile(joinPath(networkPath, 'stop.sh'), stopCommand, true)
  info('Done')
}

function createEnvFile(config, hasTessera) {
  let env = `QUORUM_CONSENSUS=${config.network.consensus}
QUORUM_DOCKER_IMAGE=quorumengineering/quorum:${config.network.quorumVersion}
QUORUM_P2P_PORT=${config.containerPorts.quorum.p2pPort}
QUORUM_RAFT_PORT=${config.containerPorts.quorum.raftPort}
QUORUM_RPC_PORT=${config.containerPorts.quorum.rpcPort}
QUORUM_WS_PORT=${config.containerPorts.quorum.wsPort}
DOCKER_IP=${buildDockerIp(config.containerPorts.dockerSubnet, '10')}`
  if (hasTessera) {
    env = env.concat(`
QUORUM_TX_MANAGER_DOCKER_IMAGE=quorumengineering/tessera:${config.network.transactionManager}
TESSERA_P2P_PORT=${config.containerPorts.tm.p2pPort}
TESSERA_3PARTY_PORT=${config.containerPorts.tm.thirdPartyPort}`)
  }
  if (isQuorum260Plus(config.network.quorumVersion)) {
    env = env.concat(`
QUORUM_GETH_ARGS="--allow-insecure-unlock"`)
  }
  return env
}

function buildNodeService(config, node, i, hasTessera) {
  const networkName = config.network.name
  const txManager = hasTessera
    ? `depends_on:
      - txmanager${i + 1}
    environment:
      - PRIVATE_CONFIG=/qdata/tm/tm.ipc`
    : `environment:
      - PRIVATE_CONFIG=ignore`

  return `
  node${i + 1}:
    << : *quorum-def
    hostname: node${i + 1}
    ports:
      - "${node.quorum.rpcPort}:${config.containerPorts.quorum.rpcPort}"
      - "${node.quorum.wsPort}:${config.containerPorts.quorum.wsPort}"
    volumes:
      - ${networkName}-vol${i + 1}:/qdata
      - ./qdata:/examples:ro
    ${txManager}
      - NODE_ID=${i + 1}
    networks:
      ${networkName}-net:
        ipv4_address: ${node.quorum.ip}`
}

function buildTesseraService(config, node, i) {
  const networkName = config.network.name
  return `
  txmanager${i + 1}:
    << : *tx-manager-def
    hostname: txmanager${i + 1}
    ports:
      - "${node.tm.thirdPartyPort}:${config.containerPorts.tm.thirdPartyPort}"
    volumes:
      - ${networkName}-vol${i + 1}:/qdata
      - ./qdata:/examples:ro
    networks:
      ${networkName}-net:
        ipv4_address: ${node.tm.ip}
    environment:
      - NODE_ID=${i + 1}`
}

function buildCakeshopService(config) {
  const networkName = config.network.name
  return `
  cakeshop:
    << : *cakeshop-def
    hostname: cakeshop
    ports:
      - "${config.network.cakeshopPort}:8999"
    volumes:
      - ${networkName}-cakeshopvol:/qdata
      - ./qdata:/examples:ro
    networks:
      ${networkName}-net:
        ipv4_address: ${cidrhost(config.containerPorts.dockerSubnet, 2)}`
}

function buildEndService(config) {
  const networkName = config.network.name
  return `
networks:
  ${networkName}-net:
    name: ${networkName}-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: ${config.containerPorts.dockerSubnet}
volumes:
${config.nodes.map((_, i) => `  "${networkName}-vol${i + 1}":`).join('\n')}
  "${networkName}-cakeshopvol":`
}
