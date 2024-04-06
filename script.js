document.querySelectorAll(".toggle").forEach(el => {
  el.addEventListener('click', e => {
    el.classList.toggle("checked");
    redraw_times();
  });
});

level_select.addEventListener("input", e=>{
  redraw_times();
})

//{"li": 0, "lv": 0, "v": 1, "t": 4.98889, "m": 0, "d": 638479416912928644, "p": 2, "pn": "art0007i", "r": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
// li -- level id
// lv -- level version
// v -- game version
// t -- time
// m -- modifiers (flags: AllGround, InfAir, NoCD)
// d -- datetime
// p -- platform (0 = unk, 1 = desktop, 2 = vr)
// pn -- player name
// r -- replay link

var data = [];

fetch("times.json").then(resp=>{
  resp.json().then(json => {
    data = json.sort((a, b) => a.t - b.t);
    
    redraw_times();
  });
});

function get(el) {
  return el.classList.contains("checked");
} 

function ordinal_suffix_of(i) {
  let j = i % 10,
      k = i % 100;
  if (j === 1 && k !== 11) {
      return i + "st";
  }
  if (j === 2 && k !== 12) {
      return i + "nd";
  }
  if (j === 3 && k !== 13) {
      return i + "rd";
  }
  return i + "th";
}

function insert_img(element, source, alt) {
  var img = document.createElement("img");
  img.src = source;
  if(alt) {
    img.alt = alt;
    img.title = alt;
  }
  element.appendChild(img);
}

const msInMinute = 1000 * 60;
const msInHour = msInMinute * 60;
const msInDay = msInHour * 24;

function redraw_times() {
  var noRestrictions = get(nsr);
  var infAir = get(iaa);
  var noCooldowns = get(ncd);
  var showPC = get(pc);
  var showVR = get(vr);
  var level = parseInt(level_select.value);

  const rtf1 = new Intl.RelativeTimeFormat('en', { style: 'short' });
  const timeFormatter = { minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 };
  const utcNow = new Date();

  let idx = 1;

  times_root.innerHTML = "";

  for(let i = 0; i < data.length; i++) {
    const time = data[i];
    if(time.li != level) continue;
    
    const t_noRestrictions = (time.m & 1) != 0;
    const t_infAir = (time.m & 2) != 0;
    const t_noCooldowns = (time.m & 4) != 0;

    if(!(!t_noRestrictions || noRestrictions)) continue;
    if(!(!t_infAir || infAir)) continue;
    if(!(!t_noCooldowns || noCooldowns)) continue;

    if(time.p == 1 && !showPC) continue;
    if(time.p == 2 && !showVR) continue;

    // 621355968000000000 is unix epoch in ticks from c# epoch (0001, 01, 01)
    var dateTimeMS = (time.d-621355968000000000) / 10_000; // c# "ticks" into ms converter [working 2024]
    var dateTime = new Date(dateTimeMS);
    var relativeMS = utcNow - dateTime;

    var timeString = "never";
    var totalDays = relativeMS / msInDay;
    var totalHours = relativeMS / msInHour;
    var totalMinutes = relativeMS / msInMinute;
    var totalSeconds = relativeMS / 1000;
    if(totalDays >= 1) 
      timeString = rtf1.format(-Math.floor(totalDays), "day")
    else if(totalHours >= 1) 
      timeString = rtf1.format(-Math.floor(totalHours), "hour")
    else if(totalMinutes >= 1) 
      timeString = rtf1.format(-Math.floor(totalMinutes), "minute")
    else if(totalSeconds >= 1) 
      timeString = rtf1.format(-Math.floor(totalSeconds), "second")

    const clone = user_row.content.cloneNode(true);
    let td = clone.querySelectorAll("td");
    var nameHolder = td[1].querySelector(".username");
    td[0].textContent = ordinal_suffix_of(idx);
    nameHolder.textContent = time.pn;
    td[2].textContent = new Date(time.t*1000).toLocaleDateString('en-US', timeFormatter).substring("1/1/1970 ,".length);
    td[3].textContent = timeString;
    
    // This code is bad if extra platforms are added, but why would there be
    if(time.p == 1) insert_img(nameHolder, "images/IconPC.svg");
    else if (time.p == 2)  insert_img(nameHolder, "images/IconVR.svg");
    
    if(t_noRestrictions) insert_img(td[4], "images/NoStructureRestrictions.svg", "No structure restrictions");
    if(t_infAir) insert_img(td[4], "images/InfiniteAirActions.svg", "Infinite air actions");
    if(t_noCooldowns) insert_img(td[4], "images/NoCooldowns.svg", "No cooldowns");

    if(time.r) {
      const replayClone = replay_button.content.cloneNode(true);
      replayClone.querySelector("a").href = time.r;

      td[1].appendChild(replayClone);
    }

    times_root.appendChild(clone);

    idx++; // this is used to display 1st 2nd 3rd
  }
}