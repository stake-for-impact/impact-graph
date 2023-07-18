import {
  Deposit as DepositEvent,
  HarvestRewards as HarvestRewardsEvent,
  Withdraw as WithdrawEvent
} from "../generated/Vault/Vault"
import {
  UserVault,
  User,
  Vault,
  NFT
} from "../generated/schema"
import { store, BigInt } from "@graphprotocol/graph-ts"

export function handleDeposit(event: DepositEvent): void {
  let userId = event.params.user.toString()
  let tokenId = event.params.tokenId.toString()
  let depositedAmount = event.params.amount
  let vaultAddress = event.address.toString()
  let userVaultId = userId + "-" + vaultAddress

  let user = User.load(userId)
  if (user == null) {
    user = new User(userId)
    user.id = userId
    user.address = event.params.user
    user.save()
  }

  let userVault = UserVault.load(userVaultId)
  if (userVault == null) {
    userVault = new UserVault(userVaultId)
    userVault.id = userVaultId
    userVault.user = userId
    userVault.vault = vaultAddress
    userVault.nftCount = BigInt.fromI32(1)
    userVault.save()
  } else {
    userVault.nftCount = userVault.nftCount.plus(BigInt.fromI32(1))
  }

  let vault = Vault.load(event.address.toHex())
  if (vault != null) {
    vault.totalEthDeposits = vault.totalEthDeposits.plus(event.params.amount)
    vault.save()
  }

  let nft = new NFT(tokenId)
  nft.id = tokenId
  nft.tokenId = event.params.tokenId
  nft.creator = user.id
  nft.owner = user.id
  nft.vault = vaultAddress
  nft.amount = depositedAmount
  nft.save()
}

export function handleHarvestRewards(event: HarvestRewardsEvent): void {
  let vault = Vault.load(event.address.toHex())

  if (vault != null) {
    vault.totalHarvested = vault.totalHarvested.plus(event.params.amount)
    vault.save()
  }
}

export function handleWithdraw(event: WithdrawEvent): void {
  let userId = event.params.user.toHex()
  let tokenId = event.params.tokenId.toString()
  let withdrawnAmount = event.params.amount
  let vaultAddress = event.address.toHex()

  let user = User.load(userId)
  if (user == null) {
    user = new User(userId)
  }

  let userVaultId = userId + "-" + vaultAddress
  let userVault = UserVault.load(userVaultId)
  if (userVault == null) {
    // This should never happen in a normal scenario. If it happens, then
    // the data is in an inconsistent state.
    throw new Error("UserVault entity not found")
  } else {
    userVault.nftCount = userVault.nftCount.minus(BigInt.fromI32(1))
    if (userVault.nftCount.equals(BigInt.fromI32(0))) {
      // If the user has no more NFTs in this vault, remove the UserVault entity.
      store.remove("UserVault", userVaultId)
    } else {
      userVault.save()
    }
  }

  let vault = Vault.load(vaultAddress)
  if (vault != null) {
    vault.totalEthDeposits = vault.totalEthDeposits.minus(withdrawnAmount)
    vault.save()
  }

  let nft = NFT.load(tokenId)
  if (nft != null) {
    store.remove("NFT", tokenId)
  }
}
