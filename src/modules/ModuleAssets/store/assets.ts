import { Address } from '@/core'
import { isAddress } from '@ethersproject/address'
import BigNumber from 'bignumber.js'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useAssetsStore = defineStore('assets', () => {
  const tokensStore = useTokensStore()

  const hiddenAssets = useLocalStorage<Set<Address>>('assets-hidden-tokens', new Set(), {
    serializer: {
      read: (raw) => {
        const parsed = JSON.parse(raw)

        return new Set(Array.isArray(parsed) ? parsed.filter((x) => isAddress(x)) : [])
      },
      write: (set) => JSON.stringify(set.values()),
    },
  })

  function toggleHidden(token: Address, hidden: boolean) {
    hidden ? hiddenAssets.value.add(token) : hiddenAssets.value.delete(token)
  }

  const tokensFilteredByHidden = computed(() => {
    const items = tokensStore.tokensLoaded
    return items.filter((x) => !hiddenAssets.value.has(x.address))
  })

  const allTokens = computed(() => tokensStore.tokensLoaded)

  const totalUsd = computed<BigNumber | null>(() => {
    let sum = new BigNumber(0)
    for (const token of tokensFilteredByHidden.value) {
      const balance = tokensStore.lookupUserBalance(token.address)
      const usd = tokensStore.lookupDerivedUsd(token.address)
      if (!balance || !usd)
        // return null
        continue
      sum = sum.plus(balance.decimals(token).times(usd))
    }
    return sum
  })

  const openAssetsModal = ref(false)

  const openReceiveModal = ref(false)

  return {
    hiddenAssets: readonly(hiddenAssets),
    totalUsd,
    tokensFilteredByHidden,
    allTokens,
    openAssetsModal,
    openReceiveModal,

    toggleHidden,
  }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useAssetsStore, import.meta.hot))
