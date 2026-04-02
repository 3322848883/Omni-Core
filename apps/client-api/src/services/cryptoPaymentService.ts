import db from '@/config/database';
import { v4 as uuidv4 } from 'uuid';
import { CRYPTO_PAYMENT_STATUS, CRYPTO_CONFIG, CRYPTO_CURRENCIES, ORDER_STATUS, PAYMENT_STATUS } from '@/constants';
import { CryptoPayment } from '@/types/user';
import { getCryptoWalletById, updateWalletReceivedAmount } from './cryptoWalletService';
import { getExchangeRate } from './cryptoExchangeRateService';
import { NotFoundError, ValidationError } from '@/errors/AppError';

const generateCryptoPaymentId = (): string => {
  return `cp_${uuidv4().replace(/-/g, '').substring(0, 32)}`;
};

const formatCryptoPayment = (payment: Record<string, unknown>): CryptoPayment => {
  return {
    id: String(payment.id),
    cryptoPaymentId: payment.crypto_payment_id as string,
    walletId: payment.wallet_id as string,
    orderId: payment.order_id as string,
    userId: payment.user_id as string,
    transactionId: payment.transaction_id as string | undefined,
    currency: payment.currency as string,
    amount: parseFloat(payment.amount as string),
    fiatAmount: parseFloat(payment.fiat_amount as string),
    fiatCurrency: payment.fiat_currency as string,
    exchangeRate: parseFloat(payment.exchange_rate as string),
    confirmations: parseInt(payment.confirmations as string, 10),
    requiredConfirmations: parseInt(payment.required_confirmations as string, 10),
    status: payment.status as string,
    transactionAt: payment.transaction_at ? new Date(payment.transaction_at as string) : undefined,
    confirmedAt: payment.confirmed_at ? new Date(payment.confirmed_at as string) : undefined,
    createdAt: new Date(payment.created_at as string),
    updatedAt: new Date(payment.updated_at as string),
  };
};

const getRequiredConfirmations = (currency: string): number => {
  const confirmationMap: Record<string, number> = {
    [CRYPTO_CURRENCIES.BTC]: CRYPTO_CONFIG.BTC_REQUIRED_CONFIRMATIONS,
    [CRYPTO_CURRENCIES.ETH]: CRYPTO_CONFIG.ETH_REQUIRED_CONFIRMATIONS,
    [CRYPTO_CURRENCIES.USDT]: CRYPTO_CONFIG.ETH_REQUIRED_CONFIRMATIONS,
    [CRYPTO_CURRENCIES.BCH]: CRYPTO_CONFIG.BTC_REQUIRED_CONFIRMATIONS,
    [CRYPTO_CURRENCIES.LTC]: CRYPTO_CONFIG.BTC_REQUIRED_CONFIRMATIONS,
  };
  return confirmationMap[currency] || 6;
};

export const createCryptoPayment = async (
  walletId: string,
  transactionId: string,
  amount: number,
  confirmations: number = 0
): Promise<CryptoPayment> => {
  const wallet = await getCryptoWalletById(walletId);
  const exchangeRate = await getExchangeRate(wallet.currency);
  const fiatAmount = amount * exchangeRate;
  const requiredConfirmations = getRequiredConfirmations(wallet.currency);

  const existingPayment = await db('crypto_payments')
    .where({ transaction_id: transactionId, wallet_id: walletId })
    .first();

  if (existingPayment) {
    return formatCryptoPayment(existingPayment);
  }

  const cryptoPaymentId = generateCryptoPaymentId();
  const status = confirmations >= requiredConfirmations 
    ? CRYPTO_PAYMENT_STATUS.CONFIRMED 
    : CRYPTO_PAYMENT_STATUS.DETECTED;

  await db('crypto_payments').insert({
    crypto_payment_id: cryptoPaymentId,
    wallet_id: walletId,
    order_id: wallet.orderId,
    user_id: wallet.userId,
    transaction_id: transactionId,
    currency: wallet.currency,
    amount,
    fiat_amount: fiatAmount,
    fiat_currency: CRYPTO_CONFIG.DEFAULT_FIAT_CURRENCY,
    exchange_rate: exchangeRate,
    confirmations,
    required_confirmations: requiredConfirmations,
    status,
    transaction_at: new Date(),
    confirmed_at: status === CRYPTO_PAYMENT_STATUS.CONFIRMED ? new Date() : null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  await updateWalletReceivedAmount(walletId, amount, transactionId);

  if (status === CRYPTO_PAYMENT_STATUS.CONFIRMED) {
    await updateOrderAndPaymentStatus(wallet.orderId!);
  }

  const payment = await db('crypto_payments').where({ crypto_payment_id: cryptoPaymentId }).first();
  return formatCryptoPayment(payment);
};

export const updatePaymentConfirmations = async (
  cryptoPaymentId: string,
  confirmations: number
): Promise<CryptoPayment> => {
  const payment = await getCryptoPaymentById(cryptoPaymentId);

  let newStatus = payment.status;
  let confirmedAt = payment.confirmedAt;

  if (confirmations >= payment.requiredConfirmations && payment.status !== CRYPTO_PAYMENT_STATUS.CONFIRMED) {
    newStatus = CRYPTO_PAYMENT_STATUS.CONFIRMED;
    confirmedAt = new Date();
    
    await updateWalletReceivedAmount(payment.walletId, 0, payment.transactionId);
    await updateOrderAndPaymentStatus(payment.orderId);
  }

  await db('crypto_payments')
    .where({ crypto_payment_id: cryptoPaymentId })
    .update({
      confirmations,
      status: newStatus,
      confirmed_at: confirmedAt,
      updated_at: new Date(),
    });

  const updatedPayment = await getCryptoPaymentById(cryptoPaymentId);
  return updatedPayment;
};

const updateOrderAndPaymentStatus = async (orderId: string): Promise<void> => {
  await db('orders')
    .where({ order_id: orderId })
    .update({
      status: ORDER_STATUS.COMPLETED,
      payment_time: new Date(),
      updated_at: new Date(),
    });

  const order = await db('orders').where({ order_id: orderId }).first();
  
  if (order) {
    const existingPayment = await db('payments')
      .where({ order_id: orderId })
      .first();

    if (!existingPayment) {
      await db('payments').insert({
        payment_id: `pay_${uuidv4().replace(/-/g, '').substring(0, 32)}`,
        order_id: orderId,
        user_id: order.user_id,
        amount: order.amount,
        payment_method: 'crypto',
        status: PAYMENT_STATUS.SUCCESS,
        paid_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    } else {
      await db('payments')
        .where({ order_id: orderId })
        .update({
          status: PAYMENT_STATUS.SUCCESS,
          paid_at: new Date(),
          updated_at: new Date(),
        });
    }
  }
};

export const getCryptoPaymentById = async (cryptoPaymentId: string): Promise<CryptoPayment> => {
  const payment = await db('crypto_payments')
    .where({ crypto_payment_id: cryptoPaymentId })
    .first();

  if (!payment) {
    throw new NotFoundError('Crypto payment', cryptoPaymentId);
  }

  return formatCryptoPayment(payment);
};

export const getCryptoPaymentsByOrderId = async (orderId: string): Promise<CryptoPayment[]> => {
  const payments = await db('crypto_payments')
    .where({ order_id: orderId })
    .orderBy('created_at', 'desc')
    .select('*');

  return payments.map(formatCryptoPayment);
};

export const getCryptoPaymentsByWalletId = async (walletId: string): Promise<CryptoPayment[]> => {
  const payments = await db('crypto_payments')
    .where({ wallet_id: walletId })
    .orderBy('created_at', 'desc')
    .select('*');

  return payments.map(formatCryptoPayment);
};

export const getPendingCryptoPayments = async (): Promise<CryptoPayment[]> => {
  const payments = await db('crypto_payments')
    .whereIn('status', [CRYPTO_PAYMENT_STATUS.PENDING, CRYPTO_PAYMENT_STATUS.DETECTED])
    .orderBy('created_at', 'asc')
    .select('*');

  return payments.map(formatCryptoPayment);
};

export const simulateTransaction = async (
  walletId: string,
  amount?: number
): Promise<CryptoPayment> => {
  const wallet = await getCryptoWalletById(walletId);
  
  if (wallet.status !== CRYPTO_WALLET_STATUS.PENDING && wallet.status !== CRYPTO_WALLET_STATUS.PARTIAL) {
    throw new ValidationError([{ field: 'walletId', message: 'Wallet is not in pending state' }]);
  }

  const transactionId = `tx_${uuidv4().replace(/-/g, '').substring(0, 40)}`;
  const paymentAmount = amount || wallet.expectedAmount;

  return await createCryptoPayment(walletId, transactionId, paymentAmount, 0);
};

export const simulateConfirmation = async (
  cryptoPaymentId: string
): Promise<CryptoPayment> => {
  const payment = await getCryptoPaymentById(cryptoPaymentId);
  
  return await updatePaymentConfirmations(cryptoPaymentId, payment.requiredConfirmations);
};
