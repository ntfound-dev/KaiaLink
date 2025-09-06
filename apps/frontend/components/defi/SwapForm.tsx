'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useSwap } from '@/hooks/useSwap';
import { ArrowDownUp, Settings2 } from 'lucide-react';
import Image from 'next/image';

// --- Placeholder Data untuk Daftar Token ---
// Di aplikasi nyata, data ini akan datang dari API backend atau daftar token terverifikasi.
// Pastikan alamat (address) diisi dengan benar.
const TOKEN_LIST = [
    { symbol: 'USDT', name: 'Tether USD', address: '0x...' as `0x${string}`, logoURI: '/tokens/usdt.png' },
    { symbol: 'LINKA', name: 'KaiaLink Token', address: '0x...' as `0x${string}`, logoURI: '/tokens/linka.png' },
    { symbol: 'KAIA', name: 'Kaia', address: '0x...' as `0x${string}`, logoURI: '/tokens/kaia.png' },
    { symbol: 'ETH', name: 'Ethereum', address: '0x...' as `0x${string}`, logoURI: '/tokens/eth.png' },
];

export function SwapForm() {
    // --- State Management untuk UI ---
    const [amountIn, setAmountIn] = useState('');
    const [tokenIn, setTokenIn] = useState(TOKEN_LIST[0]);
    const [tokenOut, setTokenOut] = useState(TOKEN_LIST[1]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectingFor, setSelectingFor] = useState<'in' | 'out'>('in');

    // --- Integrasi dengan Hook "Otak" DeFi ---
    const {
        balanceIn,
        amountOut,
        needsApproval,
        approve,
        swap,
        isLoading,
    } = useSwap(tokenIn, tokenOut, amountIn);

    // --- Fungsi Handler untuk Interaksi UI ---
    const handleOpenModal = (selection: 'in' | 'out') => {
        setSelectingFor(selection);
        setIsModalOpen(true);
    };

    const handleSelectToken = (token: typeof TOKEN_LIST[0]) => {
        if (selectingFor === 'in') {
            // Mencegah memilih token yang sama
            if (token.address === tokenOut.address) {
                handleSwapTokens();
            } else {
                setTokenIn(token);
            }
        } else {
            if (token.address === tokenIn.address) {
                handleSwapTokens();
            } else {
                setTokenOut(token);
            }
        }
        setIsModalOpen(false);
    };

    const handleSwapTokens = () => {
        setTokenIn(tokenOut);
        setTokenOut(tokenIn);
    };

    const handleActionClick = () => {
        if (needsApproval) {
            approve();
        } else {
            swap();
        }
    };

    return (
        <div className="p-4 border rounded-xl max-w-md mx-auto relative bg-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-xl">Tukar Aset</h2>
                <button className="text-gray-500 hover:text-gray-800"><Settings2 size={20} /></button>
            </div>

            {/* INPUT TOKEN */}
            <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Dari</span>
                    <span>Saldo: {balanceIn.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <input
                        value={amountIn}
                        onChange={(e) => setAmountIn(e.target.value)}
                        type="number"
                        placeholder="0.0"
                        className="text-2xl bg-transparent w-full focus:outline-none"
                    />
                    <button onClick={() => handleOpenModal('in')} className="flex items-center font-bold bg-white p-2 rounded-lg shadow-sm hover:bg-gray-50">
                        <Image src={tokenIn.logoURI} alt={tokenIn.symbol} width={24} height={24} className="mr-2 rounded-full" />
                        {tokenIn.symbol} <span className="ml-2 text-xs">▼</span>
                    </button>
                </div>
            </div>
            
            {/* Tombol Pembalik */}
            <div className="flex justify-center my-[-12px] relative z-10">
                <button onClick={handleSwapTokens} className="text-2xl bg-gray-200 p-2 rounded-full border-4 border-white hover:bg-gray-300">
                    <ArrowDownUp size={16} />
                </button>
            </div>
            
            {/* OUTPUT TOKEN */}
            <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Ke (Estimasi)</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <input
                        value={amountOut}
                        type="number"
                        placeholder="0.0"
                        disabled
                        className="text-2xl bg-transparent w-full focus:outline-none"
                    />
                    <button onClick={() => handleOpenModal('out')} className="flex items-center font-bold bg-white p-2 rounded-lg shadow-sm hover:bg-gray-50">
                         <Image src={tokenOut.logoURI} alt={tokenOut.symbol} width={24} height={24} className="mr-2 rounded-full" />
                        {tokenOut.symbol} <span className="ml-2 text-xs">▼</span>
                    </button>
                </div>
            </div>

            {/* Tombol Aksi Utama */}
            <div className="mt-4">
                <Button onClick={handleActionClick} isLoading={isLoading} disabled={!amountIn || parseFloat(amountIn) <= 0} className="w-full h-12 text-lg">
                    {needsApproval ? `Approve ${tokenIn.symbol}` : 'Swap'}
                </Button>
            </div>

            {/* Modal untuk Memilih Token */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pilih Token">
                <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
                    {TOKEN_LIST.map(token => (
                        <button 
                            key={token.address} 
                            onClick={() => handleSelectToken(token)}
                            className="w-full flex items-center p-3 hover:bg-gray-100 rounded-lg text-left"
                        >
                            <Image src={token.logoURI} alt={token.symbol} width={32} height={32} className="mr-3 rounded-full"/>
                            <div>
                                <p className="font-bold">{token.symbol}</p>
                                <p className="text-sm text-gray-500">{token.name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </Modal>
        </div>
    );
}

