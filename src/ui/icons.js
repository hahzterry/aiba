/* Local action icon renderer. Paths follow Lucide's ISC-licensed icon set. */
(function(global){
  "use strict";
  const ICONS={
    camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    "volume-1":'<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    "volume-2":'<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    "volume-x":'<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>',
    pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    "arrow-left":'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    settings:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    "book-open":'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    video:'<path d="m16 13 5.22 3.48A.5.5 0 0 0 22 16.06V7.94a.5.5 0 0 0-.78-.42L16 11"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    clapperboard:'<path d="m4 11 14-5"/><path d="m6 4 3 7"/><path d="m13 2 3 7"/><path d="M4 7h16a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2"/>',
    "rotate-ccw":'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    play:'<path d="m6 3 14 9-14 9z"/>',
    target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    "hand-pointer":'<path d="M18.5 11.5 17 10l-1.5.5-2-2-1.5.5-2-2-1.5.5V3a2 2 0 0 0-4 0v10l-1.2-1.2a2 2 0 0 0-2.8 2.8l5.7 5.7A6 6 0 0 0 10.4 22H14a6 6 0 0 0 6-6v-1.7a4 4 0 0 0-1.5-2.8z"/>'
  };
  const esc=value=>String(value==null?"":value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const translate=value=>global.AIBAI18N&&global.AIBAI18N.t?global.AIBAI18N.t(value):value;
  function svg(name){return `<svg class="aibaIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||ICONS.target}</svg>`;}
  function set(target,name,label){
    const el=typeof target==="string"?document.getElementById(target):target;if(!el)return null;
    const raw=label==null?(el.dataset.aibaLabel||el.textContent.trim()):String(label),source=raw.replace(/^[^A-Za-z0-9\u3400-\u9fff]+/,""),text=translate(source);
    el.dataset.aibaIcon=name;el.dataset.aibaLabel=source;el.innerHTML=svg(name)+(source?`<span class="aibaIconLabel">${esc(text)}</span>`:"");
    if(source){el.setAttribute("aria-label",text);el.title=text;}
    return el;
  }
  function mount(root){
    if(!root||root.nodeType!==1)return;
    if(root.matches("[data-aiba-icon]"))set(root,root.dataset.aibaIcon,root.dataset.aibaLabel||root.textContent.trim());
    root.querySelectorAll("[data-aiba-icon]").forEach(el=>set(el,el.dataset.aibaIcon,el.dataset.aibaLabel||el.textContent.trim()));
  }
  function boot(){mount(document.body);new MutationObserver(muts=>muts.forEach(m=>m.addedNodes.forEach(mount))).observe(document.body,{childList:true,subtree:true});}
  global.AIBAIcons=Object.freeze({svg,set,mount});global.AIBASetIcon=set;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window);
