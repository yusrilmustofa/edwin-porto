const $=s=>document.querySelector(s), menu=$('#menu'), burger=$('#burger');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=(id,v)=>{$(id).textContent=v??''};
const tone=i=>i%2?'sky':'emerald';
let mail='';

// Isi halaman dari content.json (teks diedit di sana / lewat /admin)
function render(c){
  const {hero:h,about:a,skills:s,projects:p,experience:x,contact:k}=c;
  document.title=`${c.name} — ${h.highlight}`;
  txt('#nav-name',c.name);
  txt('#hero-greeting',h.greeting); txt('#hero-headline',h.headline); txt('#hero-highlight',h.highlight);
  txt('#hero-desc',h.description); txt('#cta-portfolio',h.cta_portfolio); txt('#cta-contact',h.cta_contact);
  $('#hero-photo').innerHTML=h.photo
    ?`<img src="${esc(h.photo)}" alt="Foto ${esc(c.name)}" class="w-64 h-64 sm:w-80 sm:h-80 rounded-full object-cover shadow-xl">`
    :`<div class="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-emerald-300 to-sky-400 flex items-center justify-center shadow-xl" role="img" aria-label="Placeholder foto ${esc(c.name)}"><span class="text-7xl font-extrabold text-white">${esc(c.name[0])}</span></div>`;

  txt('#about-title',a.title); txt('#about-intro',a.intro);
  $('#about-items').innerHTML=a.items.map((i,n)=>`<div class="p-5 rounded-xl bg-${tone(n)}-50 border border-${tone(n)}-100"><h3 class="font-semibold text-${tone(n)}-800">${esc(i.title)}</h3><p class="text-sm mt-1">${esc(i.text)}</p></div>`).join('');

  txt('#skills-title',s.title);
  const chips=(l,t)=>l.map(v=>`<li class="px-3 py-1 rounded-full bg-${t}-100 text-${t}-800">${esc(v)}</li>`).join('');
  $('#skills-hard').innerHTML=chips(s.hard,'emerald'); $('#skills-soft').innerHTML=chips(s.soft,'sky');

  txt('#proj-title',p.title); txt('#proj-note',p.note); $('#proj-note').hidden=!p.note;
  const slides=(im,t)=>im&&im.length?`<div class="slider relative -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-2xl"><div class="track flex overflow-x-auto snap-x snap-mandatory">${im.map(s=>`<img src="${esc(s)}" alt="${esc(t)}" loading="lazy" class="w-full shrink-0 snap-center aspect-video object-cover">`).join('')}</div>${im.length>1?`<button type="button" class="prev absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60" aria-label="Sebelumnya">‹</button><button type="button" class="next absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white hover:bg-black/60" aria-label="Berikutnya">›</button><div class="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">${im.map(()=>'<span class="dot w-2 h-2 rounded-full cursor-pointer"></span>').join('')}</div>`:''}</div>`:'';
  $('#proj-items').innerHTML=p.items.map((i,n)=>`<article class="p-6 rounded-2xl border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition">${slides(i.images,i.title)}<span class="text-xs font-semibold uppercase text-${tone(n)}-600">${esc(i.tag)}</span><h3 class="mt-1 text-xl font-bold text-slate-900">${esc(i.title)}</h3><p class="mt-2 text-sm">${esc(i.description)}</p><p class="mt-3 text-sm"><strong>Peran:</strong> ${esc(i.role)}</p><p class="mt-1 text-sm"><strong>Dampak:</strong> ${esc(i.impact)}</p></article>`).join('');

  txt('#exp-title',x.title);
  $('#exp-items').innerHTML=x.items.map((i,n)=>`<li class="relative"><span class="absolute -left-[33px] top-1 w-4 h-4 rounded-full ${n?'bg-sky-500':'bg-emerald-500'} ring-4 ring-white"></span><p class="text-sm text-slate-500">${esc(i.period)}</p><h3 class="font-bold text-slate-900">${esc(i.title)}</h3><p class="text-sm">${esc(i.desc)}</p></li>`).join('');

  mail=k.email; txt('#contact-title',k.title); txt('#contact-intro',k.intro);
  const link=(href,icon,label,t,ext)=>href?`<a href="${esc(href)}" ${ext?'target="_blank" rel="noopener"':''} class="flex items-center gap-3 p-4 rounded-xl bg-${t}-50 hover:bg-${t}-100">${icon} <span>${esc(label)}</span></a>`:'';
  const short=u=>u.replace(/^https?:\/\/(www\.)?/,'');
  $('#contact-links').innerHTML=link(k.email&&'mailto:'+k.email,'✉️',k.email,'emerald')+link(k.linkedin,'💼',short(k.linkedin||''),'sky',1)+link(k.instagram,'📷',short(k.instagram||''),'sky',1);
  txt('#footer',c.footer);
}

// Scroll reveal: tiap section dipecah jadi elemen kecil yang masuk bergantian
// (judul naik, kartu zoom/geser kiri-kanan, timeline geser kiri) lalu animasi dilepas agar hover normal.
function animate(){
  const els=[];
  const add=(el,i,anim)=>{el.classList.add('reveal');anim&&(el.dataset.anim=anim);el.style.transitionDelay=i*120+'ms';els.push(el)};
  document.querySelectorAll('section:not(#home) .reveal').forEach(box=>{
    box.classList.remove('reveal');
    [...box.children].forEach((c,i)=>{
      if(c.matches('.grid,ol,ul')){
        const kids=[...c.children];
        kids.forEach((k,j)=>add(k,j,c.matches('ol')?'left':kids.length<=2?(j?'right':'left'):'zoom'));
      }else add(c,i);
    });
  });
  document.querySelectorAll('#home .reveal').forEach((el,i)=>{el.style.transitionDelay=i*200+'ms';els.push(el)});
  const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){
    const t=x.target;t.classList.add('show');io.unobserve(t);
    setTimeout(()=>{t.classList.remove('reveal','show');t.style.transitionDelay=''},1500); // lepas agar hover card tidak terganggu
  }}),{threshold:.15});
  els.forEach(el=>io.observe(el));
}

// Slideshow gambar proyek: geser/panah/titik + otomatis tiap 5 detik (berhenti saat kursor di atasnya)
function sliders(){
  document.querySelectorAll('.slider').forEach(s=>{
    const t=s.querySelector('.track'), n=t.children.length, dots=[...s.querySelectorAll('.dot')];
    if(n<2)return;
    const cur=()=>Math.round(t.scrollLeft/t.clientWidth);
    const go=i=>t.scrollTo({left:((i%n+n)%n)*t.clientWidth,behavior:'smooth'});
    t.onscroll=()=>dots.forEach((d,i)=>d.classList.toggle('on',i===cur()));
    s.querySelector('.prev').onclick=()=>go(cur()-1);
    s.querySelector('.next').onclick=()=>go(cur()+1);
    dots.forEach((d,i)=>d.onclick=()=>go(i));
    t.onscroll();
    if(!matchMedia('(prefers-reduced-motion:reduce)').matches){
      let hold=0; s.onmouseenter=()=>hold=1; s.onmouseleave=()=>hold=0;
      setInterval(()=>hold||go(cur()+1),5000);
    }
  });
}

fetch('content.json').then(r=>r.json()).then(c=>{render(c);sliders();animate()}).catch(err=>{
  console.error(err);
  document.body.insertAdjacentHTML('afterbegin','<p style="padding:5rem 1rem 0;text-align:center">Konten gagal dimuat. Buka lewat Live Server atau hosting (bukan klik dua kali file).</p>');
});

// Menu hamburger
burger.onclick=()=>burger.setAttribute('aria-expanded',menu.classList.toggle('hidden')?'false':'true');
menu.onclick=e=>{if(e.target.closest('a'))menu.classList.add('hidden'),burger.setAttribute('aria-expanded','false')};

// Footer tahun
$('#yr').textContent=new Date().getFullYear();

// Progress bar scroll
const bar=$('#progress');
addEventListener('scroll',()=>{bar.style.transform=`scaleX(${scrollY/(document.documentElement.scrollHeight-innerHeight)})`},{passive:true});

// Highlight menu sesuai section yang sedang dilihat
const links=[...document.querySelectorAll('#menu a:not(.rounded-full)')];
const spy=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting)links.forEach(a=>{
  const on=a.getAttribute('href')==='#'+x.target.id;a.classList.toggle('text-emerald-600',on);a.classList.toggle('font-bold',on)})}),{rootMargin:'-45% 0px -50% 0px'});
document.querySelectorAll('main section[id]').forEach(s=>spy.observe(s));

// Form -> mail client (tanpa backend). Alamat tujuan dari content.json.
$('#form').onsubmit=e=>{e.preventDefault();
  const b=`Nama: ${$('#n').value}\nEmail: ${$('#e').value}\n\n${$('#m').value}`;
  location.href=`mailto:${mail}?subject=${encodeURIComponent('Pesan dari portofolio: '+$('#n').value)}&body=${encodeURIComponent(b)}`;};
