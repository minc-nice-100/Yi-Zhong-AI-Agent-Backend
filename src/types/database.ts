import { AiRequest } from "./ai";
import { phone_number, UUID } from "./general";



/**
 * 用户实体接口 - 表示系统中的用户信息
 * 包含用户的基本信息、认证信息和时间戳
 */
export interface user {
    /** 用户唯一标识符 - 数据库自增主键 */
    user_id: number;
    
    /** 用户UUID - 用于外部引用的全局唯一标识符 */
    UUID: UUID;
    
    /** 用户名 - 用户登录时使用的唯一名称 */
    username: string;
    
    /** 用户昵称 - 显示给其他用户的友好名称 */
    nick:string;
    
    /** 用户电话号码 - 包含国家码和号码的复合类型 */
    phone_number: phone_number;
    
    /** 密码哈希 - 加密存储的用户密码，不存储明文 */
    password_hash: string;
    
    /** 创建时间 - 用户账号创建的时间戳 */
    created_at: Date;
    
    /** 更新时间 - 用户信息最后修改的时间戳，可选字段 */
    updated_at?: Date;
    
    /** 删除时间 - 软删除标记，记录用户被删除的时间戳，可选字段 */
    deleted_at?: Date;
    
    /** OAuth2认证信息 - 第三方登录平台的认证数据，可选字段 */
    oauth2?: any;

}


/**
 * AI聊天会话接口 - 表示用户与AI的对话会话
 * 每个会话包含一系列相关的消息
 */
export interface AI_chat_session{
    /** 会话唯一标识符 - 数据库自增主键 */
    session_id: number;
    
    /** 关联的用户ID - 引用user表的user_id字段，建立会话与用户的关联 */
    user_id: user["user_id"];
    
    /** 会话创建时间 - 会话开始的时间戳 */
    created_at: Date;
    
    /** 会话更新时间 - 会话最后活动的时间戳，可选字段 */
    updated_at?: Date;
}

/**
 * AI聊天消息接口 - 表示会话中的单条消息
 * 继承自AiRequest接口，包含AI请求的所有字段
 */
export interface AI_chat_message extends AiRequest{
    /** 消息唯一标识符 - 数据库自增主键 */
    message_id: number;
    
    /** 关联的会话ID - 引用AI_chat_session表的session_id字段，建立消息与会话的关联 */
    session_id:AI_chat_session["session_id"];
    
    /** 关联的用户ID - 引用AI_chat_session表的user_id字段，建立消息与用户的关联 */
    user_id:AI_chat_session["user_id"];
}