
const state={all:[],filtered:[],page:1,perPage:40,chunkCache:new Map()};
const $=id=>document.getElementById(id);
const els={grid:$('grid'),status:$('status'),search:$('search'),sort:$('sort'),reset:$('reset'),count:$('count'),prev:$('prev'),next:$('next'),page:$('page'),modal:$('modal'),mainImage:$('mainImage'),thumbs:$('thumbs'),productTitle:$('productTitle'),productPrice:$('productPrice'),productSizes:$('productSizes'),productMeta:$('productMeta'),sourceLink:$('sourceLink')};

function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const img=e.target;
      if(img.dataset.src&&!img.src){
        img.src=img.dataset.src;
        img.onload=()=>img.classList.add('loaded');
      }
      observer.unobserve(img);
    }
  })
},{rootMargin:'350px'});

function render(){
  const start=(state.page-1)*state.perPage;
  const items=state.filtered.slice(start,start+state.perPage);
  els.grid.innerHTML='';
  els.status.textContent=items.length?'':'Ничего не найдено';

  items.forEach(item=>{
    const card=document.createElement('article');
    card.className='card';
    card.innerHTML=`
      <div class="pic">
        <img alt="" loading="lazy" data-src="${esc(item.first_image)}">
      </div>
      <div class="card-body">
        <h3 class="card-title">${esc(item.title||'Товар')}</h3>
        <div class="card-row">
          <span>${item.price?esc(item.price):'Цена по запросу'}</span>
          <span>${item.image_count||0} фото</span>
        </div>
      </div>`;
    card.addEventListener('click',()=>openProduct(item));
    els.grid.appendChild(card);
    const img=card.querySelector('img');
    if(item.first_image) observer.observe(img);
  });

  const pages=Math.max(1,Math.ceil(state.filtered.length/state.perPage));
  els.page.textContent=`${state.page} / ${pages}`;
  els.prev.disabled=state.page<=1;
  els.next.disabled=state.page>=pages;
  els.count.textContent=`${state.filtered.length.toLocaleString('ru-RU')} товаров`;
}

function apply(){
  const q=els.search.value.trim().toLowerCase();
  state.filtered=state.all.filter(x=>{
    const hay=`${x.title||''} ${x.id||''} ${x.sizes||''}`.toLowerCase();
    return hay.includes(q);
  });
  if(els.sort.value==='name') state.filtered.sort((a,b)=>(a.title||'').localeCompare(b.title||''));
  else if(els.sort.value==='photos') state.filtered.sort((a,b)=>(b.image_count||0)-(a.image_count||0));
  else state.filtered.sort((a,b)=>state.all.indexOf(a)-state.all.indexOf(b));
  state.page=1; render();
}

async function getChunk(no){
  if(state.chunkCache.has(no)) return state.chunkCache.get(no);
  const r=await fetch(`/data/chunks/${String(no).padStart(4,'0')}.json`);
  if(!r.ok) throw new Error('Не удалось загрузить товар');
  const data=await r.json();
  state.chunkCache.set(no,data);
  return data;
}

async function openProduct(meta){
  try{
    const chunk=await getChunk(meta.chunk);
    const p=chunk[meta.offset];
    const images=p.images||[];
    els.productTitle.textContent=p.title||'Товар';
    els.productPrice.textContent=p.price||'Цена по запросу';
    els.productSizes.textContent=p.sizes?`Размеры: ${p.sizes}`:'';
    els.productMeta.textContent=`${p.image_count||images.length||0} фото${p.goods_id?' · ID '+p.goods_id:''}`;
    els.sourceLink.href=p.url||'#';

    els.thumbs.innerHTML='';
    els.mainImage.src=images[0]||'';
    images.forEach((src,i)=>{
      const img=document.createElement('img');
      img.loading='lazy';
      img.src=src;
      if(i===0) img.classList.add('active');
      img.onclick=()=>{
        els.mainImage.src=src;
        els.thumbs.querySelectorAll('img').forEach(x=>x.classList.remove('active'));
        img.classList.add('active');
      };
      els.thumbs.appendChild(img);
    });

    els.modal.classList.remove('hidden');
    document.body.style.overflow='hidden';
  }catch(e){alert(e.message)}
}
function closeModal(){els.modal.classList.add('hidden');document.body.style.overflow=''}

els.search.addEventListener('input',apply);
els.sort.addEventListener('change',apply);
els.reset.onclick=()=>{els.search.value='';els.sort.value='default';apply()};
els.prev.onclick=()=>{if(state.page>1){state.page--;render();scrollTo({top:0,behavior:'smooth'})}};
els.next.onclick=()=>{const pages=Math.ceil(state.filtered.length/state.perPage);if(state.page<pages){state.page++;render();scrollTo({top:0,behavior:'smooth'})}};
document.querySelectorAll('[data-close]').forEach(x=>x.onclick=closeModal);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

(async()=>{
  try{
    const r=await fetch('/data/index.json');
    if(!r.ok) throw new Error('index.json не найден');
    state.all=await r.json();
    state.filtered=[...state.all];
    els.status.textContent='';
    render();
  }catch(e){
    els.status.innerHTML=`Ошибка загрузки каталога: ${esc(e.message)}`;
  }
})();
