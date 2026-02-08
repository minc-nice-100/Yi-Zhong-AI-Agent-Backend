import { user, AI_chat_session, AI_chat_message } from '../types/database';
import { UUID } from '../types/general';

/**
 * 数据库连接配置接口
 */
export interface DatabaseConfig {
  /** 数据库类型 */
  type: 'duckdb' | 'sqlite' | 'mysql' | 'postgres';
  /** 连接字符串或文件路径 */
  connectionString: string;
  /** 其他连接选项 */
  options?: Record<string, any>;
}

/**
 * 查询结果接口
 */
export interface QueryResult<T> {
  /** 查询返回的数据行 */
  rows: T[];
  /** 受影响的行数 */
  rowCount: number;
}

/**
 * 数据库连接接口 - 抽象数据库连接的基本操作
 */
export interface IDatabaseConnection {
  /**
   * 执行查询并返回结果
   */
  query<T>(sql: string, params?: any[]): Promise<QueryResult<T>>;

  /**
   * 执行单行查询
   */
  queryOne<T>(sql: string, params?: any[]): Promise<T | null>;

  /**
   * 执行插入、更新或删除操作
   */
  execute(sql: string, params?: any[]): Promise<number>;

  /**
   * 开始事务
   */
  beginTransaction(): Promise<void>;

  /**
   * 提交事务
   */
  commit(): Promise<void>;

  /**
   * 回滚事务
   */
  rollback(): Promise<void>;

  /**
   * 关闭连接
   */
  close(): Promise<void>;
}

/**
 * 数据库连接工厂接口 - 用于创建数据库连接
 */
export interface IDatabaseConnectionFactory {
  /**
   * 创建数据库连接
   */
  createConnection(config: DatabaseConfig): Promise<IDatabaseConnection>;
}

/**
 * 用户仓储接口 - 定义用户数据访问方法
 */
export interface IUserRepository {
  /**
   * 创建用户表
   */
  createTable(): Promise<void>;

  /**
   * 插入新用户
   */
  insert(userData: Omit<user, 'user_id' | 'created_at' | 'updated_at'>): Promise<user>;

  /**
   * 根据用户ID查找用户
   */
  findById(id: number): Promise<user | null>;

  /**
   * 根据用户名查找用户
   */
  findByUsername(username: string): Promise<user | null>;

  /**
   * 根据UUID查找用户
   */
  findByUUID(uuid: UUID): Promise<user | null>;

  /**
   * 更新用户信息
   */
  update(id: number, userData: Partial<Omit<user, 'user_id' | 'UUID' | 'created_at'>>): Promise<boolean>;

  /**
   * 软删除用户
   */
  softDelete(id: number): Promise<boolean>;

  /**
   * 硬删除用户
   */
  hardDelete(id: number): Promise<boolean>;

  /**
   * 获取所有用户
   */
  findAll(): Promise<user[]>;
}

/**
 * AI聊天会话仓储接口 - 定义会话数据访问方法
 */
export interface IAIChatSessionRepository {
  /**
   * 创建会话表
   */
  createTable(): Promise<void>;

  /**
   * 插入新会话
   */
  insert(sessionData: Omit<AI_chat_session, 'session_id' | 'created_at' | 'updated_at'>): Promise<AI_chat_session>;

  /**
   * 根据会话ID查找会话
   */
  findById(id: number): Promise<AI_chat_session | null>;

  /**
   * 根据用户ID查找会话
   */
  findByUserId(userId: number): Promise<AI_chat_session[]>;

  /**
   * 更新会话
   */
  update(id: number, data: Partial<Omit<AI_chat_session, 'session_id'>>): Promise<boolean>;

  /**
   * 删除会话
   */
  delete(id: number): Promise<boolean>;
}

/**
 * AI聊天消息仓储接口 - 定义消息数据访问方法
 */
export interface IAIChatMessageRepository {
  /**
   * 创建消息表
   */
  createTable(): Promise<void>;

  /**
   * 插入新消息
   */
  insert(messageData: Omit<AI_chat_message, 'message_id' | 'created_at' | 'updated_at'>): Promise<AI_chat_message>;

  /**
   * 根据消息ID查找消息
   */
  findById(id: number): Promise<AI_chat_message | null>;

  /**
   * 根据会话ID查找消息
   */
  findBySessionId(sessionId: number): Promise<AI_chat_message[]>;

  /**
   * 根据用户ID查找消息
   */
  findByUserId(userId: number): Promise<AI_chat_message[]>;

  /**
   * 更新消息
   */
  update(id: number, data: Partial<Omit<AI_chat_message, 'message_id'>>): Promise<boolean>;

  /**
   * 删除消息
   */
  delete(id: number): Promise<boolean>;
}

/**
 * 数据库上下文接口 - 管理所有仓储
 */
export interface IDatabaseContext {
  /**
   * 用户仓储
   */
  users: IUserRepository;

  /**
   * AI聊天会话仓储
   */
  sessions: IAIChatSessionRepository;

  /**
   * AI聊天消息仓储
   */
  messages: IAIChatMessageRepository;

  /**
   * 初始化数据库
   */
  initialize(): Promise<void>;

  /**
   * 关闭数据库连接
   */
  close(): Promise<void>;
}

/**
 * 数据库工厂接口 - 创建数据库上下文
 */
export interface IDatabaseFactory {
  /**
   * 创建数据库上下文
   */
  createContext(config: DatabaseConfig): Promise<IDatabaseContext>;
}

/**
 * 数据库管理器 - 主要入口点
 */
export class DatabaseManager {
  private context: IDatabaseContext | null = null;
  private factory: IDatabaseFactory;

  constructor(factory: IDatabaseFactory) {
    this.factory = factory;
  }

  /**
   * 初始化数据库
   */
  async initialize(config: DatabaseConfig): Promise<void> {
    this.context = await this.factory.createContext(config);
    await this.context.initialize();
  }

  /**
   * 获取数据库上下文
   */
  getContext(): IDatabaseContext {
    if (!this.context) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.context;
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }
}
