const state={all:[],filtered:[],page:1,perPage:40,chunkCache:new Map(),defaultOrder:new Map()};
const $=id=>document.getElementById(id);
const els={
  grid:$('grid'),status:$('status'),search:$('search'),sort:$('sort'),reset:$('reset'),
  count:$('count'),prev:$('prev'),next:$('next'),page:$('page'),modal:$('modal'),
  mainImage:$('mainImage'),thumbs:$('thumbs'),productTitle:$('productTitle'),
  productPrice:$('productPrice'),productSizes:$('productSizes'),productMeta:$('productMeta')
};

function esc(s){
  return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const img=entry.target;
    if(img.dataset.src&&!img.src){
      img.src=img.dataset.src;
      img.onload=()=>img.classList.add('loaded');
    }
    observer.unobserve(img);
  });
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
      <div class="pic"><img alt="${esc(item.title||'Товар')}" loading="lazy" data-src="${esc(item.first_image||'')}"></div>
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
    if(item.first_image)observer.observe(img);
  });

  const pages=Math.max(1,Math.ceil(state.filtered.length/state.perPage));
  els.page.textContent=`${state.page} / ${pages}`;
  els.prev.disabled=state.page<=1;
  els.next.disabled=state.page>=pages;
  els.count.textContent=`${state.filtered.length.toLocaleString('ru-RU')} товаров`;
}

function apply(){
  const q=els.search.value.trim().toLowerCase();
  state.filtered=state.all.filter(item=>
    `${item.title||''} ${item.id||''} ${item.sizes||''}`.toLowerCase().includes(q)
  );

  if(els.sort.value==='name'){
    state.filtered.sort((a,b)=>(a.title||'').localeCompare(b.title||'','ru'));
  }else if(els.sort.value==='photos'){
    state.filtered.sort((a,b)=>(b.image_count||0)-(a.image_count||0));
  }else{
    state.filtered.sort((a,b)=>(state.defaultOrder.get(a.id)||0)-(state.defaultOrder.get(b.id)||0));
  }
  state.page=1;
  render();
}

async function getChunk(chunkNo){
  if(state.chunkCache.has(chunkNo))return state.chunkCache.get(chunkNo);
  const filename=String(chunkNo).padStart(4,'0');
  const response=await fetch(`/data/chunks/${filename}.json`);
  if(!response.ok)throw new Error(`Не удалось загрузить товар: HTTP ${response.status}`);
  const data=await response.json();
  state.chunkCache.set(chunkNo,data);
  return data;
}

async function openProduct(meta){
  try{
    const chunk=await getChunk(meta.chunk);
    const p=chunk[meta.offset];
    if(!p)throw new Error('Товар не найден');

    const images=Array.isArray(p.images)?p.images:[];
    els.productTitle.textContent=p.title||'Товар';
    els.productPrice.textContent=p.price||'Цена по запросу';
    els.productSizes.textContent=p.sizes?`Размеры: ${p.sizes}`:'';
    els.productMeta.textContent=`${p.image_count||images.length||0} фото${p.goods_id?' · ID '+p.goods_id:''}`;
    els.thumbs.innerHTML='';
    els.mainImage.src=images[0]||'';
    els.mainImage.alt=p.title||'Товар';

    images.forEach((src,i)=>{
      const img=document.createElement('img');
      img.loading='lazy';
      img.src=src;
      img.alt=`${p.title||'Товар'} — фото ${i+1}`;
      if(i===0)img.classList.add('active');
      img.addEventListener('click',()=>{
        els.mainImage.src=src;
        els.thumbs.querySelectorAll('img').forEach(x=>x.classList.remove('active'));
        img.classList.add('active');
      });
      els.thumbs.appendChild(img);
    });

    els.modal.classList.remove('hidden');
    document.body.style.overflow='hidden';
  }catch(error){
    console.error(error);
    alert('Не удалось открыть товар. Попробуйте ещё раз.');
  }
}

function closeModal(){
  els.modal.classList.add('hidden');
  document.body.style.overflow='';
}

els.search.addEventListener('input',apply);
els.sort.addEventListener('change',apply);
els.reset.addEventListener('click',()=>{els.search.value='';els.sort.value='default';apply();});
els.prev.addEventListener('click',()=>{if(state.page>1){state.page--;render();scrollTo({top:0,behavior:'smooth'});}});
els.next.addEventListener('click',()=>{const pages=Math.ceil(state.filtered.length/state.perPage);if(state.page<pages){state.page++;render();scrollTo({top:0,behavior:'smooth'});}});
document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

(async()=>{
  try{
    const response=await fetch('/data/index.json');
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const index=await response.json();
    if(!Array.isArray(index))throw new Error('Неверный формат индекса');

    state.all=index;
    state.defaultOrder=new Map(index.map((item,i)=>[item.id,i]));
    state.filtered=[...index];
    els.status.textContent='';
    render();
  }catch(error){
    console.error(error);
    els.status.textContent='Каталог обновляется. Попробуйте обновить страницу через минуту.';
    els.count.textContent='0 товаров';
  }
})();
