// 合并各主题的同类数据；重复 ID 保留先加载项，跳过后加载项，避免中断整个 BOSS 包。
const mergeBossModules = (dataType, modules) => {
    const result = {};
    for (const [moduleName, data] of modules) {
        for (const [id, value] of Object.entries(data || {})) {
            if (Object.prototype.hasOwnProperty.call(result, id)) {
                console.warn(`术樱包活动BOSS：跳过${moduleName}中重复的${dataType}ID“${id}”`);
                continue;
            }
            result[id] = value;
        }
    }
    return result;
};

// 从标准主题入口中提取指定字段，再复用统一的重复 ID 处理规则。
const mergeBossSection = (dataType, modules, section) => {
    return mergeBossModules(dataType, modules.map(([moduleName, data]) => [moduleName, data?.[section]]));
};

export { mergeBossSection };
export default mergeBossModules;
