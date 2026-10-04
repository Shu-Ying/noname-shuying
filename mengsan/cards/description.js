// 普通使用费用由牌面单独显示；效果中的获能、减费与 X 消耗规则仍须保留。
export function cleanCardDescription(value) {
    if (typeof value !== "string") return value;
    return value.trim()
        .replace(/^梦三\s*[：:]\s*/, "")
        .replace(/^(?:主动使用消耗\s*\d+\s*(?:点)?费用|响应不消耗费用|\d+\s*(?:点)?费(?:用)?)[。；：:，,]\s*/, "")
        .replace(/^(?:主动使用消耗X费用|X费)[。；]\s*/, "消耗当前剩余费用，消耗量为X。");
}
