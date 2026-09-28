import { lib, game } from "../../../noname.js";

const MODE_ID = "mengsan_shuying";

export default function registerMengsan() {
    if (lib.config.all.mode.includes(MODE_ID)) return;

    game.addMode(MODE_ID, {
        splash: "ext:术樱包/pve/images/tianshu.jpg",
    }, {
        translate: "梦三",
        config: {},
        extension: "术樱包",
    });

    // game.addMode 默认会闭包保存传入的完整模式对象；这里替换为延迟加载器，
    // 确保只有用户真正进入梦三时才解析剧情、地图和奖励等内容模块。
    lib.init[`setMode_${MODE_ID}`] = async () => {
        const { createMengsanMode } = await import("./mode.js");
        const mode = await createMengsanMode();
        await game.import("mode", () => mode);
    };
}
