import { Database as DuckDb } from 'duckdb';
import { IDatabaseConnection, DatabaseConfig } from '../../utils/database';

/**
 * DuckDB连接实现类
 * 实现IDatabaseConnection接口，提供DuckDB特定的数据库操作
 */
export class DuckDBConnection implements IDatabaseConnection {
  private db: DuckDb;
  private isConnected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.db = new DuckDb(config.connectionString);
    this.isConnected = true;
  }

  /**
   * 执行查询并返回结果
   * @param sql SQL查询语句
   * @param params 查询参数数组
   * @returns 包含查询结果行数和数据的Promise
   */
  async query<T>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number; }> {
    this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      this.db.all(sql, params || [], (err: Error | null, rows: T[]) => {
        if (err) {
          reject(new Error(`查询执行失败: ${err.message}`));
        } else {
          resolve({ rows, rowCount: rows.length });
        }
      });
    });
  }

  /**
   * 执行单行查询
   * @param sql SQL查询语句
   * @param params 查询参数数组
   * @returns 单行结果或null
   */
  async queryOne<T>(sql: string, params?: any[]): Promise<T | null> {
    this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      this.db.get(sql, params || [], (err: Error | null, row: T) => {
        if (err) {
          reject(new Error(`查询执行失败: ${err.message}`));
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * 执行插入、更新或删除操作
   * @param sql SQL语句
   * @param params 参数数组
   * @returns 受影响的行数
   */
  async execute(sql: string, params?: any[]): Promise<number> {
    this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, params || [], function (err: Error | null) {
        if (err) {
          reject(new Error(`执行失败: ${err.message}`));
        } else {
          // @ts-ignore - stmt对象上有changes属性
          resolve(this.changes || 0);
        }
      });
    });
  }

  /**
   * 开始事务
   */
  async beginTransaction(): Promise<void> {
    this.ensureConnected();
    await this.execute('BEGIN TRANSACTION');
  }

  /**
   * 提交事务
   */
  async commit(): Promise<void> {
    this.ensureConnected();
    await this.execute('COMMIT');
  }

  /**
   * 回滚事务
   */
  async rollback(): Promise<void> {
    this.ensureConnected();
    await this.execute('ROLLBACK');
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (!this.isConnected) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      this.db.close((err: Error | null) => {
        if (err) {
          reject(new Error(`关闭连接失败: ${err.message}`));
        } else {
          this.isConnected = false;
          resolve();
        }
      });
    });
  }

  /**
   * 检查连接是否有效
   * @private
   */
  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error('数据库连接已关闭，无法执行操作');
    }
  }

  /**
   * 获取原始DuckDB实例（用于特殊操作）
   * @returns DuckDB实例
   */
  getRawConnection(): DuckDb {
    this.ensureConnected();
    return this.db;
  }
}
