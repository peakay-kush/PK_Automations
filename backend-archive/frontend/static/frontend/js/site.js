(function(){
  function getCart(){
    try{ return JSON.parse(localStorage.getItem('cart') || '[]'); }catch(e){ return []; }
  }

  function setCart(c){
    localStorage.setItem('cart', JSON.stringify(c));
    window.dispatchEvent(new Event('cartUpdated'));
  }

  function updateCartCount(){
    const el = document.querySelector('.cart-count');
    if(!el) return;
    const c = getCart();
    el.textContent = String(c.length);
  }

  function addToCartFromButton(btn){
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const price = btn.dataset.price;
    const image = btn.dataset.image;
    const cart = getCart();
    cart.push({ id, name, price, image });
    setCart(cart);
    alert('Added to cart!');
  }

  function setupAddToCart(){
    document.querySelectorAll('.add-to-cart').forEach((b)=>{
      b.addEventListener('click', (e)=>{ e.preventDefault(); addToCartFromButton(b); });
    });
  }

  function renderCartPage(){
    const container = document.getElementById('cart-items');
    if(!container) return;
    const items = getCart();
    if(items.length===0){ container.innerHTML = '<p>Your cart is empty.</p>'; return; }
    const list = document.createElement('div');
    items.forEach((it, idx)=>{
      const row = document.createElement('div');
      row.className = 'cart-row p-2 border-b';
      row.innerHTML = `<div style="display:flex;gap:10px;align-items:center"><img src="${it.image}" alt="${it.name}" style="width:80px;height:80px;object-fit:cover"/><div><h3>${it.name}</h3><p>${it.price}</p><button class="remove-item" data-index="${idx}">Remove</button></div></div>`;
      list.appendChild(row);
    });
    container.innerHTML = '';
    container.appendChild(list);

    container.querySelectorAll('.remove-item').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const idx = Number(btn.dataset.index);
        const items = getCart();
        items.splice(idx,1);
        setCart(items);
        renderCartPage();
      });
    });

    const clearBtn = document.getElementById('clear-cart');
    if(clearBtn){
      clearBtn.addEventListener('click', ()=>{ setCart([]); renderCartPage(); });
    }
  }

  function initDarkMode(){
    const btn = document.getElementById('dark-toggle');
    if(!btn) return;
    const saved = localStorage.getItem('theme');
    if(saved==='dark') document.documentElement.classList.add('dark');
    btn.addEventListener('click', ()=>{
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    updateCartCount();
    setupAddToCart();
    initDarkMode();
    renderCartPage();

    const logoutForm = document.getElementById('logout-form');
    if(logoutForm){
      logoutForm.addEventListener('submit', ()=>{ 
        try{ localStorage.removeItem('pkat_token'); }catch(e){}
      });
    }
  });

  window.addEventListener('cartUpdated', ()=>{ updateCartCount(); });
})();
