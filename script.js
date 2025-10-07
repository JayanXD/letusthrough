/* Shared JavaScript for Leaf it Up! pages
   - simple "mock" login storing username in localStorage
   - save plants to localStorage (array of objects)
   - render plant list and simple leaderboard
   - used by all pages
*/

(function () {
  // Helpers
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  // read user from localStorage
  function getUser() {
    const raw = localStorage.getItem('leaf_user');
    if (!raw) return { name: 'Guest', points: 0 };
    try { return JSON.parse(raw); } catch { return { name: 'Guest', points: 0 }; }
  }
  function saveUser(user) { localStorage.setItem('leaf_user', JSON.stringify(user)); }

  // Plants storage
  function getPlants() {
    const p = localStorage.getItem('leaf_plants');
    return p ? JSON.parse(p) : [];
  }
  function savePlants(plants) { localStorage.setItem('leaf_plants', JSON.stringify(plants)); }

  // Initialize display of user info on many pages
  function initUserDisplays() {
    const u = getUser();
    $all('#user-name,#user-name-2,#user-name-3,#user-name-4,#user-name-5,#user-name-6,#hero-user').forEach(el=>{
      if(el) el.textContent = u.name;
    });
    $all('#user-points,#user-points-2,#user-points-3,#user-points-4,#user-points-5,#user-points-6').forEach(el=>{
      if(el) el.textContent = (u.points||0) + ' 🍃';
    });
  }

  // PLANTS PAGE: Save plant
  function initMyPlantsPage() {
    if (!$('#save-plant')) return;
    const inputImg = $('#plant-image-input');
    const preview = $('#plant-img');
    let currentImageData = preview.src;

    // preview local file
    inputImg.addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = function(ev){
        preview.src = ev.target.result;
        currentImageData = ev.target.result;
      };
      reader.readAsDataURL(f);
    });

    function renderPlants() {
      const plants = getPlants();
      const list = $('#plants-list');
      list.innerHTML = '';
      if (!plants.length) {
        list.innerHTML = '<p class="muted">No plants logged yet.</p>';
        return;
      }
      plants.forEach((pl, idx) => {
        const div = document.createElement('div');
        div.className = 'plant-card';
        div.innerHTML = `
          <img src="${pl.image || 'https://via.placeholder.com/160x120?text=Plant'}" alt="">
          <div style="flex:1">
            <div style="font-weight:700">${pl.name}</div>
            <div style="color:#666">${pl.type} • ${pl.week}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn small" data-idx="${idx}" data-action="edit">Edit</button>
            <button class="btn small ghost" data-idx="${idx}" data-action="del">Delete</button>
          </div>
        `;
        list.appendChild(div);
      });
      // attach handlers
      list.querySelectorAll('button').forEach(b=>{
        b.addEventListener('click', (ev)=>{
          const idx = parseInt(b.dataset.idx,10);
          const action = b.dataset.action;
          const plants = getPlants();
          if (action==='del') {
            if (confirm('Delete this plant?')) {
              plants.splice(idx,1);
              savePlants(plants);
              renderPlants();
            }
          } else {
            // fill form with plant for editing (simple)
            const p = plants[idx];
            $('#plant-type').value = p.type;
            $('#plant-name').value = p.name;
            $('#plant-week').value = p.week;
            $('#plant-img').src = p.image || 'https://via.placeholder.com/160x120?text=Plant';
            alert('Edit values then click UPDATE to apply changes. (This demo updates the last saved plant index.)');
            // store edit index in DOM
            $('#save-plant').dataset.editIdx = idx;
          }
        });
      });
    }

    $('#save-plant').addEventListener('click', ()=>{
      const plants = getPlants();
      const newPlant = {
        type: $('#plant-type').value,
        name: $('#plant-name').value || 'Unnamed',
        week: $('#plant-week').value,
        image: currentImageData
      };
      // if edit mode available?
      const editIdx = $('#save-plant').dataset.editIdx;
      if (editIdx !== undefined) {
        // apply update
        plants[editIdx] = newPlant;
        delete $('#save-plant').dataset.editIdx;
      } else {
        plants.push(newPlant);
      }
      savePlants(plants);
      renderPlants();
      // reward small points
      const user = getUser();
      user.points = (user.points || 0) + 5;
      saveUser(user);
      initUserDisplays();
      alert('Plant saved! +5 points');
    });

    $('#update-plant').addEventListener('click', ()=>{
      const plants = getPlants();
      const editIdx = $('#save-plant').dataset.editIdx;
      if (editIdx === undefined) { alert('No plant selected for update — click Edit on a plant first.'); return; }
      plants[editIdx] = {
        type: $('#plant-type').value,
        name: $('#plant-name').value,
        week: $('#plant-week').value,
        image: $('#plant-img').src
      };
      savePlants(plants);
      delete $('#save-plant').dataset.editIdx;
      renderPlants();
      alert('Plant updated.');
    });

    renderPlants();
  }

  // LOGIN PAGE
  function initLoginPage() {
    if (!$('#login-btn') && !$('#admin-login-btn')) return;
    const loginBtn = $('#login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', ()=>{
        const email = $('#login-email').value.trim();
        if (!email) { alert('Enter email'); return; }
        const username = email.split('@')[0].replace(/[^a-z0-9]/gi,'');
        const user = { name: username.charAt(0).toUpperCase()+username.slice(1), points: 150 };
        saveUser(user);
        initUserDisplays();
        alert('Logged in as ' + user.name);
        location.href = 'index.html';
      });
    }

    const adminBtn = $('#admin-login-btn');
    if (adminBtn) {
      adminBtn.addEventListener('click', ()=>{
        const email = $('#admin-email').value.trim();
        if (!email) { alert('Enter admin email'); return; }
        alert('Admin login (mock) — redirected to index.');
        location.href = 'index.html';
      });
    }

    const chgSave = $('#chg-save');
    if (chgSave) {
      chgSave.addEventListener('click', ()=>{
        alert('Password change simulated. (This is a front-end demo.)');
        location.href = 'index.html';
      });
    }
  }

  // LEADERBOARD: produce a sample ranking using user points and top plant counts
  function initLeaderboard() {
    const rankList = $('#rank-list');
    if (!rankList) return;
    // build sample data: current user + some random users
    const myUser = getUser();
    const sample = [
      {name: 'Aldo', points: 220},
      {name: 'Bea', points: 185},
      {name: 'Ciri', points: 170},
      {name: myUser.name, points: myUser.points || 0},
      {name: 'Dana', points: 120},
      {name: 'Eli', points: 110},
      {name: 'Fay', points: 100},
      {name: 'Gio', points: 90},
      {name: 'Hana', points: 80},
      {name: 'Ivy', points: 70},
    ];
    // sort by points desc
    sample.sort((a,b)=>b.points-a.points);
    rankList.innerHTML = '';
    sample.forEach((p, idx)=>{
      const li = document.createElement('li');
      li.textContent = `${idx+1} — ${p.name} (${p.points}🍃)`;
      rankList.appendChild(li);
    });
  }

  // attach active link highlight based on current URL
  function highlightNav() {
    $all('.nav-item').forEach(a=>{
      try {
        const href = a.getAttribute('href').split('/').pop();
        const current = location.pathname.split('/').pop() || 'index.html';
        if (href === current) {
          a.classList.add('active');
        } else a.classList.remove('active');
      } catch(e){}
    });
  }

  // init all
  function init() {
    highlightNav();
    initUserDisplays();
    initMyPlantsPage();
    initLoginPage();
    initLeaderboard();
    // Fill community plants stat (simple)
    const comm = $('#community-plants');
    if (comm) comm.textContent = (getPlants().length * 10 + 1500);
    // Render plants list on index if present (simple small list)
    const mini = $('#plants-mini');
    if (mini) {
      const plants = getPlants();
      mini.innerHTML = plants.slice(0,3).map(p=>`<div>${p.name} (${p.week})</div>`).join('');
    }
  }

  // run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();

})();
