import { Logger } from '../utils/Logger'
import { ConnectionContext } from '../types/ConnectionContext'
import { TransportType, TransportStatus, PeerInfo, StorageKey, StorageKeyReturnType } from '..'
import { PeerManager } from '../managers/PeerManager'
import { ArrayElem } from '../managers/StorageManager'
import { CommunicationClient } from './clients/CommunicationClient'

const logger = new Logger('Transport')

export abstract class Transport<
  T extends PeerInfo = PeerInfo,
  K extends
    | StorageKey.TRANSPORT_P2P_PEERS_DAPP
    | StorageKey.TRANSPORT_P2P_PEERS_WALLET
    | StorageKey.TRANSPORT_POSTMESSAGE_PEERS_DAPP
    | StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET = any,
  S extends CommunicationClient = any
> {
  /**
   * The type of the transport
   */
  public readonly type: TransportType = TransportType.POST_MESSAGE

  /**
   * The name of the app
   */
  protected readonly name: string

  /**
   * The status of the transport
   */
  protected _isConnected: TransportStatus = TransportStatus.NOT_CONNECTED

  protected readonly peerManager: PeerManager<K>

  /**
   * The client handling the encryption/decryption of messages
   */
  protected client: S

  /**
   * The listener that will be invoked when a new peer is connected
   */
  protected newPeerListener?: (peer: T) => void

  /**
   * The listeners that will be notified when new messages are coming in
   */
  private listeners: ((message: unknown, connectionInfo: ConnectionContext) => void)[] = []

  /**
   * Return the status of the connection
   */
  public get connectionStatus(): TransportStatus {
    return this._isConnected
  }

  constructor(name: string, client: S, peerManager: PeerManager<K>) {
    this.name = name
    this.client = client
    this.peerManager = peerManager
  }

  /**
   * Returns a promise that resolves to true if the transport is available, false if it is not
   */
  public static async isAvailable(): Promise<boolean> {
    return Promise.resolve(false)
  }

  /**
   * Connect the transport
   */
  public async connect(): Promise<void> {
    logger.log('connect')
    this._isConnected = TransportStatus.CONNECTED

    return
  }

  /**
   * Reconnect the transport
   *
   * This method will be called if we tried to connect, but it didn't work
   */
  public async reconnect(): Promise<void> {
    logger.log('reconnect')

    return
  }

  /**
   * Send a message through the transport
   *
   * @param message The message to send
   * @param recipient The recipient of the message
   */
  public async send(message: string, recipient?: string): Promise<void> {
    const knownPeers = await this.getPeers()

    if (recipient) {
      const peer = knownPeers.find((peerEl) => peerEl.publicKey === recipient)
      if (!peer) {
        throw new Error('Peer unknown')
      }

      return this.client.sendMessage(peer as any, message)
    } else {
      // A broadcast request has to be sent everywhere.
      const promises = knownPeers.map((peer) => this.client.sendMessage(peer as any, message))

      return (await Promise.all(promises))[0]
    }
  }

  /**
   * Add a listener to be called when a new message is received
   *
   * @param listener The listener that will be registered
   */
  public async addListener(
    listener: (message: unknown, connectionInfo: ConnectionContext) => void
  ): Promise<void> {
    logger.log('addListener')

    this.listeners.push(listener)

    return
  }

  /**
   * Remove a listener
   *
   * @param listener
   */
  public async removeListener(
    listener: (message: string, connectionInfo: ConnectionContext) => void
  ): Promise<void> {
    logger.log('removeListener')

    this.listeners = this.listeners.filter((element) => element !== listener)

    return
  }

  public async getPeers(): Promise<T[]> {
    return this.peerManager.getPeers() as any // TODO: Fix type
  }

  public async addPeer(newPeer: T): Promise<void> {
    if (!(await this.peerManager.hasPeer(newPeer.publicKey))) {
      logger.log('addPeer', newPeer)
      await this.peerManager.addPeer(newPeer as ArrayElem<StorageKeyReturnType[K]>) // TODO: Fix type
      await this.listen(newPeer.publicKey) // TODO: Prevent channels from being opened multiple times
    } else {
      logger.log('addPeer', 'peer already added, skipping', newPeer)
    }
  }

  public async removePeer(peerToBeRemoved: T): Promise<void> {
    logger.log('removePeer', peerToBeRemoved)
    await this.peerManager.removePeer(peerToBeRemoved.publicKey)
    if (this.client) {
      await this.client.unsubscribeFromEncryptedMessage(peerToBeRemoved.publicKey)
    }
  }

  public async removeAllPeers(): Promise<void> {
    logger.log('removeAllPeers')
    await this.peerManager.removeAllPeers()
    if (this.client) {
      await this.client.unsubscribeFromEncryptedMessages()
    }
  }

  /**
   * Notify the listeners when a new message comes in
   *
   * @param message Message
   * @param connectionInfo Context info about the connection
   */
  protected async notifyListeners(
    message: unknown,
    connectionInfo: ConnectionContext
  ): Promise<void> {
    logger.log('notifyListeners')

    if (this.listeners.length === 0) {
      logger.warn('notifyListeners', '0 listeners notified!', this)
    } else {
      logger.log(`Notifying ${this.listeners.length} listeners`, this)
    }

    this.listeners.forEach((listener) => {
      listener(message, connectionInfo)
    })

    return
  }

  abstract async listen(publicKey: string): Promise<void>
}
