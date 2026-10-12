import { lib } from "../../../../noname.js";
export function relicImageURL(image) {
    return typeof image==="string" && /^extension\/术樱包\/mengsan\/assets\/relics\/[a-z0-9_]+\.png$/.test(image) ? (lib.assetURL || "")+image : null;
}
export function createRelicIcon(image) {
    const src=relicImageURL(image);if(!src)return null;
    const icon=document.createElement("img");
    icon.className="mengsan-relic-icon-shuying";icon.src=src;icon.alt="";
    icon.setAttribute("aria-hidden","true");icon.width=48;icon.height=48;icon.loading="lazy";
    icon.addEventListener("error",()=>icon.remove(),{once:true});return icon;
}
