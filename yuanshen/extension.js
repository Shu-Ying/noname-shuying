window.func = (lib, game, ui, get, ai, _status, shuYing) =>
{
    if(!lib.config.extension_术樱包_yuanShenOff) return;

    let yuanShen = new Object();

    yuanShen.connect = true;
    yuanShen.character = {};
    yuanShen.game = {};
    yuanShen.skill = {};
    yuanShen.translate = {};
    yuanShen.perfectPair = {};
    yuanShen.characterTitle = {};
    yuanShen.characterReplace = {};

    let url = shuYing.url + "/yuanshen/"
    let characterList = ["可莉", "八重神子"];

    characterList.forEach(name => 
    { 
        let characterUrl = `${url + name}`;

        lib.init.js(characterUrl, 'character', function()
        {
            try
            {
                Object.assign(yuanShen.character, character.character);
                Object.assign(yuanShen.skill, character.skill);
                Object.assign(yuanShen.translate, character.translate);
            }
            catch(error)
            {

            }
        });
    });
    
    shuYing.appendExtension("shuYing_yuanShen", "原神", yuanShen)
}