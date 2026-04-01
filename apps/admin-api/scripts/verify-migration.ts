/**
 * 数据迁移验证脚本
 * 验证套餐服务体系升级的数据迁移是否正确
 */

import { db } from '../src/database';
import { logger } from '../src/utils/logger';

interface ValidationResult {
  check: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
}

async function validateTableExists(tableName: string): Promise<ValidationResult> {
  try {
    const result = await db.raw(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = ?
    `, [tableName]);
    
    const exists = result[0][0].count > 0;
    
    return {
      check: `Table ${tableName} exists`,
      status: exists ? 'passed' : 'failed',
      message: exists ? `Table ${tableName} exists` : `Table ${tableName} does not exist`
    };
  } catch (error) {
    return {
      check: `Table ${tableName} exists`,
      status: 'failed',
      message: `Error checking table ${tableName}: ${error.message}`
    };
  }
}

async function validateColumnExists(tableName: string, columnName: string): Promise<ValidationResult> {
  try {
    const result = await db.raw(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
      AND table_name = ? 
      AND column_name = ?
    `, [tableName, columnName]);
    
    const exists = result[0][0].count > 0;
    
    return {
      check: `Column ${tableName}.${columnName} exists`,
      status: exists ? 'passed' : 'failed',
      message: exists ? `Column ${columnName} exists in ${tableName}` : `Column ${columnName} does not exist in ${tableName}`
    };
  } catch (error) {
    return {
      check: `Column ${tableName}.${columnName} exists`,
      status: 'failed',
      message: `Error checking column ${columnName}: ${error.message}`
    };
  }
}

async function validateIndexExists(tableName: string, indexName: string): Promise<ValidationResult> {
  try {
    const result = await db.raw(`
      SELECT COUNT(*) as count 
      FROM information_schema.statistics 
      WHERE table_schema = DATABASE() 
      AND table_name = ? 
      AND index_name = ?
    `, [tableName, indexName]);
    
    const exists = result[0][0].count > 0;
    
    return {
      check: `Index ${indexName} on ${tableName} exists`,
      status: exists ? 'passed' : 'failed',
      message: exists ? `Index ${indexName} exists on ${tableName}` : `Index ${indexName} does not exist on ${tableName}`
    };
  } catch (error) {
    return {
      check: `Index ${indexName} on ${tableName} exists`,
      status: 'failed',
      message: `Error checking index ${indexName}: ${error.message}`
    };
  }
}

async function validateDefaultValues(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  try {
    // 验证套餐默认值
    const planDefaults = await db('subscription_plans')
      .whereNull('group_id')
      .count('* as count');
    
    results.push({
      check: 'Plan group_id default value',
      status: 'passed',
      message: `Found ${planDefaults[0].count} plans with null group_id (will use default)`,
      details: { count: planDefaults[0].count }
    });
    
    // 验证节点默认值
    const nodeDefaults = await db('nodes')
      .whereNull('ip_type')
      .count('* as count');
    
    results.push({
      check: 'Node ip_type default value',
      status: 'passed',
      message: `Found ${nodeDefaults[0].count} nodes with null ip_type (will use default)`,
      details: { count: nodeDefaults[0].count }
    });
    
    // 验证服务类型默认值
    const serviceTypeDefaults = await db('subscription_plans')
      .whereNull('primary_service_type')
      .count('* as count');
    
    results.push({
      check: 'Plan primary_service_type default value',
      status: serviceTypeDefaults[0].count === 0 ? 'passed' : 'warning',
      message: `Found ${serviceTypeDefaults[0].count} plans with null primary_service_type`,
      details: { count: serviceTypeDefaults[0].count }
    });
    
  } catch (error) {
    results.push({
      check: 'Default values validation',
      status: 'failed',
      message: `Error validating default values: ${error.message}`
    });
  }
  
  return results;
}

async function validateDataIntegrity(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  try {
    // 验证套餐数据完整性
    const plansWithInvalidServiceTypes = await db('subscription_plans')
      .whereNotNull('service_types')
      .andWhere(function() {
        this.whereNull('primary_service_type')
            .orWhereRaw('JSON_LENGTH(service_types) = 0');
      })
      .count('* as count');
    
    results.push({
      check: 'Plans with valid service types',
      status: plansWithInvalidServiceTypes[0].count === 0 ? 'passed' : 'warning',
      message: `Found ${plansWithInvalidServiceTypes[0].count} plans with invalid service types`,
      details: { count: plansWithInvalidServiceTypes[0].count }
    });
    
    // 验证节点关联
    const nodesWithPools = await db('nodes')
      .whereNotNull('ip_pool_id')
      .count('* as count');
    
    results.push({
      check: 'Nodes with IP pools',
      status: 'passed',
      message: `Found ${nodesWithPools[0].count} nodes associated with IP pools`,
      details: { count: nodesWithPools[0].count }
    });
    
    // 验证外键约束
    const orphanedPools = await db('ip_pools')
      .leftJoin('nodes', 'ip_pools.node_id', 'nodes.id')
      .whereNull('nodes.id')
      .count('* as count');
    
    results.push({
      check: 'Orphaned IP pools',
      status: orphanedPools[0].count === 0 ? 'passed' : 'warning',
      message: `Found ${orphanedPools[0].count} orphaned IP pools`,
      details: { count: orphanedPools[0].count }
    });
    
  } catch (error) {
    results.push({
      check: 'Data integrity validation',
      status: 'failed',
      message: `Error validating data integrity: ${error.message}`
    });
  }
  
  return results;
}

async function validateIndexes(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  const requiredIndexes = [
    { table: 'ip_pools', index: 'idx_ip_pools_node_id' },
    { table: 'ip_pools', index: 'idx_ip_pools_ip_type' },
    { table: 'ip_pools', index: 'idx_ip_pools_is_active' },
    { table: 'ip_pool_ips', index: 'idx_ip_pool_ips_pool_id' },
    { table: 'ip_pool_ips', index: 'idx_ip_pool_ips_status' },
    { table: 'subscription_plans', index: 'idx_plans_service_type' },
    { table: 'subscription_plans', index: 'idx_plans_group_id' },
    { table: 'subscription_plans', index: 'idx_plans_is_active' },
    { table: 'user_subscriptions', index: 'idx_subscriptions_user_id' },
    { table: 'user_subscriptions', index: 'idx_subscriptions_plan_id' },
    { table: 'nodes', index: 'idx_nodes_service_type' },
    { table: 'nodes', index: 'idx_nodes_ip_pool_id' }
  ];
  
  for (const { table, index } of requiredIndexes) {
    const result = await validateIndexExists(table, index);
    results.push(result);
  }
  
  return results;
}

async function runValidation(): Promise<void> {
  logger.info('Starting migration validation...');
  
  const allResults: ValidationResult[] = [];
  
  // 1. 验证表结构
  logger.info('Validating table structure...');
  const tables = [
    'ip_pools',
    'ip_pool_ips',
    'ip_reputation_cache'
  ];
  
  for (const table of tables) {
    allResults.push(await validateTableExists(table));
  }
  
  // 2. 验证新增列
  logger.info('Validating new columns...');
  const columns = [
    { table: 'subscription_plans', column: 'group_id' },
    { table: 'subscription_plans', column: 'service_types' },
    { table: 'subscription_plans', column: 'primary_service_type' },
    { table: 'subscription_plans', column: 'priority_boost' },
    { table: 'subscription_plans', column: 'guaranteed_bandwidth' },
    { table: 'nodes', column: 'ip_type' },
    { table: 'nodes', column: 'ip_pool_id' },
    { table: 'nodes', column: 'ip_score' }
  ];
  
  for (const { table, column } of columns) {
    allResults.push(await validateColumnExists(table, column));
  }
  
  // 3. 验证索引
  logger.info('Validating indexes...');
  const indexResults = await validateIndexes();
  allResults.push(...indexResults);
  
  // 4. 验证默认值
  logger.info('Validating default values...');
  const defaultResults = await validateDefaultValues();
  allResults.push(...defaultResults);
  
  // 5. 验证数据完整性
  logger.info('Validating data integrity...');
  const integrityResults = await validateDataIntegrity();
  allResults.push(...integrityResults);
  
  // 输出结果
  console.log('\n========================================');
  console.log('Migration Validation Results');
  console.log('========================================\n');
  
  const passed = allResults.filter(r => r.status === 'passed');
  const failed = allResults.filter(r => r.status === 'failed');
  const warnings = allResults.filter(r => r.status === 'warning');
  
  console.log(`Total: ${allResults.length} checks`);
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log('');
  
  // 详细结果
  if (failed.length > 0) {
    console.log('FAILED CHECKS:');
    console.log('----------------------------------------');
    failed.forEach(result => {
      console.log(`[FAIL] ${result.check}`);
      console.log(`       ${result.message}`);
      if (result.details) {
        console.log(`       Details: ${JSON.stringify(result.details)}`);
      }
      console.log('');
    });
  }
  
  if (warnings.length > 0) {
    console.log('WARNINGS:');
    console.log('----------------------------------------');
    warnings.forEach(result => {
      console.log(`[WARN] ${result.check}`);
      console.log(`       ${result.message}`);
      if (result.details) {
        console.log(`       Details: ${JSON.stringify(result.details)}`);
      }
      console.log('');
    });
  }
  
  if (passed.length > 0) {
    console.log('PASSED CHECKS:');
    console.log('----------------------------------------');
    passed.forEach(result => {
      console.log(`[PASS] ${result.check}`);
    });
    console.log('');
  }
  
  console.log('========================================');
  
  if (failed.length > 0) {
    console.log('\nValidation FAILED. Please fix the issues before proceeding.');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\nValidation PASSED with warnings. Please review the warnings.');
    process.exit(0);
  } else {
    console.log('\nValidation PASSED. All checks successful!');
    process.exit(0);
  }
}

// 运行验证
runValidation().catch(error => {
  logger.error('Validation failed with error:', error);
  process.exit(1);
});
