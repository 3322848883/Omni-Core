import { db } from '../../database';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface CreateMerchantRequest {
  name: string;
  email: string;
  phone?: string;
  businessLicense?: string;
  taxId?: string;
  contactPerson?: string;
  address?: string;
  website?: string;
  notes?: string;
}

export interface UpdateMerchantRequest {
  name?: string;
  email?: string;
  phone?: string;
  businessLicense?: string;
  taxId?: string;
  contactPerson?: string;
  address?: string;
  website?: string;
  status?: string;
  notes?: string;
}

export interface CreateApiKeyRequest {
  keyName: string;
  scopes?: string;
  ipWhitelist?: string;
  expiresAt?: Date;
}

export interface CreateRateRequest {
  paymentMethod: string;
  currency?: string;
  transactionRate: number;
  fixedFee?: number;
  minFee?: number;
  maxFee?: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export class MerchantService {
  static async createMerchant(data: CreateMerchantRequest) {
    const merchantId = `mch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [id] = await db('merchants').insert({
      merchant_id: merchantId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      business_license: data.businessLicense || null,
      tax_id: data.taxId || null,
      contact_person: data.contactPerson || null,
      address: data.address || null,
      website: data.website || null,
      notes: data.notes || null,
      status: 'pending',
      version: 1
    });

    return this.getMerchantById(id);
  }

  static async getMerchantById(id: number) {
    return db('merchants').where('id', id).first();
  }

  static async getMerchantByMerchantId(merchantId: string) {
    return db('merchants').where('merchant_id', merchantId).first();
  }

  static async listMerchants(page: number = 1, limit: number = 20, status?: string, search?: string) {
    const offset = (page - 1) * limit;
    
    let query = db('merchants');
    
    if (status) {
      query = query.where('status', status);
    }
    
    if (search) {
      query = query.where(function() {
        this.where('name', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('merchant_id', 'like', `%${search}%`);
      });
    }
    
    const [countResult] = await query.clone().count('* as count');
    const total = parseInt(countResult.count as string);
    
    const merchants = await query
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    return {
      items: merchants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  static async updateMerchant(id: number, data: UpdateMerchantRequest) {
    const merchant = await this.getMerchantById(id);
    if (!merchant) {
      throw new Error('Merchant not found');
    }
    
    const updateData: any = {
      updated_at: new Date(),
      version: merchant.version + 1
    };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.businessLicense !== undefined) updateData.business_license = data.businessLicense;
    if (data.taxId !== undefined) updateData.tax_id = data.taxId;
    if (data.contactPerson !== undefined) updateData.contact_person = data.contactPerson;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    await db('merchants').where('id', id).update(updateData);
    
    return this.getMerchantById(id);
  }

  static async createApiKey(merchantId: number, data: CreateApiKeyRequest) {
    const apiKey = `ak_${uuidv4().replace(/-/g, '')}`;
    const apiSecret = crypto.randomBytes(32).toString('hex');
    
    const [id] = await db('merchant_api_keys').insert({
      merchant_id: merchantId,
      key_name: data.keyName,
      api_key: apiKey,
      api_secret: apiSecret,
      scopes: data.scopes || null,
      ip_whitelist: data.ipWhitelist || null,
      expires_at: data.expiresAt || null,
      is_active: true
    });
    
    return {
      id,
      apiKey,
      apiSecret
    };
  }

  static async listApiKeys(merchantId: number) {
    return db('merchant_api_keys')
      .where('merchant_id', merchantId)
      .select('*')
      .orderBy('created_at', 'desc');
  }

  static async revokeApiKey(id: number, merchantId: number) {
    return db('merchant_api_keys')
      .where('id', id)
      .where('merchant_id', merchantId)
      .update({
        is_active: false,
        updated_at: new Date()
      });
  }

  static async createRate(merchantId: number, data: CreateRateRequest) {
    const [id] = await db('merchant_rates').insert({
      merchant_id: merchantId,
      payment_method: data.paymentMethod,
      currency: data.currency || 'CNY',
      transaction_rate: data.transactionRate,
      fixed_fee: data.fixedFee || 0,
      min_fee: data.minFee || null,
      max_fee: data.maxFee || null,
      effective_from: data.effectiveFrom,
      effective_to: data.effectiveTo || null,
      is_active: true
    });
    
    return this.getRateById(id);
  }

  static async getRateById(id: number) {
    return db('merchant_rates').where('id', id).first();
  }

  static async listRates(merchantId: number, paymentMethod?: string) {
    let query = db('merchant_rates').where('merchant_id', merchantId);
    
    if (paymentMethod) {
      query = query.where('payment_method', paymentMethod);
    }
    
    return query.select('*').orderBy('created_at', 'desc');
  }

  static async updateRate(id: number, merchantId: number, data: Partial<CreateRateRequest>) {
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.transactionRate !== undefined) updateData.transaction_rate = data.transactionRate;
    if (data.fixedFee !== undefined) updateData.fixed_fee = data.fixedFee;
    if (data.minFee !== undefined) updateData.min_fee = data.minFee;
    if (data.maxFee !== undefined) updateData.max_fee = data.maxFee;
    if (data.effectiveFrom !== undefined) updateData.effective_from = data.effectiveFrom;
    if (data.effectiveTo !== undefined) updateData.effective_to = data.effectiveTo;
    
    await db('merchant_rates')
      .where('id', id)
      .where('merchant_id', merchantId)
      .update(updateData);
    
    return this.getRateById(id);
  }

  static async getMerchantStats(merchantId: number, startDate?: Date, endDate?: Date) {
    let query = db('merchant_stats').where('merchant_id', merchantId);
    
    if (startDate) {
      query = query.where('stat_date', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('stat_date', '<=', endDate);
    }
    
    const stats = await query.select('*').orderBy('stat_date', 'asc');
    
    const summary = stats.reduce((acc, stat) => ({
      totalTransactions: acc.totalTransactions + (stat.total_transactions || 0),
      totalAmount: acc.totalAmount + (parseFloat(stat.total_amount) || 0),
      successfulTransactions: acc.successfulTransactions + (stat.successful_transactions || 0),
      successfulAmount: acc.successfulAmount + (parseFloat(stat.successful_amount) || 0),
      failedTransactions: acc.failedTransactions + (stat.failed_transactions || 0),
      failedAmount: acc.failedAmount + (parseFloat(stat.failed_amount) || 0),
      totalFee: acc.totalFee + (parseFloat(stat.total_fee) || 0)
    }), {
      totalTransactions: 0,
      totalAmount: 0,
      successfulTransactions: 0,
      successfulAmount: 0,
      failedTransactions: 0,
      failedAmount: 0,
      totalFee: 0
    });
    
    return {
      summary,
      dailyStats: stats
    };
  }

  static async assignPermission(merchantId: number, permissionCode: string, permissionName: string, description?: string) {
    const [id] = await db('merchant_permissions').insert({
      merchant_id: merchantId,
      permission_code: permissionCode,
      permission_name: permissionName,
      description: description || null
    });
    
    return db('merchant_permissions').where('id', id).first();
  }

  static async removePermission(merchantId: number, permissionCode: string) {
    return db('merchant_permissions')
      .where('merchant_id', merchantId)
      .where('permission_code', permissionCode)
      .delete();
  }

  static async listPermissions(merchantId: number) {
    return db('merchant_permissions')
      .where('merchant_id', merchantId)
      .select('*');
  }

  static async hasPermission(merchantId: number, permissionCode: string) {
    const permission = await db('merchant_permissions')
      .where('merchant_id', merchantId)
      .where('permission_code', permissionCode)
      .first();
    
    return !!permission;
  }
}
