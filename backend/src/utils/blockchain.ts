import { ethers } from 'ethers';

/**
 * Anchors a file hash onto a Layer 2 blockchain to create an immutable proof of existence.
 * Uses a self-transaction with the hash stored in the transaction data field.
 */
export async function verifyOnBlockchain(fileHash: string) {
  try {
    const rpcUrl = process.env.L2_RPC_URL || 'https://polygon-rpc.com';
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error('BLOCKCHAIN_PRIVATE_KEY is missing in environment variables');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Prepare the hash as hex data. If it's not a hex string, we hexlify it.
    const data = fileHash.startsWith('0x') ? fileHash : `0x${fileHash}`;

    // Send a 0-value transaction to the same wallet (self) to record the hash in the 'data' field
    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0,
      data: data,
    });

    // Wait for 1 confirmation
    const receipt = await tx.wait();

    return {
      success: true,
      txId: receipt?.hash,
      timestamp: new Date().toISOString(),
      network: (await provider.getNetwork()).name,
      blockNumber: receipt?.blockNumber
    };
  } catch (error) {
    console.error('[Blockchain] Anchoring failed:', error);
    throw error;
  }
}

/**
 * Retrieves transaction data from the blockchain to verify an anchored hash.
 */
export async function getBlockchainTxData(txId: string) {
  try {
    const rpcUrl = process.env.L2_RPC_URL || 'https://polygon-rpc.com';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const tx = await provider.getTransaction(txId);
    if (!tx) return null;

    return {
      data: tx.data,
      from: tx.from,
      to: tx.to,
      blockNumber: tx.blockNumber,
      network: (await provider.getNetwork()).name
    };
  } catch (error) {
    console.error('[Blockchain] Retrieval failed:', error);
    return null;
  }
}
