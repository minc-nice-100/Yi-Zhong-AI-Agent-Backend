import { UUID, isValidUUID } from '../types/general';

/**
 * UUID工具类 - 包含复杂的UUID业务逻辑
 */
export class UUIDUtils {
    /**
     * 生成新的UUID v4
     * @returns 新的UUID字符串
     */
    static generate(): UUID['value'] {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return uuid as UUID['value'];
    }

    /**
     * 生成指定数量的UUID数组
     * @param count 要生成的UUID数量
     * @returns UUID对象数组
     */
    static generateMultiple(count: number): UUID[] {
        if (count <= 0) {
            throw new Error('Count must be a positive number');
        }
        
        return Array.from({ length: count }, () => ({
            value: this.generate()
        }));
    }

    /**
     * 从字符串解析UUID
     * @param uuidString UUID字符串
     * @returns UUID对象或null（如果格式无效）
     */
    static fromString(uuidString: string): UUID | null {
        if (!isValidUUID(uuidString)) {
            return null;
        }
        return { value: uuidString as UUID['value'] };
    }

    /**
     * 尝试从字符串解析UUID，失败时抛出异常
     * @param uuidString UUID字符串
     * @returns UUID对象
     * @throws 当UUID格式无效时抛出异常
     */
    static fromStringOrThrow(uuidString: string): UUID {
        const uuid = this.fromString(uuidString);
        if (!uuid) {
            throw new Error(`Invalid UUID format: ${uuidString}`);
        }
        return uuid;
    }

    /**
     * 比较两个UUID是否相等
     * @param uuid1 第一个UUID
     * @param uuid2 第二个UUID
     * @returns 是否相等
     */
    static equals(uuid1: UUID, uuid2: UUID): boolean {
        return uuid1.value.toLowerCase() === uuid2.value.toLowerCase();
    }

    /**
     * 获取UUID的字符串表示
     * @param uuid UUID对象
     * @returns UUID字符串
     */
    static toString(uuid: UUID): string {
        return uuid.value;
    }

    /**
     * 获取UUID的版本号
     * @param uuid UUID对象或字符串
     * @returns UUID版本号 (1-5)，如果不是有效UUID则返回null
     */
    static getVersion(uuid: UUID | string): number | null {
        const uuidStr = typeof uuid === 'string' ? uuid : uuid.value;
        if (!isValidUUID(uuidStr)) {
            return null;
        }
        
        // UUID版本号位置取决于格式：
        // - 带连字符的36位格式：第14个字符
        // - 不带连字符的32位格式：第12个字符
        const versionCharIndex = uuidStr.includes('-') ? 14 : 12;
        const versionChar = uuidStr[versionCharIndex]!.toLowerCase(); // 注意非空断言
        const version = parseInt(versionChar, 16);
        
        // 确保返回的是有效的UUID版本号（1-5）
        return (version >= 1 && version <= 5) ? version : null;
    }

    /**
     * 检查UUID是否为指定版本
     * @param uuid UUID对象或字符串
     * @param version 期望的版本号
     * @returns 是否为指定版本
     */
    static isVersion(uuid: UUID | string, version: number): boolean {
        return this.getVersion(uuid) === version;
    }

    /**
     * 从UUID对象数组中提取字符串数组
     * @param uuids UUID对象数组
     * @returns UUID字符串数组
     */
    static toStringArray(uuids: UUID[]): string[] {
        return uuids.map(uuid => uuid.value);
    }

    /**
     * 从UUID字符串数组创建UUID对象数组
     * @param uuidStrings UUID字符串数组
     * @returns UUID对象数组，无效字符串将被过滤掉
     */
    static fromStringArray(uuidStrings: string[]): UUID[] {
        return uuidStrings
            .filter(isValidUUID)
            .map(str => ({ value: str as UUID['value'] }));
    }
}