const $ = s => document.querySelector(s);
const st = { lat:null, lng:null, label:"", radius:25, sort:"mesafe", price:"gunluk", city:"" };
const km = (a,b,c,d)=>{const R=6371,r=x=>x*Math.PI/180,dl=r(c-a),dn=r(d-b);
  const h=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
const tl = n => n.toLocaleString("tr-TR")+" ₺";
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function locate(){
  const s=$("#status"); s.textContent="Konum alınıyor…";
  if(!navigator.geolocation){s.textContent="Tarayıcı konumu desteklemiyor, şehir seçin.";return;}
  navigator.geolocation.getCurrentPosition(p=>{
    st.lat=p.coords.latitude;st.lng=p.coords.longitude;st.label="Konumunuz";$("#city").value="";renderList();
  },()=>{s.textContent="Konum izni verilmedi. Lütfen şehir seçin.";},{enableHighAccuracy:false,timeout:10000});
}
function pickCity(c){
  if(!c){return;} const [la,ln]=CITIES[c]; st.lat=la;st.lng=ln;st.label=c+" merkezi";renderList();
}
function list(){
  if(st.lat==null) return [];
  return GYMS.map(x=>({...x,d:km(st.lat,st.lng,x.lat,x.lng)})).filter(x=>x.d<=st.radius)
    .sort((a,b)=> st.sort==="mesafe"?a.d-b.d : st.sort==="fiyat"?a[st.price]-b[st.price] : b.puan-a.puan);
}
function card(x){
  const k=x.kampanya[0];
  return `<a class="card" href="#/salon/${x.id}">
    <div class="row"><div><h3>${esc(x.ad)}</h3><div class="mut">${esc(x.adres)} · ★ ${x.puan} (${x.yorum})</div></div>
    <div class="dist">${x.d.toFixed(1)} km</div></div>
    <div class="tags">${x.etiket.map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>
    <div class="prices"><div class="price"><small>Günlük</small><b>${tl(x.gunluk)}</b></div>
    <div class="price"><small>Haftalık</small><b>${tl(x.haftalik)}</b></div></div>
    ${k?`<div class="camp">🔥 ${esc(k.t)}: ${esc(k.d)}</div>`:""}</a>`;
}
function renderList(){
  const r=list(); const s=$("#status");
  s.textContent = st.lat==null ? "Başlamak için konumunuzu paylaşın veya şehir seçin."
    : `${st.label} çevresinde ${st.radius} km içinde ${r.length} salon bulundu.`;
  $("#results").innerHTML = st.lat==null ? "" : r.length ? r.map(card).join("")
    : `<div class="empty">Bu menzilde salon yok. Menzili artırmayı deneyin.</div>`;
}
function home(){
  $("#app").innerHTML = `
  <section class="hero"><h1>Şehir dışındasın mı?<br>Yakındaki salonu bul.</h1>
  <p>Konumuna ve menzile göre sırala, günlük/haftalık fiyatları ve kampanyaları karşılaştır.</p></section>
  <div class="panel">
    <div><label>Konum</label><button class="btn" id="loc" style="width:100%">📍 Konumumu kullan</button></div>
    <div><label>veya şehir seç</label><select id="city"><option value="">Şehir seçin…</option>
      ${Object.keys(CITIES).map(c=>`<option ${c===st.city?"selected":""}>${c}</option>`).join("")}</select></div>
    <div><label>Menzil: <b id="rv">${st.radius}</b> km</label><input type="range" id="rad" min="1" max="500" value="${st.radius}"></div>
    <div><label>Sırala</label><select id="sort">
      <option value="mesafe">En yakın</option><option value="fiyat">En ucuz</option><option value="puan">En yüksek puan</option></select></div>
    <div><label>Fiyat türü (sıralama)</label><select id="pt"><option value="gunluk">Günlük</option><option value="haftalik">Haftalık</option></select></div>
  </div>
  <p class="status" id="status"></p><div class="grid" id="results"></div>`;
  $("#loc").onclick=locate;
  $("#city").onchange=e=>{st.city=e.target.value;pickCity(e.target.value)};
  $("#rad").oninput=e=>{st.radius=+e.target.value;$("#rv").textContent=st.radius;renderList()};
  $("#sort").value=st.sort;$("#sort").onchange=e=>{st.sort=e.target.value;renderList()};
  $("#pt").value=st.price;$("#pt").onchange=e=>{st.price=e.target.value;renderList()};
  renderList();
}
function detail(id){
  const x=GYMS.find(g=>g.id==id); if(!x){location.hash="";return;}
  const d = st.lat!=null ? km(st.lat,st.lng,x.lat,x.lng) : null;
  const t=x.teknik;
  $("#app").innerHTML = `<a class="back" href="#/">← Salonlara dön</a>
  <section class="hero"><h1>${esc(x.ad)}</h1>
  <p>${esc(x.adres)} · ★ ${x.puan} (${x.yorum} yorum) · ${esc(x.saat)}${d!=null?` · ${d.toFixed(1)} km uzakta`:""}</p></section>
  <p>${esc(x.ozet)}</p>
  <div class="tags">${x.etiket.map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>
  <h2>Fiyatlar</h2><div class="prices"><div class="price"><small>Günlük giriş</small><b>${tl(x.gunluk)}</b></div>
  <div class="price"><small>Haftalık giriş</small><b>${tl(x.haftalik)}</b></div></div>
  <h2>Kampanyalar</h2>
  ${x.kampanya.length?x.kampanya.map(k=>`<div class="campbox"><b>${esc(k.t)}</b><br>${esc(k.d)}<br>Kod: <span class="code">${esc(k.kod)}</span></div>`).join(""):`<p class="mut">Şu an aktif kampanya yok.</p>`}
  <h2>Teknik özellikler</h2>
  <div class="spec">${[["Alan",t.alan],["Kapasite",t.kapasite],["Havuz",t.havuz],["Duş / Dolap",t.duş],["Otopark",t.otopark],["Klima",t.klima]]
    .map(([a,b])=>`<div><small>${a}</small>${esc(b)}</div>`).join("")}</div>
  <h2>Ekipman</h2><ul class="eq">${t.ekipman.map(e=>`<li>${esc(e)}</li>`).join("")}</ul>
  <h2>Yol tarifi</h2><p><a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lng}">Haritada aç</a></p>`;
  scrollTo(0,0);
}
function route(){const m=location.hash.match(/^#\/salon\/(\d+)/); m?detail(m[1]):home();}
addEventListener("hashchange",route);route();
