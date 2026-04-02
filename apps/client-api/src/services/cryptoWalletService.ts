import db from '@/config/database';
import { v4 as uuidv4 } from 'uuid';
import { CRYPTO_WALLET_STATUS, CRYPTO_CONFIG, CRYPTO_CURRENCIES } from '@/constants';
import { CryptoWallet } from '@/types/user';
import { convertFiatToCrypto } from './cryptoExchangeRateService';
import { NotFoundError, ValidationError, ConflictError } from '@/errors/AppError';

const generateWalletId = (): string => {
  return `cw_${uuidv4().replace(/-/g, '').substring(0, 32)}`;
};

const generateCryptoAddress = (currency: string): string => {
  const randomString = uuidv4().replace(/-/g, '');
  
  const addressFormats: Record<string, string> = {
    [CRYPTO_CURRENCIES.BTC]: `bc1q${randomString.substring(0, 38)}`,
    [CRYPTO_CURRENCIES.ETH]: `0x${randomString.substring(0, 40)}`,
    [CRYPTO_CURRENCIES.USDT]: `0x${randomString.substring(0, 40)}`,
    [CRYPTO_CURRENCIES.BCH]: `bitcoincash:q${randomString.substring(0, 40)}`,
    [CRYPTO_CURRENCIES.LTC]: `ltc1q${randomString.substring(0, 38)}`,
  };

  return addressFormats[currency] || `0x${randomString.substring(0, 40)}`;
};

const formatCryptoWallet = (wallet: Record<string, unknown>): CryptoWallet => {
  return {
    id: String(wallet.id),
    walletId: wallet.wallet_id as string,
    userId: wallet.user_id as string,
    orderId: wallet.order_id as string | null,
    currency: wallet.currency as string,
    address: wallet.address as string,
    privateKey: wallet.private_key as string | undefined,
    expectedAmount: parseFloat(wallet.expected_amount as string),
    receivedAmount: parseFloat(wallet.received_amount as string),
    status: wallet.status as string,
    expiresAt: new Date(wallet.expires_at as string),
    confirmedAt: wallet.confirmed_at ? new Date(wallet.confirmed_at as string) : undefined,
    createdAt: new Date(wallet.created_at as string),
    updatedAt: new Date(wallet.updated_at as string),
  };
};

export const createCryptoWallet = async (
  userId: string,
  orderId: string,
  cryptoCurrency: string,
  fiatAmount: number,
  fiatCurrency: string = CRYPTO_CONFIG.DEFAULT_FIAT_CURRENCY
): Promise<CryptoWallet> => {
  const existingWallet = await db('crypto_wallets')
    .where({
      user_id: userId,
      order_id: orderId,
      status: CRYPTO_WALLET_STATUS.PENDING,
    })
    .first();

  if (existingWallet) {
    throw new ConflictError('A pending crypto wallet already exists for this order');
  }

  const cryptoAmount = await convertFiatToCrypto(fiatAmount, cryptoCurrency, fiatCurrency);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + CRYPTO_CONFIG.WALLET_EXPIRY_MINUTES);

  const walletId = generateWalletId();
  const address = generateCryptoAddress(cryptoCurrency);

  await db('crypto_wallets').insert({
    wallet_id: walletId,
    user_id: userId,
    order_id: orderId,
    currency: cryptoCurrency.toUpperCase(),
    address,
    expected_amount: cryptoAmount,
    status: CRYPTO_WALLET_STATUS.PENDING,
    expires_at: expiresAt,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const wallet = await db('crypto_wallets').where({ wallet_id: walletId }).first();
  return formatCryptoWallet(wallet);
};

export const getCryptoWalletById = async (walletId: string, userId?: string): Promise<CryptoWallet> => {
  const query = db('crypto_wallets').where({ wallet_id: walletId });
  
  if (userId) {
    query.where({ user_id: userId });
  }

  const wallet = await query.first();

  if (!wallet) {
    throw new NotFoundError('Crypto wallet', walletId);
  }

  return formatCryptoWallet(wallet);
};

export const getCryptoWalletByOrderId = async (orderId: string, userId?: string): Promise<CryptoWallet | null> => {
  const query = db('crypto_wallets').where({ order_id: orderId });
  
  if (userId) {
    query.where({ user_id: userId });
  }

  const wallet = await query.orderBy('created_at', 'desc').first();

  if (!wallet) {
    return null;
  }

  return formatCryptoWallet(wallet);
};

export const updateWalletReceivedAmount = async (
  walletId: string,
  amount: number,
  transactionId?: string
): Promise<CryptoWallet> => {
  const wallet = await getCryptoWalletById(walletId);

  const newReceivedAmount = wallet.receivedAmount + amount;
  let newStatus = wallet.status;

  if (newReceivedAmount >= wallet.expectedAmount) {
    newStatus = CRYPTO_WALLET_STATUS.CONFIRMED;
  } else if (newReceivedAmount > 0) {
    newStatus = CRYPTO_WALLET_STATUS.PARTIAL;
  }

  await db('crypto_wallets')
    .where({ wallet_id: walletId })
    .update({
      received_amount: newReceivedAmount,
      status: newStatus,
      confirmed_at: newStatus === CRYPTO_WALLET_STATUS.CONFIRMED ? new Date() : null,
      updated_at: new Date(),
    });

  const updatedWallet = await getCryptoWalletById(walletId);
  return updatedWallet;
};

export const expireWallet = async (walletId: string): Promise<CryptoWallet> => {
  const wallet = await getCryptoWalletById(walletId);

  if (wallet.status !== CRYPTO_WALLET_STATUS.PENDING && wallet.status !== CRYPTO_WALLET_STATUS.PARTIAL) {
    throw new ValidationError([{ field: 'status', message: 'Wallet cannot be expired' }]);
  }

  await db('crypto_wallets')
    .where({ wallet_id: walletId })
    .update({
      status: CRYPTO_WALLET_STATUS.EXPIRED,
      updated_at: new Date(),
    });

  const updatedWallet = await getCryptoWalletById(walletId);
  return updatedWallet;
};

export const getExpiredPendingWallets = async (): Promise<CryptoWallet[]> => {
  const now = new Date();
  const wallets = await db('crypto_wallets')
    .whereIn('status', [CRYPTO_WALLET_STATUS.PENDING, CRYPTO_WALLET_STATUS.PARTIAL])
    .where('expires_at', '<', now)
    .select('*');

  return wallets.map(formatCryptoWallet);
};

export const getPendingWallets = async (): Promise<CryptoWallet[]> => {
  const wallets = await db('crypto_wallets')
    .whereIn('status', [CRYPTO_WALLET_STATUS.PENDING, CRYPTO_WALLET_STATUS.PARTIAL])
    .orderBy('created_at', 'asc')
    .select('*');

  return wallets.map(formatCryptoWallet);
};
