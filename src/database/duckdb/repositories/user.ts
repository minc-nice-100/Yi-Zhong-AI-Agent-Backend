import { IDatabaseConnection, IUserRepository } from '../../../utils/database';
import { user } from '../../../types/database';
import { UUID } from '../../../types/general';

/**
 * DuckDB用户仓储实现类
 * 负责用户数据的持久化和查询操作
 */
export class DuckDBUserRepository implements IUserRepository {
  private connection: IDatabaseConnection;
  
  constructor(connection: IDatabaseConnection) {
    this.connection = connection;
  }

  /**
   * 创建用户表
   */
  async createTable(): Promise<void> {
    const sql: string = `
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid VARCHAR(36) UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        nick VARCHAR(255),
        phone_number_country_code INTEGER,
        phone_number_number INTEGER,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,
        deleted_at TIMESTAMP,
        oauth2 JSON
      )
    `;
    await this.connection.execute(sql);
  }

  /**
   * 插入新用户
   * @param userData 用户数据，不包含user_id、created_at和updated_at
   * @returns 插入后的完整用户数据
   */
  async insert(userData: Omit<user, 'user_id' | 'created_at' | 'updated_at'>): Promise<user> {
    const sql: string = `
      INSERT INTO users (uuid, username, nick, phone_number_country_code, phone_number_number, password_hash, oauth2)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.connection.execute(sql, [
      userData.UUID.value,
      userData.username,
      userData.nick,
      userData.phone_number.country_code,
      userData.phone_number.number,
      userData.password_hash,
      userData.oauth2 ? JSON.stringify(userData.oauth2) : null
    ]);
    
    // 获取插入后的用户数据
    const insertSql: string = `
      SELECT 
        user_id,
        uuid as UUID,
        username,
        nick,
        phone_number_country_code as phone_number_country_code,
        phone_number_number as phone_number_number,
        password_hash,
        created_at,
        updated_at,
        deleted_at,
        oauth2
      FROM users 
      WHERE uuid = ?
    `;
    
    const result: user | null = await this.connection.queryOne<user>(insertSql, [userData.UUID.value]);
    if (!result) {
      throw new Error('插入用户后无法获取用户数据');
    }
    
    return result;
  }

  /**
   * 根据用户ID查找用户
   * @param id 用户ID
   * @returns 用户数据或null
   */
  async findById(id: number): Promise<user | null> {
    const sql: string = `
      SELECT 
        user_id,
        uuid as UUID,
        username,
        nick,
        phone_number_country_code as phone_number_country_code,
        phone_number_number as phone_number_number,
        password_hash,
        created_at,
        updated_at,
        deleted_at,
        oauth2
      FROM users 
      WHERE user_id = ? AND deleted_at IS NULL
    `;
    return await this.connection.queryOne<user>(sql, [id]);
  }

  /**
   * 根据用户名查找用户
   * @param username 用户名
   * @returns 用户数据或null
   */
  async findByUsername(username: string): Promise<user | null> {
    const sql: string = `
      SELECT 
        user_id,
        uuid as UUID,
        username,
        nick,
        phone_number_country_code as phone_number_country_code,
        phone_number_number as phone_number_number,
        password_hash,
        created_at,
        updated_at,
        deleted_at,
        oauth2
      FROM users 
      WHERE username = ? AND deleted_at IS NULL
    `;
    return await this.connection.queryOne<user>(sql, [username]);
  }

  /**
   * 根据UUID查找用户
   * @param uuid 用户UUID
   * @returns 用户数据或null
   */
  async findByUUID(uuid: UUID): Promise<user | null> {
    const sql: string = `
      SELECT 
        user_id,
        uuid as UUID,
        username,
        nick,
        phone_number_country_code as phone_number_country_code,
        phone_number_number as phone_number_number,
        password_hash,
        created_at,
        updated_at,
        deleted_at,
        oauth2
      FROM users 
      WHERE uuid = ? AND deleted_at IS NULL
    `;
    
    const dbResult = await this.connection.queryOne<{
      user_id: number;
      uuid: string;
      username: string;
      nick: string;
      phone_number_country_code: number;
      phone_number_number: number;
      password_hash: string;
      created_at: Date;
      updated_at: Date | null;
      deleted_at: Date | null;
      oauth2: string | null;
    }>(sql, [uuid.value]);
    
    if (!dbResult) {
      return null;
    }
    
    // 安全地转换数据库结果为user对象
    return {
      user_id: dbResult.user_id,
      UUID: { value: dbResult.uuid } as UUID,
      username: dbResult.username,
      nick: dbResult.nick,
      phone_number: {
        country_code: dbResult.phone_number_country_code,
        number: dbResult.phone_number_number
      },
      password_hash: dbResult.password_hash,
      created_at: dbResult.created_at,
      updated_at: dbResult.updated_at,
      deleted_at: dbResult.deleted_at,
      oauth2: dbResult.oauth2 ? JSON.parse(dbResult.oauth2) : null
    };
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param userData 要更新的用户数据
   * @returns 是否更新成功
   */
  async update(id: number, userData: Partial<Omit<user, 'user_id' | 'UUID' | 'created_at' | 'deleted_at'>>): Promise<boolean> {
    const fields = Object.keys(userData).filter(key => 
      key !== 'user_id' && 
      key !== 'UUID' && 
      key !== 'created_at' &&
      key !== 'deleted_at'
    );
    
    if (fields.length === 0) return false;

    // 处理oauth2字段，如果是对象则转换为JSON字符串
    const updateData: any = { ...userData };
    if (updateData.oauth2 && typeof updateData.oauth2 === 'object') {
      updateData.oauth2 = JSON.stringify(updateData.oauth2);
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateData[field]);
    values.push(new Date(), id); // updated_at and user_id

    const sql: string = `
      UPDATE users 
      SET ${setClause}, updated_at = ?
      WHERE user_id = ?
    `;
    const changes: number = await this.connection.execute(sql, values);
    return changes > 0;
  }

  /**
   * 软删除用户
   * @param id 用户ID
   * @returns 是否删除成功
   */
  async softDelete(id: number): Promise<boolean> {
    const sql: string = 'UPDATE users SET deleted_at = ? WHERE user_id = ?';
    const changes: number = await this.connection.execute(sql, [new Date(), id]);
    return changes > 0;
  }

  /**
   * 硬删除用户
   * @param id 用户ID
   * @returns 是否删除成功
   */
  async hardDelete(id: number): Promise<boolean> {
    const sql: string = 'DELETE FROM users WHERE user_id = ?';
    const changes: number = await this.connection.execute(sql, [id]);
    return changes > 0;
  }

  /**
   * 获取所有用户
   * @returns 用户列表
   */
  async findAll(): Promise<user[]> {
    const sql: string = `
      SELECT 
        user_id,
        uuid as UUID,
        username,
        nick,
        phone_number_country_code as phone_number_country_code,
        phone_number_number as phone_number_number,
        password_hash,
        created_at,
        updated_at,
        deleted_at,
        oauth2
      FROM users 
      WHERE deleted_at IS NULL
    `;
    
    const result: { rows: user[] } = await this.connection.query<user>(sql);
    
    // 处理oauth2字段，如果是JSON字符串则解析
    result.rows.forEach(user => {
      if (user.oauth2 && typeof user.oauth2 === 'string') {
        try {
          user.oauth2 = JSON.parse(user.oauth2);
        } catch (e) {
          // 如果解析失败，保持原值
        }
      }
    });
    
    return result.rows;
  }
}