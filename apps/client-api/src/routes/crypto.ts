import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import { validate, CryptoValidation } from '@/middlewares/validation';
import {
  successResponse,
} from '@/utils/response';
import * as cryptoExchangeRateService from '@/services/cryptoExchangeRateService';
import * as cryptoWalletService from '@/services/cryptoWalletService';
import * as cryptoPaymentService from '@/services/cryptoPaymentService';
import * as orderService from '@/services/orderService';

const router = Router();

/**
 * GET /rates - Get all crypto exchange rates
 */
router.get('/rates', async (req, res, next) => {
  try {
    const fiatCurrency = req.query.fiat as string;
    const rates = await cryptoExchangeRateService.getAllExchangeRates(fiatCurrency);
    successResponse(res, rates, 'Exchange rates retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /rates/:currency - Get exchange rate for specific currency
 */
router.get('/rates/:currency', async (req, res, next) => {
  try {
    const { currency } = req.params;
    const fiatCurrency = req.query.fiat as string;
    const rate = await cryptoExchangeRateService.getExchangeRate(currency, fiatCurrency);
    successResponse(res, { currency, rate }, 'Exchange rate retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /wallets - Create crypto wallet for an order
 */
router.post('/wallets', authenticate, validate(CryptoValidation.createWallet), async (req, res, next) => {
  try {
    const { orderId, currency } = req.body;
    const order = await orderService.getOrderById(orderId, req.user!.user_id);
    
    const wallet = await cryptoWalletService.createCryptoWallet(
      req.user!.user_id,
      orderId,
      currency,
      order.amount
    );
    
    successResponse(res, wallet, 'Crypto wallet created successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /wallets/:walletId - Get wallet by ID
 */
router.get('/wallets/:walletId', authenticate, validate(CryptoValidation.walletId), async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const wallet = await cryptoWalletService.getCryptoWalletById(walletId, req.user!.user_id);
    successResponse(res, wallet, 'Wallet retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /wallets/order/:orderId - Get wallet by order ID
 */
router.get('/wallets/order/:orderId', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const wallet = await cryptoWalletService.getCryptoWalletByOrderId(orderId, req.user!.user_id);
    successResponse(res, wallet, 'Wallet retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /payments/simulate - Simulate a crypto payment (for testing)
 */
router.post('/payments/simulate', authenticate, validate(CryptoValidation.simulateTransaction), async (req, res, next) => {
  try {
    const { walletId, amount } = req.body;
    const payment = await cryptoPaymentService.simulateTransaction(walletId, amount);
    successResponse(res, payment, 'Payment simulated successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /payments/:paymentId/confirm - Simulate payment confirmation (for testing)
 */
router.post('/payments/:paymentId/confirm', authenticate, validate(CryptoValidation.paymentId), async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await cryptoPaymentService.simulateConfirmation(paymentId);
    successResponse(res, payment, 'Payment confirmed successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /payments/order/:orderId - Get crypto payments for an order
 */
router.get('/payments/order/:orderId', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const payments = await cryptoPaymentService.getCryptoPaymentsByOrderId(orderId);
    successResponse(res, payments, 'Payments retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /payments/wallet/:walletId - Get crypto payments for a wallet
 */
router.get('/payments/wallet/:walletId', authenticate, validate(CryptoValidation.walletId), async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const payments = await cryptoPaymentService.getCryptoPaymentsByWalletId(walletId);
    successResponse(res, payments, 'Payments retrieved successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
