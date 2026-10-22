const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
(async () => {
    const root = path.resolve(__dirname, '..');
    const { statusIconNames } = await import(pathToFileURL(path.join(root, 'ui/hud/status-model.js')).href);
    const source = path.join(root, 'assets/sts2/Godot_Atlas_Sprites_v0.111.0/images/atlases/power_atlas.sprites');
    const output = path.join(root, 'assets/status');
    fs.mkdirSync(output, {recursive:true});
    const entries = [], missing = [];
    for (const name of statusIconNames) {
        if (!/^[a-z0-9_]+\.png$/.test(name)) throw new Error('Invalid icon name');
        if (!fs.existsSync(path.join(source,name))) { missing.push(name);continue; }
        const bytes = fs.readFileSync(path.join(source,name));
        if (bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a') throw new Error('Invalid PNG: '+name);
        const target=path.join(output,name);
        if(fs.existsSync(target)&&!fs.readFileSync(target).equals(bytes))throw new Error('Existing icon differs: '+name);
        fs.writeFileSync(target,bytes);
        entries.push({name,bytes:bytes.length,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
    }
    fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({sourceVersion:'v0.111.0',source:'images/atlases/power_atlas.sprites',entries,missing},null,2)+'\n');
    console.log(JSON.stringify({icons:entries.length,missing,bytes:entries.reduce((n,e)=>n+e.bytes,0)}));
})().catch(error=>{console.error(error);process.exitCode=1;});
