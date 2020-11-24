import * as sodium from 'libsodium-wrappers'
import { StorageKey, PostMessageTransport } from '..'
import { Storage } from '../storage/Storage'
import { PostMessagePairingRequest } from '../types/PostMessagePairingRequest'

// const logger = new Logger('WalletPostMessageTransport')

export class WalletPostMessageTransport extends PostMessageTransport<
  PostMessagePairingRequest,
  StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET
> {
  constructor(name: string, keyPair: sodium.KeyPair, storage: Storage) {
    super(name, keyPair, storage, StorageKey.TRANSPORT_POSTMESSAGE_PEERS_WALLET)
  }
}
