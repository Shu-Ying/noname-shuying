import bossSets from "./sets.js";

// 技能语音按实际 ext 音频目录生成台词键；阵亡语音仍使用“#角色ID:die”。
const voices = {};
for (const [setName, set] of bossSets) {
    for (const [key, text] of Object.entries(set.voices || {})) {
        const voiceKey = key.endsWith(":die")
            ? key
            : `#ext:术樱包/pve/audio/skill/${setName}/${key.replace(/^#/, "")}`;
        if (Object.prototype.hasOwnProperty.call(voices, voiceKey)) {
            console.warn(`活动BOSS：跳过${setName}中重复的语音台词 ID“${voiceKey}”`);
            continue;
        }
        voices[voiceKey] = text;
    }
}

export default voices;
