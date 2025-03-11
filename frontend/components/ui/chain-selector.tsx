"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "./button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./dropdown-menu";

// Define the chain type
export type Chain = {
  id: string;
  name: string;
  icon: string;
  agentId: string;
};

// Define supported chains with their details
export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "/chains/icons/ethereum.svg",
    agentId: "ethereum-agent"
  },
  {
    id: "base",
    name: "Base",
    icon: "/chains/icons/base.svg",
    agentId: "base-agent"
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    icon: "/chains/icons/arbitrum.svg",
    agentId: "arbitrum-agent"
  },
  {
    id: "mode",
    name: "Mode",
    icon: "/chains/icons/mode.svg",
    agentId: "mode-agent"
  },
  {
    id: "sonic",
    name: "Sonic",
    icon: "/chains/icons/sonic.svg",
    agentId: "sonic-agent"
  },
  {
    id: "hedera",
    name: "Hedera",
    icon: "/hedera-agentkit.webp",
    agentId: "hedera-agent"
  }
];

// Ensure we have a non-undefined default chain
const DEFAULT_CHAIN: Chain = {
  id: "ethereum",
  name: "Ethereum",
  icon: "/chains/icons/ethereum.svg",
  agentId: "ethereum-agent"
};

interface ChainSelectorProps {
  onChainSelect: (chain: Chain) => void;
  selectedChain?: Chain;
}

export function ChainSelector({ onChainSelect, selectedChain }: ChainSelectorProps) {
  // Use the first chain as default if none is selected
  const [selected, setSelected] = useState<Chain>(() => {
    if (selectedChain) {
      return selectedChain;
    }
    return DEFAULT_CHAIN;
  });

  const handleSelect = (chain: Chain) => {
    setSelected(chain);
    onChainSelect(chain);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 px-3">
          {selected.icon ? (
            <div className="relative w-5 h-5 rounded-full overflow-hidden">
              <Image
                src={selected.icon}
                alt={selected.name}
                fill
                className="object-contain"
              />
            </div>
          ) : null}
          <span>{selected.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {SUPPORTED_CHAINS.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleSelect(chain)}
          >
            {chain.icon ? (
              <div className="relative w-5 h-5 rounded-full overflow-hidden">
                <Image
                  src={chain.icon}
                  alt={chain.name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : null}
            <span>{chain.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 