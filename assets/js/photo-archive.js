(function () {
  var home = document.querySelector('.photo-home'); if (!home) return;
  var cards = Array.from(document.querySelectorAll('.photo-story'));
  var years = Array.from(document.querySelectorAll('[data-year-filter]'));
  var places = Array.from(document.querySelectorAll('[data-place-filter]'));
  var sections = Array.from(document.querySelectorAll('[data-year-section]'));
  var empty = document.querySelector('.photo-filter-empty'), status = document.querySelector('[data-filter-status]');
  var activeYear = 'All', activePlace = 'All';
  function setButtonState() {
    years.forEach(function (item) { var selected=item.dataset.yearFilter===activeYear; item.classList.toggle('active',selected); item.setAttribute('aria-current',selected?'true':'false'); });
  }
  function apply() {
    var visible=0;
    cards.forEach(function(card) { var okYear=activeYear==='All'||(card.dataset.years||'').split(/\s+/).indexOf(activeYear)>=0; var okPlace=activePlace==='All'||card.dataset.place===activePlace; card.hidden=!(okYear&&okPlace); if(!card.hidden)visible++; });
    sections.forEach(function(section) { section.hidden=Array.from(section.querySelectorAll('.photo-story')).every(function(card){return card.hidden;}); });
    setButtonState(); if(status) status.textContent=visible+' '+(visible===1?'story':'stories'); if(empty) empty.hidden=visible!==0;
    var selection=document.querySelector('.photo-active-selection'), label=document.querySelector('[data-place-label]');
    if(selection){selection.hidden=activePlace==='All'; if(label) label.textContent=activePlace;}
    var clear=document.querySelector('[data-filter-reset]'); if(clear) clear.hidden=activeYear==='All'&&activePlace==='All';
  }
  function chooseYear(year) { activeYear=year; history.replaceState(null,'',year==='All'?'#archive':'?year='+encodeURIComponent(year)+'#archive'); apply(); }
  years.forEach(function(item){item.addEventListener('click',function(event){event.preventDefault();chooseYear(item.dataset.yearFilter);});});
  places.forEach(function(item){item.addEventListener('click',function(event){if(item.dataset.placeFilter==='All')return; event.preventDefault(); activePlace=item.dataset.placeFilter; var name=item.dataset.placeName; var label=document.querySelector('[data-place-label]'); if(label&&name)label.textContent=name; history.replaceState(null,'','#archive'); apply(); document.querySelector('#archive').scrollIntoView({behavior:'smooth'});});});
  var reset=document.querySelector('[data-filter-reset]'), resetPlace=document.querySelector('[data-place-reset]'), emptyReset=document.querySelector('[data-empty-reset]');
  function resetAll(){activeYear='All';activePlace='All';history.replaceState(null,'','#archive');apply();}
  if(reset)reset.addEventListener('click',resetAll); if(resetPlace)resetPlace.addEventListener('click',resetAll); if(emptyReset)emptyReset.addEventListener('click',resetAll);
  var query=new URLSearchParams(location.search); if(query.get('year'))activeYear=query.get('year'); apply();
}());
