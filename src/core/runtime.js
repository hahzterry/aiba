(function(global){
  "use strict";

  const experimental=global.__AIBA_NEXT__===true;
  const storagePrefix="aiba_next_v1:";
  const services=Object.create(null);
  const listeners=Object.create(null);

  function scopeLocalStorage(){
    if(!experimental||global.__AIBA_STORAGE_SCOPE__)return;
    let storage,proto;
    try{
      storage=global.localStorage;
      proto=global.Storage&&global.Storage.prototype;
    }catch(e){return;}
    if(!storage||!proto)return;

    const native={
      getItem:proto.getItem,
      setItem:proto.setItem,
      removeItem:proto.removeItem
    };
    const key=value=>storagePrefix+String(value);
    const isLocal=self=>self===storage;

    proto.getItem=function(name){
      return native.getItem.call(this,isLocal(this)?key(name):name);
    };
    proto.setItem=function(name,value){
      return native.setItem.call(this,isLocal(this)?key(name):name,value);
    };
    proto.removeItem=function(name){
      return native.removeItem.call(this,isLocal(this)?key(name):name);
    };
    global.__AIBA_STORAGE_SCOPE__=Object.freeze({prefix:storagePrefix});
  }

  function on(type,handler){
    if(typeof handler!=="function")throw new TypeError("AIBA.runtime.on requires a function");
    const pool=listeners[type]||(listeners[type]=new Set());
    pool.add(handler);
    return ()=>pool.delete(handler);
  }

  function emit(type,detail){
    const pool=listeners[type];
    if(!pool)return 0;
    let called=0;
    [...pool].forEach(handler=>{
      try{handler(detail);called++;}
      catch(error){setTimeout(()=>{throw error;},0);}
    });
    return called;
  }

  function register(name,service){
    if(!name)throw new TypeError("AIBA.runtime.register requires a name");
    if(Object.prototype.hasOwnProperty.call(services,name))throw new Error("AIBA runtime service already registered: "+name);
    services[name]=service;
    emit("service:registered",{name,service});
    return service;
  }

  function service(name){return services[name];}

  function attachLegacy(accessors){
    return register("legacy",Object.freeze(Object.assign({},accessors||{})));
  }

  scopeLocalStorage();
  if(global.document&&document.documentElement)document.documentElement.dataset.aibaEntry=experimental?"next":"legacy";

  const runtime=Object.freeze({
    version:1,
    entry:experimental?"next":"legacy",
    experimental,
    storagePrefix:experimental?storagePrefix:"",
    on,
    emit,
    register,
    service,
    attachLegacy,
    storage:Object.freeze({
      get:key=>localStorage.getItem(key),
      set:(key,value)=>localStorage.setItem(key,value),
      remove:key=>localStorage.removeItem(key)
    })
  });

  const root=global.AIBA&&typeof global.AIBA==="object"?global.AIBA:{};
  root.runtime=runtime;
  global.AIBA=root;
})(window);
