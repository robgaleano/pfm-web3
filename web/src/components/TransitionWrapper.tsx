'use client';

import { useWeb3 } from '@/contexts/Web3Context';
import { AccountTransitionLoader } from './AccountTransitionLoader';
import { ReactNode } from 'react';

interface TransitionWrapperProps {
  children: ReactNode;
}

export function TransitionWrapper({ children }: TransitionWrapperProps) {
  const { isTransitioning } = useWeb3();

  return (
    <>
      <AccountTransitionLoader isTransitioning={isTransitioning} />
      {children}
    </>
  );
}
