import { isAddress as ethersIsAddress } from '@ethersproject/address'
import type { Address, Deadline } from './types'
import { Wei } from './entities'

export const isAddress = ethersIsAddress as (raw: string) => raw is Address

export function formatAddress(address: Address, length = 4, keepPrefix = false): string {
  return `${address.slice(keepPrefix ? 0 : 2, 2 + length)}....${address.slice(-length)}`
}

export function isEmptyAddress(address: Address): boolean {
  return Number(address) === 0
}

export function parseAddress(raw: string): Address {
  if (isAddress(raw)) return raw
  throw new Error(`not a valid address: "${raw}"`)
}

export function deadlineFiveMinutesFromNow(): Deadline {
  return (~~(Date.now() / 1000) + 300) as Deadline
}

/**
 * @param gasPrice price for one gas unit, in **wei**
 * @param gas amount of gas units
 */
export function computeTransactionFee(gasPrice: Wei, gas: number | bigint): Wei {
  return new Wei(gasPrice.asBigInt * BigInt(gas))
}
