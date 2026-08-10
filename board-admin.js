(function(){
'use strict';

var ROOT_ID='board1';
var ADMIN_CODE='2222';

var STATIC={
  'static-2026-2028':{
    from_year:2026,
    to_year:2028,
    president:'Στέφανος Γκιουλτζόγλου',
    vice_president:'Μανουσάκιε Μπαλλχύσα Τσάκα',
    secretary:'Μαρία Ζάχου',
    treasurer:'Ταξιάρχης Πάζιος',
    member:'Ευαγγελία Ξανθοπούλου'
  },
  'static-2023-2026':{
    from_year:2023,
    to_year:2026,
    president:'Μαρία Κουτσοκώστα',
    vice_president:'Στέφανος Γκιουλτζόγλου',
    secretary:'Ειρήνη Νταλάρα',
    treasurer:'Γωγώ Παπαγεωργίου',
    member:'Ταξιάρχης Πάζιος'
  }
};

var firebaseConfig={
  apiKey:'AIzaSyCodx-CuHNysOVROtLcCuRtgxcB4oovPVc',
  authDomain:'syllogos-map.firebaseapp.com',
  projectId:'syllogos-map',
  storageBucket:'syllogos-map.firebasestorage.app',
  messagingSenderId:'399287687870',
  appId:'1:399287687870:web:5a1953623334e676af9cef'
};

function loadScript(src){
  return new Promise(function(resolve,reject){
    var existing=Array.prototype.slice.call(document.scripts).find(function(s){
      return s.src===src;
    });

    if(existing){
      if(existing.dataset.sepsygLoaded==='1'){
        resolve();
      }else{
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',reject,{once:true});
      }
      return;
    }

    var s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.onload=function(){
      s.dataset.sepsygLoaded='1';
      resolve();
    };
    s.onerror=reject;
    document.head.appendChild(s);
  });
}

function ensureFirebase(){
  var base='https://www.gstatic.com/firebasejs/10.12.2/';
  var chain=Promise.resolve();

  if(!window.firebase){
    chain=chain.then(function(){
      return loadScript(base+'firebase-app-compat.js');
    });
  }

  chain=chain.then(function(){
    if(!window.firebase.firestore){
      return loadScript(base+'firebase-firestore-compat.js');
    }
  });

  chain=chain.then(function(){
    if(!window.firebase.auth){
      return loadScript(base+'firebase-auth-compat.js');
    }
  });

  return chain;
}

function waitForRoot(){
  return new Promise(function(resolve){
    var root=document.getElementById(ROOT_ID);
    if(root){
      resolve(root);
      return;
    }

    var observer=new MutationObserver(function(){
      var found=document.getElementById(ROOT_ID);
      if(found){
        observer.disconnect();
        resolve(found);
      }
    });

    observer.observe(document.documentElement,{
      childList:true,
      subtree:true
    });
  });
}

function esc(value){
  return String(value||'').replace(/[&<>"]/g,function(ch){
    return {
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;'
    }[ch];
  });
}

waitForRoot().then(function(root){
  if(root.dataset.boardAdminReady==='1')return;
  root.dataset.boardAdminReady='1';

  var terms=document.getElementById('bt');
  var plus=document.getElementById('bp');
  var done=document.getElementById('bd');
  var modal=document.getElementById('bmo');
  var close=document.getElementById('bx');
  var form=document.getElementById('bfo');
  var key=document.getElementById('bk');
  var yearFrom=document.getElementById('byf');
  var yearTo=document.getElementById('byt');
  var president=document.getElementById('bpr');
  var vice=document.getElementById('bvi');
  var secretary=document.getElementById('bse');
  var treasurer=document.getElementById('btr');
  var member=document.getElementById('bme');
  var title=document.getElementById('bti');

  if(!terms||!plus||!modal||!form){
    console.error('SEPSYG board: required DOM elements were not found.');
    return;
  }

  var remote={};
  var db=null;
  var collection=null;

  function merged(){
    var result={};

    Object.keys(STATIC).forEach(function(id){
      result[id]=Object.assign({},STATIC[id]);
    });

    Object.keys(remote).forEach(function(id){
      result[id]=Object.assign({},result[id]||{},remote[id]);
    });

    return Object.keys(result)
      .map(function(id){
        var item=Object.assign({},result[id]);
        item._key=id;
        return item;
      })
      .sort(function(a,b){
        return Number(b.from_year)-Number(a.from_year);
      });
  }

  function role(label,value){
    return '<div class="role"><b>'+esc(label)+'</b><span>'+esc(value||'—')+'</span></div>';
  }

  function draw(){
    terms.innerHTML=merged().map(function(item){
      return ''+
        '<article class="term" data-k="'+esc(item._key)+'">'+
          '<button class="edit" type="button">Επεξεργασία</button>'+
          '<div class="yr">'+esc(item.from_year)+'–'+esc(item.to_year)+'</div>'+
          '<div class="roles">'+
            role('Πρόεδρος',item.president)+
            role('Αντιπρόεδρος',item.vice_president)+
            role('Γραμματέας',item.secretary)+
            role('Ταμίας',item.treasurer)+
            role('Μέλος',item.member)+
          '</div>'+
        '</article>';
    }).join('');
  }

  function openModal(item){
    key.value=item ? item._key : '';
    title.textContent=item ? 'Επεξεργασία θητείας' : 'Νέα θητεία';

    yearFrom.value=String(item ? item.from_year : 2026);
    yearTo.value=String(item ? item.to_year : 2028);
    president.value=item && item.president ? item.president : '';
    vice.value=item && item.vice_president ? item.vice_president : '';
    secretary.value=item && item.secretary ? item.secretary : '';
    treasurer.value=item && item.treasurer ? item.treasurer : '';
    member.value=item && item.member ? item.member : '';

    modal.classList.add('on');
    setTimeout(function(){
      president.focus();
    },40);
  }

  function closeModal(){
    modal.classList.remove('on');
    form.reset();
  }

  function initFirebase(){
    if(collection)return Promise.resolve(collection);

    return ensureFirebase().then(function(){
      var app;

      try{
        app=firebase.app('sepsyg-board-admin');
      }catch(e){
        app=firebase.initializeApp(firebaseConfig,'sepsyg-board-admin');
      }

      db=app.firestore();
      collection=db.collection('association_board');

      return app.auth().signInAnonymously().then(function(){
        return collection;
      });
    });
  }

  plus.addEventListener('click',function(){
    var code=window.prompt('Κωδικός διαχείρισης');

    if(code===null)return;

    if(code!==ADMIN_CODE){
      window.alert('Λανθασμένος κωδικός.');
      return;
    }

    root.classList.add('adm');
    openModal(null);
  });

  if(done){
    done.addEventListener('click',function(){
      root.classList.remove('adm');
    });
  }

  if(close){
    close.addEventListener('click',closeModal);
  }

  modal.addEventListener('click',function(event){
    if(event.target===modal)closeModal();
  });

  terms.addEventListener('click',function(event){
    var button=event.target.closest('.edit');

    if(!button)return;
    if(!root.classList.contains('adm'))return;

    var card=button.closest('.term');
    if(!card)return;

    var id=card.getAttribute('data-k');
    var item=merged().find(function(entry){
      return entry._key===id;
    });

    if(item)openModal(item);
  });

  form.addEventListener('submit',function(event){
    event.preventDefault();

    var from=Number(yearFrom.value);
    var to=Number(yearTo.value);

    if(to<from){
      window.alert('Το «Έως έτος» πρέπει να είναι ίσο ή μεγαλύτερο από το «Από έτος».');
      return;
    }

    var id=key.value||('custom-'+Date.now());

    var data={
      from_year:from,
      to_year:to,
      president:president.value.trim(),
      vice_president:vice.value.trim(),
      secretary:secretary.value.trim(),
      treasurer:treasurer.value.trim(),
      member:member.value.trim()
    };

    var saveButton=form.querySelector('.save');
    saveButton.disabled=true;
    saveButton.textContent='Αποθήκευση...';

    initFirebase()
      .then(function(col){
        return col.doc(id).set(data,{merge:true});
      })
      .then(function(){
        remote[id]=Object.assign({},data);
        draw();
        closeModal();
      })
      .catch(function(error){
        console.error('SEPSYG board save error:',error);
        window.alert(
          'Δεν αποθηκεύτηκε στη Firebase: '+
          (error.code||error.message||'άγνωστο σφάλμα')
        );
      })
      .finally(function(){
        saveButton.disabled=false;
        saveButton.textContent='Αποθήκευση';
      });
  });

  /* Το + λειτουργεί πριν από Firebase.
     Η Firebase φορτώνεται παράλληλα μόνο για συγχρονισμό/αποθήκευση. */
  initFirebase()
    .then(function(col){
      col.onSnapshot(function(snapshot){
        remote={};

        snapshot.forEach(function(doc){
          remote[doc.id]=doc.data()||{};
        });

        draw();
      });
    })
    .catch(function(error){
      console.warn('SEPSYG board Firebase unavailable:',error);
      /* Οι δύο στατικές θητείες παραμένουν ορατές. */
    });

}).catch(function(error){
  console.error('SEPSYG board loader error:',error);
});

})();