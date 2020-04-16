import { assertNever } from '../utils/assert-never'
import {
  BeaconErrorType,
  UnknownBeaconError,
  NetworkNotSupportedBeaconError,
  NoAddressBeaconError,
  NoPrivateKeyBeaconError,
  NotGrantedBeaconError,
  ParametersInvalidBeaconError,
  TooManyOperationsBeaconError,
  TransactionInvalidBeaconError
} from '..'

export abstract class BeaconError implements Error {
  public name: string = 'BeaconError'
  public message: string

  constructor(errorType, message) {
    this.message = `[${errorType}]:${message}`
  }

  public static getError(errorType: BeaconErrorType): BeaconError {
    switch (errorType) {
      case BeaconErrorType.BROADCAST_ERROR:
        return new NetworkNotSupportedBeaconError()
      case BeaconErrorType.NETWORK_NOT_SUPPORTED:
        return new NetworkNotSupportedBeaconError()
      case BeaconErrorType.NO_ADDRESS_ERROR:
        return new NoAddressBeaconError()
      case BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR:
        return new NoPrivateKeyBeaconError()
      case BeaconErrorType.NOT_GRANTED_ERROR:
        return new NotGrantedBeaconError()
      case BeaconErrorType.PARAMETERS_INVALID_ERROR:
        return new ParametersInvalidBeaconError()
      case BeaconErrorType.TOO_MANY_OPERATIONS:
        return new TooManyOperationsBeaconError()
      case BeaconErrorType.TRANSACTION_INVALID_ERROR:
        return new TransactionInvalidBeaconError()
      case BeaconErrorType.UNKNOWN_ERROR:
        return new UnknownBeaconError()
      default:
        assertNever(errorType)
    }

    return new UnknownBeaconError()
  }
}