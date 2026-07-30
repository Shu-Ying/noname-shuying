/*
 * 语音台词表。
 *
 * 作用：
 * 这里登记的是“音频文件 -> 台词文本”的翻译，不负责播放语音。
 * 语音播放仍由各技能中的 audio: "ext:..." 或 game.playAudio(...) 控制。
 *
 * 写法：
 * 左边填音频路径，不写 .mp3；右边填显示的台词。
 * 例如技能 shuYing_Shizuishi 使用：
 * audio: "ext:术樱包/yuanshen/八重神子:4"
 * 那么底层会按技能名寻找：
 * extension/术樱包/yuanshen/八重神子/shuYing_Shizuishi1.mp3
 * extension/术樱包/yuanshen/八重神子/shuYing_Shizuishi2.mp3
 * ...
 * 对应台词键就是：
 * "#术樱包/yuanshen/八重神子/shuYing_Shizuishi1": "台词"
 */

const shuYingVoice = {
    // 原神 - 八重神子
    // "#术樱包/yuanshen/八重神子/shuYing_Shizuishi1": "此处填写台词。",
    // "#术樱包/yuanshen/八重神子/shuYing_Shashengying1": "此处填写台词。",
    // "#术樱包/yuanshen/八重神子/shuYing_Tianhuxianzhen1": "此处填写台词。",

    // 原神 - 可莉
    // "#术樱包/yuanshen/可莉/shuYing_Pengpeng1": "此处填写台词。",
    // "#术樱包/yuanshen/可莉/shuYing_Honghong1": "此处填写台词。",
    // "#术樱包/yuanshen/可莉/shuYing_Lieyan1": "此处填写台词。",

    // 崩铁 - 花火
    // "#术樱包/bengtie/花火/jiaMian_Skill_shuYing1": "此处填写台词。",
    // "#术樱包/bengtie/花火/huanYv_Skill_shuYing1": "此处填写台词。",
};

function getVoice(obj) {
    const result = {};
    for (const key in obj) {
        const path = key.startsWith("#") ? key.slice(1) : key;
        result[`#ext:${path}`] = obj[key];
    }
    return result;
}

export default getVoice(shuYingVoice);
