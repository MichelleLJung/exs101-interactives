const $=id=>document.getElementById(id), status=$('status'), form=$('lab')
const choices=['Close','More bent','Less bent'], guesses=['Lighter','Same','Heavier']
const select=(id,label,opts)=>`<div><label for="${id}">${label}</label><select id="${id}"><option value="">Choose</option>${opts.map(x=>`<option>${x}</option>`).join('')}</select></div>`
const input=(id,label)=>`<div><label for="${id}">${label}</label><input id="${id}" maxlength="500"></div>`
$('positionTrials').innerHTML=[1,2].map(i=>`<fieldset><legend>Position ${i}</legend><div class="grid">${input('pTarget'+i,'Target description')}${select('pOpen'+i,'With vision',choices)}${select('pClosed'+i,'Without vision',choices)}</div></fieldset>`).join('')
$('loadTrials').innerHTML=[1,2].map(i=>`<fieldset><legend>Trial ${i}</legend><div class="grid">${select('lHand'+i,'Reference hand',['Left','Right'])}${input('lRef'+i,'Reference load')}${select('lGuess'+i,'Comparison vs reference',guesses)}${input('lActual'+i,'Revealed load')}</div></fieldset>`).join('')
const tactileFields = [
 ['touchLocation1','First body location'],['touchDetail1','What you noticed there'],
 ['touchLocation2','Second body location'],['touchDetail2','What you noticed there'],
 ['touchGuessBefore','Guess before hand exploration (or unsure)'],
 ['touchHandDetails','Additional details noticed with your hands'],
 ['touchGuessAfter','Final guess before reveal (or unsure)'],['touchObject','Revealed object']
]
$('touchTrials').innerHTML=tactileFields.map(([id,label])=>input(id,label)).join('')
const stationTrials={motion:{title:'Movement-direction detection',columns:['Actual direction','Reported direction'],count:2}}
for(const [id,cfg] of Object.entries(stationTrials)){
 $(id+'Trials').innerHTML=Array.from({length:cfg.count},(_,i)=>`<fieldset><legend>Trial ${i+1}</legend><div class="grid">${cfg.columns.map((col,j)=>select(id+i+'_'+j,col,j===0?['Bending','Straightening']:['Bending','Straightening','Unsure'])).join('')}</div></fieldset>`).join('')
}
const receptors=[
 ['spindle','Muscle spindles'],['gto','Golgi tendon organs'],['joint','Joint receptors'],['skin','Skin mechanoreceptors']
]
$('prepReceptors').innerHTML=receptors.map(([id,title])=>`<label for="${id}">${title}</label><textarea id="${id}" maxlength="3000"></textarea>`).join('')
for (const step of ['position','load','touch','motion']) {
 const label = document.createElement('label')
 label.htmlFor = step + 'Notes'
 label.textContent = 'Setup or role notes (optional)'
 const notes = document.createElement('textarea')
 notes.id = step + 'Notes'
 notes.maxLength = 1000
 notes.placeholder = 'Record an adapted setup, observer role, or anything that affected these trials.'
 $(step).insertBefore(label, $(step).querySelector('.actions'))
 label.after(notes)
}
const reflectionGroups = [
 {id:'interpretPosition',title:'Position and movement',fields:[
  ['interpretPosition','What happened in one position-matching comparison and one movement-direction trial?','Observed position and movement'],
  ['positionExplain','What sensory information helps explain these results? Use Reference 2 and the relevant receptor information.','How sensory information helps'],
  ['positionPrediction','How did your results compare with your prediction about vision?','Prediction compared with results']
 ]},
 {id:'interpretLoad',title:'Load and tactile information',fields:[
  ['interpretLoad','Use one dumbbell comparison. Identify both weights, the reference hand, and what you judged.','Dumbbell observation'],
  ['loadExplain','How could muscle–tendon tension help you judge the loads? Connect to Golgi tendon organs. What other information could help?','Tension and other information'],
  ['tactileExplain','What additional tactile information did exploring with your hands provide? Explain how it affected your guess and connect to skin mechanoreceptors.','Tactile information and identification']
 ]},
 {id:'application',title:'Application to sport, coaching, or physical therapy',fields:[
  ['applicationSituation','Describe a specific movement or task in sport, coaching, or physical therapy where proprioception matters.','Situation'],
  ['applicationReceptors','What does the person need to sense about position, movement, or force? Connect that information to a relevant receptor and explain how it helps guide the movement.','Physiological connection'],
  ['applicationEvidence','Which observation from your own lab helps explain this situation, and why?','Connection to lab evidence']
 ]}
]
let legacyGroups = new Set()
for (const group of reflectionGroups) {
 const block = document.createElement('div')
 block.className = 'reflection-group'
 block.id = group.id + 'Group'
 const heading = document.createElement('h3')
 heading.textContent = group.title
 block.append(heading)
 for (const [id,prompt] of group.fields) {
  const label = document.createElement('label')
  label.htmlFor = id
  label.textContent = prompt
  const response = document.createElement('textarea')
  response.id = id
  response.maxLength = 3000
  block.append(label,response)
 }
 $('reflectionFields').append(block)
}
function showLegacyGroups() {
 for (const group of reflectionGroups) {
  const legacy = legacyGroups.has(group.id)
  for (const [index,[id,prompt]] of group.fields.entries()) {
   const label = form.querySelector('label[for="'+id+'"]')
   label.textContent = legacy && index===0 ? 'Saved combined response from the earlier version. Review and edit it here.' : prompt
   label.hidden = legacy && index>0
   $(id).hidden = legacy && index>0
  }
 }
}
const activityPhotos = [
 ['position','Activity 1 · Position matching'],
 ['load','Activity 2 · Load discrimination'],
 ['touch','Activity 3 · Tactile object identification'],
 ['motion','Activity 4 · Movement direction']
]
for (const [id,title] of activityPhotos) {
 const block = document.createElement('div')
 const label = document.createElement('label')
 label.htmlFor=id+'Photo'
 label.textContent=title+' — photo evidence'
 const hint = document.createElement('p')
 hint.className='small'
 hint.textContent='Add one setup or equipment photo. Keep faces out of frame. In the caption, identify the setup or condition shown.'
 const upload = document.createElement('input')
 upload.type='file';upload.accept='image/*';upload.id=id+'Photo'
 const previewImage = document.createElement('img')
 previewImage.id=id+'Preview';previewImage.alt=title+' setup photo';previewImage.hidden=true
 const captionLabel = document.createElement('label')
 captionLabel.htmlFor=id+'Caption';captionLabel.textContent='What does this photo document?'
 const caption = document.createElement('input')
 caption.id=id+'Caption';caption.maxLength=250
 block.append(label,hint,upload,previewImage,captionLabel,caption)
 $(id).insertBefore(block,$(id).querySelector('.actions'))
}
const fields=[...form.querySelectorAll('input:not([type=file]),textarea,select')]
const prepFields=['student',...receptors.map(([id])=>id),'distinction','prediction','reason','signalPrep']
const photos={position:'',load:'',touch:'',motion:''}
let previousWork=null
let photoRevision=0
let unlocked=false,active='prep'
const key='exs101-proprioception-preview-v1'
function data(){return {kind:'exs101-proprioception',version:3,previousWork,legacyGroups:[...legacyGroups],prepComplete:unlocked,fields:Object.fromEntries(fields.map(f=>[f.id,f.value])),photos:{...photos}}}
function remember(){try{localStorage.setItem(key,JSON.stringify(data()))}catch{status.textContent='This browser could not save locally. Download a backup to keep your work.'}}
function show(step,focus=true){if(step!=='prep'&&!unlocked)return;active=step;for(const b of document.querySelectorAll('[data-step]')){const current=b.dataset.step===step;b.disabled=b.dataset.step!=='prep'&&!unlocked;if(current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');$(b.dataset.step).hidden=!current}if(focus){const h=$(step).querySelector('h2');h.tabIndex=-1;h.focus()}}
function backup(){const url=URL.createObjectURL(new Blob([JSON.stringify(data(),null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='EXS101-proprioception-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);status.textContent='Backup downloaded. Keep it if you plan to switch devices or want a separate copy.'}
function restore(d){if(d?.kind!=='exs101-proprioception'||![1,2,3].includes(d.version)||!d.fields||!d.photos)throw Error('Choose a backup exported from this lab.')
 photoRevision++
 previousWork=d.previousWork??(d.version<3?{version:d.version,fields:Object.fromEntries(Object.entries(d.fields).filter(([id])=>!fields.some(field=>field.id===id))),photos:d.photos.expect?{expect:d.photos.expect}:{}}:null)
 for(const f of fields){const val=d.fields[f.id];f.value=typeof val==='string'?val.slice(0,f.maxLength>0?f.maxLength:3000):''}
 for(const id of Object.keys(photos)){const p=d.photos[id];photos[id]=typeof p==='string'&&/^data:image\/(jpeg|png|webp);base64,[\w+/=]+$/.test(p)&&p.length<4000000?p:'';preview(id)}
 legacyGroups = new Set(reflectionGroups.filter(group => group.id==='interpretPosition' && (d.version===1 ? !!d.fields[group.id]?.trim() : Array.isArray(d.legacyGroups) && d.legacyGroups.includes(group.id))).map(group=>group.id))
 showLegacyGroups()
 unlocked=d.prepComplete===true&&prepFields.every(id=>$(id).value.trim())
 show(unlocked?'position':'prep',false)}
function preview(id){const el=$(id+'Preview');if(photos[id])el.src=photos[id];else el.removeAttribute('src');el.hidden=!photos[id]}
async function photo(id,file){const revision=photoRevision;const bmp=await createImageBitmap(file);try{if(revision!==photoRevision)return;const c=document.createElement('canvas');const scale=Math.min(1,1000/Math.max(bmp.width,bmp.height));c.width=Math.max(1,Math.round(bmp.width*scale));c.height=Math.max(1,Math.round(bmp.height*scale));const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(bmp,0,0,c.width,c.height);photos[id]=c.toDataURL('image/jpeg',.75);preview(id);remember()}finally{bmp.close()}}
for(const id of Object.keys(photos))$(id+'Photo').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{await photo(id,f)}catch{status.textContent='Could not open that photo. Try a JPG or PNG.'}})
for(const b of document.querySelectorAll('[data-step],[data-go]'))b.addEventListener('click',()=>show(b.dataset.step||b.dataset.go))
form.addEventListener('submit',e=>e.preventDefault())
form.addEventListener('input',e=>{if(e.target.type!=='file')remember()})
$('startOver').onclick=()=>$('resetDialog').showModal()
$('cancelReset').onclick=()=>$('resetDialog').close()
$('confirmReset').onclick=()=>{
 photoRevision++
 form.reset()
 for(const id of Object.keys(photos)){photos[id]='';preview(id)}
 legacyGroups.clear();previousWork=null;showLegacyGroups();unlocked=false
 $('report').replaceChildren();$('report').hidden=true;$('work').hidden=false
 let storageCleared=true
 try{localStorage.removeItem(key)}catch{storageCleared=false}
 $('resetDialog').close();show('prep')
 status.textContent=storageCleared?'Lab cleared. You can start again.':'The form is cleared, but this browser could not clear its saved copy. Check browser storage before reloading.'
}
$('save').onclick=backup
$('upload').onclick=()=>$('restore').click()
$('finish').onclick=()=>{const empty=prepFields.find(id=>!$(id).value.trim());if(empty){status.textContent='Complete the receptor review and prep questions before opening the lab.';$(empty).focus();return}unlocked=true;status.textContent='Prep complete. The lab activities are ready.';remember();show('position')}
$('restore').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>10000000)throw Error('That backup is too large.');restore(JSON.parse(await f.text()));remember();status.textContent='Backup restored. Review the revised directions and complete any new fields. Earlier-version work is retained in your JSON backup.'}catch(err){status.textContent=err instanceof SyntaxError?'That file is not a valid JSON backup.':err.message}e.target.value=''}
function report(){
 const target = $('report')
 target.replaceChildren()
 function node(parent,tag,text='') {
  const el = document.createElement(tag)
  el.textContent = text
  parent.append(el)
  return el
 }
 function part(title) {
  const section = node(target,'section')
  node(section,'h2',title)
  return section
 }
 function answer(parent,label,value) {
  node(parent,'p',label).className = 'answer-label'
  node(parent,'p',value)
 }
 function table(parent,headings,rows) {
  const grid = node(parent,'table')
  const head = node(node(grid,'thead'),'tr')
  for (const heading of headings) node(head,'th',heading).scope='col'
  const body = node(grid,'tbody')
  for (const row of rows) {
   const line = node(body,'tr')
   for (const value of row) node(line,'td',value)
  }
  return grid
 }
 function notes(parent,id) {
  if ($(id+'Notes').value.trim()) node(parent,'p','Setup or role notes — '+$(id+'Notes').value).className='notes'
 }
 node(target,'h1','Proprioception Lab')
 node(target,'p','EXS101 · Proprioception Lab').className='course-label'
 node(target,'p',$('student').value).className='student-label'
 let section = part('1 · Preparation')
 table(section,['Sensory receptor','Location and information detected'],receptors.map(([id,title])=>[title,$(id).value])).className='receptor-table'
 answer(section,'Position sense and movement sense',$('distinction').value)
 answer(section,'Prediction and reasoning',$('prediction').value+' — '+$('reason').value)
 answer(section,'Sensory input and motor output',$('signalPrep').value)
 section = part('2 · Lab evidence')
 node(section,'h3','Activity 1 · Position matching')
 table(section,['Position','Target','With vision','Without vision'],[1,2].map(i=>[String(i),$('pTarget'+i).value,$('pOpen'+i).value,$('pClosed'+i).value]))
 notes(section,'position')
 node(section,'h3','Activity 2 · Load discrimination')
 table(section,['Trial','Reference hand','Reference load','Comparison felt','Revealed comparison'],[1,2].map(i=>[String(i),$('lHand'+i).value,$('lRef'+i).value,$('lGuess'+i).value,$('lActual'+i).value]))
 notes(section,'load')
 node(section,'h3','Activity 3 · Tactile object identification')
 table(section,['Stage or detail','Observation'],tactileFields.map(([id,label])=>[label,$(id).value])).className='receptor-table'
 notes(section,'touch')
 for (const [id,cfg] of Object.entries(stationTrials)) {
  node(section,'h3','Activity 4 · '+cfg.title)
  const rows = Array.from({length:cfg.count},(_,i)=>[String(i+1),...cfg.columns.map((_,j)=>$(id+i+'_'+j).value)])
  table(section,['Trial',...cfg.columns],rows)
  notes(section,id)
 }
 const photoRow = node(section,'div')
 photoRow.className='photo-row'
 for (const [id,title] of activityPhotos) {
  if (!photos[id]) continue
  const figure = node(photoRow,'figure')
  const img = node(figure,'img')
  img.src=photos[id]
  img.alt=$(id+'Caption').value
  node(figure,'figcaption',title+' — '+$(id+'Caption').value)
 }
 section = part('3 · Interpretation and application')
 for (const group of reflectionGroups) {
  node(section,'h3',group.title)
  if (legacyGroups.has(group.id)) node(section,'p',$(group.id).value)
  else for (const [id,,label] of group.fields) answer(section,label,$(id).value)
 }
}
function prepareReport(){
 if(!prepFields.every(id=>$(id).value.trim())){
   show('prep',false);const missing=prepFields.find(id=>!$(id).value.trim())
   $(missing).focus();status.textContent='Complete the highlighted prep field before exporting.';return
 }
 const steps={position:['pTarget','pOpen','pClosed'].flatMap(prefix=>[1,2].map(i=>prefix+i)),load:['lHand','lRef','lGuess','lActual'].flatMap(prefix=>[1,2].map(i=>prefix+i)),touch:tactileFields.map(([id])=>id),reflect:reflectionGroups.flatMap(group=>legacyGroups.has(group.id)?[group.id]:group.fields.map(([id])=>id))}
 for(const [id,cfg] of Object.entries(stationTrials))steps[id]=Array.from({length:cfg.count},(_,i)=>cfg.columns.map((_,j)=>id+i+'_'+j)).flat()
 for(const step of ['position','load','touch','motion','reflect']){
   const missing=steps[step].find(id=>!$(id).value.trim())
   if(missing){show(step,false);$(missing).focus();status.textContent='Complete the highlighted activity or reflection field before exporting.';return}
 }
 for(const [id] of activityPhotos){
   const missing=!photos[id]?id+'Photo':!$(id+'Caption').value.trim()?id+'Caption':null
   if(missing){show(id,false);$(missing).focus();status.textContent='Add one photo and caption for each of the four activities before exporting.';return}
 }
 status.textContent='Report ready. Choose Save as PDF in the print dialog.'
 report();return true
}
$('review').onclick=()=>{
 if(!prepareReport())return
 $('work').hidden=true
 $('report').hidden=false
 const controls=document.createElement('div')
 controls.className='report-controls'
 const back=document.createElement('button')
 back.type='button';back.textContent='Back to lab'
 back.onclick=()=>{$('report').hidden=true;$('work').hidden=false;show('reflect')}
 controls.append(back);$('report').prepend(controls)
 $('report').scrollIntoView({block:'start'})
}
$('print').onclick=async()=>{
 if(!prepareReport())return
 await Promise.all([...$('report').querySelectorAll('img')].map(img=>img.decode().catch(()=>{})))
 window.print()
}

try{const saved=localStorage.getItem(key);if(saved)restore(JSON.parse(saved))}catch{}
