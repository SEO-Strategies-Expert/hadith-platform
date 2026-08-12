
(function(){
  'use strict';
  document.querySelectorAll('[data-filter-group]').forEach(function(group){
    var target = document.querySelector(group.getAttribute('data-filter-target'));
    if(!target) return;
    var items = Array.prototype.slice.call(target.querySelectorAll('[data-category]'));
    group.querySelectorAll('[data-filter]').forEach(function(btn){
      btn.addEventListener('click', function(){
        group.querySelectorAll('[data-filter]').forEach(function(b){b.setAttribute('aria-pressed','false')});
        btn.setAttribute('aria-pressed','true');
        var key = btn.getAttribute('data-filter');
        items.forEach(function(item){item.hidden = key !== 'all' && item.getAttribute('data-category') !== key});
      });
    });
  });
  document.querySelectorAll('[data-search-list]').forEach(function(input){
    var target = document.querySelector(input.getAttribute('data-search-list'));
    if(!target) return;
    var items = Array.prototype.slice.call(target.querySelectorAll('[data-search-text]'));
    input.addEventListener('input', function(){
      var q = input.value.trim().toLowerCase();
      items.forEach(function(item){
        var hay = ((item.getAttribute('data-search-text') || '') + ' ' + (item.textContent || '')).toLowerCase();
        item.hidden = q && hay.indexOf(q) === -1;
      });
    });
  });
  document.querySelectorAll('form[data-demo-form]').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var msg = form.querySelector('[data-form-message]');
      if(msg){msg.hidden=false;msg.focus();}
    });
  });
})();
