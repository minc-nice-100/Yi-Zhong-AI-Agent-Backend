import { IDatabaseConnection, IAIChatSessionRepository } from '../../../utils/database';
import { AI_chat_session } from '../../../types/database';

/**
 * DuckDB AI聊天会话仓储实现类
 * 负责AI聊天会话数据的持久化和查询操作
 */
export class DuckDBSessionRepository implements IAIChatSessionRepository {
  private connection: IDatabaseConnection;

  constructor(connection: IDatabaseConnection) {
    this.connection = connection;
  }

  /**
   * 创建会话表
   */
  async createTable(): Promise<void> {
    const sql: string = `
      CREATE TABLE IF NOT EXISTS ai_chat_sessions (
        session_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,
        deleted_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `;
    await this.connection.execute(sql);
  }

  /**
   * 插入新会话
   * @param sessionData 会话数据，不包含session_id、created_at和updated_at
   * @returns 插入后的完整会话数据
   */
  async insert(sessionData: Omit<AI_chat_session, 'session_id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<AI_chat_session> {
    const insertSql: string = `
      INSERT INTO ai_chat_sessions (user_id)
      VALUES (?)
    `;
    
    await this.connection.execute(insertSql, [sessionData.user_id]);
    
    // 获取插入后的会话数据
    const selectSql: string = `
      SELECT 
        session_id,
        user_id,
        created_at,
        updated_at,
        deleted_at
      FROM ai_chat_sessions 
      WHERE rowid = last_insert_rowid()
    `;
    
    const result: AI_chat_session | null = await this.connection.queryOne<AI_chat_session>(selectSql);
    if (!result) {
      throw new Error('插入会话后无法获取会话数据');
    }
    
    return result;
  }

  /**
   * 根据会话ID查找会话
   * @param id 会话ID
   * @returns 会话数据或null
   */
  async findById(id: number): Promise<AI_chat_session | null> {
    const sql: string = `
      SELECT 
        session_id,
        user_id,
        created_at,
        updated_at,
        deleted_at
      FROM ai_chat_sessions 
      WHERE session_id = ?
    `;
    return await this.connection.queryOne<AI_chat_session>(sql, [id]);
  }

  /**
   * 根据用户ID查找会话
   * @param userId 用户ID
   * @returns 会话列表
   */
  async findByUserId(userId: number): Promise<AI_chat_session[]> {
    const sql: string = `
      SELECT 
        session_id,
        user_id,
        created_at,
        updated_at,
        deleted_at
      FROM ai_chat_sessions 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    const result: { rows: AI_chat_session[] } = await this.connection.query<AI_chat_session>(sql, [userId]);
    return result.rows;
  }

  /**
   * 更新会话的最后活动时间
   * 只更新updated_at字段，其他字段不应该通过此方法修改
   * 
   * @param id 会话ID
   * @returns 是否更新成功
   */
  async update(id: number): Promise<boolean> {
    const sql = 'UPDATE ai_chat_sessions SET updated_at = ? WHERE session_id = ?';
    const changes = await this.connection.execute(sql, [new Date(), id]);
    return changes > 0;
  }

  /**
   * 软删除会话（标记为已删除，不实际删除记录）
   * @param id 会话ID
   * @returns 是否软删除成功
   */
  async delete(id: number): Promise<boolean> {
    const sql: string = 'UPDATE ai_chat_sessions SET updated_at = ?, deleted_at = ? WHERE session_id = ?';
    const now = new Date();
    const changes = await this.connection.execute(sql, [now, now, id]);
    return changes > 0;
  }

  /**
   * 硬删除会话（从数据库中实际删除记录）
   * @param id 会话ID
   * @returns 是否删除成功
   */
  async hardDelete(id: number): Promise<boolean> {
    const sql: string = 'DELETE FROM ai_chat_sessions WHERE session_id = ?';
    const changes = await this.connection.execute(sql, [id]);
    return changes > 0;
  }

  /**
   * 恢复已软删除的会话
   * @param id 会话ID
   * @returns 是否恢复成功
   */
  async restore(id: number): Promise<boolean> {
    const sql: string = 'UPDATE ai_chat_sessions SET updated_at = ?, deleted_at = NULL WHERE session_id = ?';
    const changes = await this.connection.execute(sql, [new Date(), id]);
    return changes > 0;
  }

  /**
   * 获取最近的会话
   * @param userId 用户ID
   * @param limit 限制返回的会话数量
   * @returns 会话列表
   */
  async findRecentByUserId(userId: number, limit: number = 10): Promise<AI_chat_session[]> {
    const sql: string = `
      SELECT 
        session_id,
        user_id,
        created_at,
        updated_at
      FROM ai_chat_sessions 
      WHERE user_id = ? 
      ORDER BY updated_at DESC
      LIMIT ?
    `;
    const result = await this.connection.query<AI_chat_session>(sql, [userId, limit]);
    return result.rows;
  }

  /**
   * 获取会话数量
   * @param userId 用户ID（可选）
   * @returns 会话数量
   */
  async count(userId?: number): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM ai_chat_sessions';
    const params: any[] = [];
    
    if (userId) {
      sql += ' WHERE user_id = ?';
      params.push(userId);
    }
    
    const result = await this.connection.queryOne<{ count: number }>(sql, params);
    return result ? result.count : 0;
  }

  /**
   * 检查会话是否存在
   * @param id 会话ID
   * @returns 是否存在
   */
  async exists(id: number): Promise<boolean> {
    const sql: string = 'SELECT 1 FROM ai_chat_sessions WHERE session_id = ? LIMIT 1';
    const result = await this.connection.queryOne(sql, [id]);
    return result !== null;
  }

  /**
   * 删除用户的所有会话
   * 使用数据库函数减少锁竞争
   * 
   * @param userId 用户ID
   * @returns 删除的会话数量
   */
  async deleteByUserId(userId: number): Promise<number> {
    const deleteSql: string = 'DELETE FROM ai_chat_sessions WHERE user_id = ?';
    return await this.connection.execute(deleteSql, [userId]);
  }
}