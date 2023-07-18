import {
  VaultCreated as VaultCreatedEvent
} from "../generated/VaultFactoryLido/VaultFactoryLido"
import { Vault } from "../generated/schema"
import { BigInt } from "@graphprotocol/graph-ts"

export function handleVaultCreated(event: VaultCreatedEvent): void {
  let vault = new Vault(event.params.vaultAddress.toHex())
  vault.id = event.params.vaultAddress.toString()
  vault.address = event.params.vaultAddress
  vault.beneficiary = event.params.beneficiary
  vault.creator = event.params.msgSender
  vault.paused = false
  vault.totalEthDeposits = BigInt.fromI32(0)
  vault.totalHarvested = BigInt.fromI32(0)

  vault.save()
}
