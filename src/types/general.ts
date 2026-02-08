/**
 * 表示电话号码的类型，包含国家码和号码
 */
export interface phone_number{
    country_code: number;
    number: number;
}

/**
 * 表示UUID字符串的类型，用于确保类型安全
 */
export interface UUID {
    value: string & { __brand: 'UUID' };
}

/**
 * UUID类型守卫函数 - 保留在类型定义文件中，便于类型检查
 * @param uuid 待验证的字符串
 * @returns 是否为有效的UUID格式
 */
export function isValidUUID(uuid: string): uuid is UUID['value'] {
    // 支持36位带连字符的标准格式
    if (uuid.length === 36) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    
    // 支持32位不带连字符的格式
    if (uuid.length === 32) {
        const uuidRegex = /^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    
    return false;
}

/**
 * UUID工厂函数 - 基本创建逻辑保留在类型文件中
 * @param value UUID字符串，如果不提供则生成新的
 * @returns UUID对象
 */
export function createUUID(value?: string): UUID {
    if (!value) {
        // 简单的UUID生成逻辑，复杂生成逻辑移至utils
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        value = uuid;
    }
    
    if (!isValidUUID(value)) {
        throw new Error(`Invalid UUID format: ${value}`);
    }
    
    return { value: value as UUID['value'] };
}