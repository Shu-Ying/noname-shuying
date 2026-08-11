import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import tianshuConfig from "../../tianshu/config.js";

// 统一提供活动 BOSS 技能依赖与天书难度，避免各主题模块重复维护加载路径。
const getTianshuDifficulty = () => {
    return _status[tianshuConfig.settings.difficultyStatusKey] || "normal";
};

export { lib, game, ui, get, ai, _status, getTianshuDifficulty };
