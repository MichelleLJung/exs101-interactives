"use strict";

const coachURL = ""; // Set to the verified HTTPS share link when a coach is available.
const sections = [
  {id:"journey", title:"My Career Journey", points:10, fields:[
    ["start","Where I started","Revisit your Career & Pathway Baseline. What interested you, and what did you expect or understand about that path then?"],
    ["now","Where I am now","Where are you leaning now? How has your understanding changed, expanded, or been reinforced?"],
    ["influence","What influenced my perspective","Name a specific EXS101 experience or concept and explain how it influenced your thinking."]
  ]},
  {id:"anatomy", title:"Functional Anatomy", points:10, fields:[
    ["phase","Movement and phase","Choose one movement and one specific phase."],
    ["anatomy","Joints, actions, and muscles","Identify the major joints, their actions in that phase, and the muscles that produce or control those actions."],
    ["apply","Professional application","Who would you work with and what would this analysis change about a cue, observation, or decision?"]
  ]},
  {id:"phys",title:"Exercise Physiology",points:15,options:["vo2","fitness"],without:"Use a specific class example involving an exercise response, energy systems, or assessment. Explain the mechanism and identify the observation it helps explain."},
  {id:"bio",title:"Biomechanics",points:15,options:["torque","output"],without:"Use a specific movement and compare two positions, setups, or trials. Explain the difference using a mechanical concept from class."},
  {id:"motor",title:"Motor Behavior",points:15,options:["proprioception","feedback","reaction"],without:"Name a specific class example of sensory information, feedback, attention, or task demands. Explain how a change in conditions could affect movement or performance."},
  {id:"psych",title:"Exercise Psychology",points:15,options:["motivation"],without:"Use a specific class example, such as a detail from the fictional client investigation. Explain how a course concept accounts for the motivation, confidence, or adherence issue."},
  {id:"together",title:"Bringing It All Together",points:20,fields:[
    ["integration","Interdisciplinary integration","Describe one professional situation. Explain what at least three EXS101 disciplines contribute and how those contributions work together."],
    ["ebp","Evidence-based practice","Why does EBP matter in your chosen role? Identify one decision, the credible evidence you would seek, and how the person’s needs and preferences would influence your choice."],
    ["next","Next steps","Identify one concrete educational or professional action and connect it to something you learned in EXS101."]
  ]},
  {id:"review",title:"Review and export"}
];
const anatomyRefs = ["functional-anatomy-joint-actions-reference","functional-anatomy-muscles-and-movement-reference"];
const fallbackRefs = {
  phys:["exercise-physiology-how-the-body-responds-to-exercise","measuring-and-interpreting-exercise-physiology"],
  bio:["motion-forces-and-measurement","torque-stability-and-coordination","work-power-and-movement-data"],
  motor:["motor-behavior-motor-control-sensory-input-and-proprioception","motor-behavior-motor-learning-feedback-and-practice","motor-behavior-reaction-time-and-information-processing"],
  psych:["exercise-psychology-|-motivation-and-self-efficacy","exercise-psychology-|-exercise-adherence-and-behavior-change","exercise-psychology-|-exercise-environments-and-mental-health"]
};
const sectionNames = {"15373":"15373 · MW 9:00 AM","15374":"15374 · MW noon","15378":"15378 · TTh 1:30 PM"};
const checkLabels = [
  "My career reflection describes my starting point, current direction, and one specific influence.",
  "My anatomy section connects a movement phase to specific joints, actions, muscles, and a professional use.",
  "Each available evidence item is readable, described, tied to my original Canvas work, and free of private details.",
  "Each discipline uses a specific example, explains it accurately, and justifies an action in my chosen role.",
  "My conclusion connects at least three disciplines, explains an evidence-informed decision, and names a next step.",
  "I reviewed the PDF and checked each available Canvas link while signed in."
];

const $ = id => document.getElementById(id);
const has = value => typeof value === "string" && value.trim() !== "";
const draft = () => ({version:1, name:"", section:"", focus:"", exploring:false, active:0, checks:[], entries:Object.fromEntries(sections.slice(0,7).map(s=>[s.id,{images:[]}]))});
let state = draft();
let database;
let timer;
let writes = Promise.resolve();
let loading = false;
const MAX_IMAGES = 2;
const MAX_IMAGE_BYTES = 5_000_000;
const MAX_BACKUP_BYTES = 70_000_000;

function node(tag, value, parent, attrs = {}) {
  const element = document.createElement(tag);
  if (value != null) element.textContent = value;
  for (const [key, attr] of Object.entries(attrs)) element.setAttribute(key, attr);
  parent?.append(element);
  return element;
}

function status(message) { $("save-status").textContent = message; }

function openDraft() {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open("exs101-professional-portfolio",1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function stored(mode, action) {
  return new Promise((resolve,reject) => {
    const tx = database.transaction("drafts",mode);
    const request = action(tx.objectStore("drafts"));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = tx.onerror = () => reject(tx.error);
  });
}

function save() {
  clearTimeout(timer);
  timer=undefined;
  if (!database) return;
  const snapshot = structuredClone(state);
  writes = writes.catch(()=>{}).then(()=>stored("readwrite", table=>table.put(snapshot,"current")));
  writes.then(()=>status("Saved in this browser."),()=>status("Local saving failed. Download a JSON backup to keep your work."));
}

function changed() {
  renderStatus();
  if (database) {
    clearTimeout(timer);
    timer = setTimeout(save,200);
  }
}
document.addEventListener("visibilitychange",()=>{ if (document.hidden && timer) save(); });
window.addEventListener("pagehide",()=>{ if (timer) save(); });

function canvasLink(value) {
  try {
    const url = new URL(value);
    if (url.origin !== "https://learn.maricopa.edu" || url.username || url.password) return "";
    if (!/^\/courses\/\d+\/assignments\/\d+(?:\/submissions(?:\/\d+)?)?\/?$/.test(url.pathname)) return "";
    // Canonical path keeps the link behind Canvas sign-in and drops session or file tokens.
    return url.origin + url.pathname;
  } catch { return ""; }
}

function focus() { return state.focus.trim() || (state.exploring ? "a role you’re exploring" : "your intended profession"); }
function geometryPrompt(text) { return `In ${focus()}, ${text[0].toLowerCase()}${text.slice(1)}`; }

function assignmentTitle(key) {
  const titles = course.choices[key]?.titles;
  if (!titles) return "";
  if (state.section) return titles[state.section];
  if (new Set(Object.values(titles)).size === 1) return titles["15373"];
  return key === "vo2" ? "VO₂max and Wingate Lab" : "Fitness Physiological Assessment Lab";
}

function reused() {
  const {reuse} = state.entries.anatomy;
  if (!reuse) return null;
  const [section,id] = reuse.split("/");
  const source = state.entries[section];
  return source?.choice && source.images.find(image=>image.id===id) || null;
}

function sectionStatus(s) {
  const entry = state.entries[s.id];
  if (s.options) {
    if (!entry.choice || !entry.images.length) return "Missing evidence";
    const usableLinkOrNote = canvasLink(entry.link) || entry.linkIssue;
    return usableLinkOrNote && entry.images.every(image=>has(image.caption)&&has(image.description)) && has(entry.concept) && has(entry.apply) ? "Complete" : "Incomplete";
  }
  if (!s.fields) return state.checks.filter(Boolean).length === checkLabels.length ? "Complete" : "Incomplete";
  const identity = s.id !== "journey" || has(state.name) && state.section && (state.exploring || has(state.focus));
  return identity && s.fields.every(([key])=>has(entry[key])) ? "Complete" : "Incomplete";
}

function renderStatus() {
  for (const [index,s] of sections.entries()) {
    const badge = $("status-"+s.id);
    if (!badge) continue;
    const text = sectionStatus(s);
    badge.textContent = text;
    badge.classList.toggle("missing",text==="Missing evidence");
    const button = badge.parentElement;
    if (index === state.active) button.setAttribute("aria-current","step");
    else button.removeAttribute("aria-current");
  }
}

function go(index, moveFocus = true) {
  state.active = index;
  render();
  changed();
  if (moveFocus) $("editor").focus();
}

function field(parent, label, hint, value, update, type = "textarea") {
  const id = "field-" + parent.querySelectorAll(".field").length + "-" + parent.id;
  const container = node("div",null,parent,{class:"field"});
  node("label",label,container,{for:id});
  const attrs = {id};
  if (hint) {
    attrs["aria-describedby"] = id+"-hint";
    node("p",hint,container,{class:"hint",id:id+"-hint"});
  }
  if (type !== "textarea") attrs.type = type;
  const input = node(type === "textarea" ? type : "input",null,container,attrs);
  input.value = value || "";
  input.addEventListener("input",()=>{ update(input.value); changed(); });
  return input;
}

function select(parent,id,label,options,current,update) {
  const container = node("div",null,parent,{class:"field"});
  node("label",label,container,{for:id});
  const input = node("select",null,container,{id});
  for (const [key,title] of options) node("option",title,input,{value:key});
  input.value = current || "";
  input.addEventListener("change",()=>{ update(input.value); changed(); });
  return input;
}

function checkbox(parent,label,checked,update) {
  const wrapper = node("label",null,parent);
  const box = node("input",null,wrapper,{type:"checkbox"});
  box.checked = Boolean(checked);
  node("span",label,wrapper);
  box.addEventListener("change",()=>{ update(box.checked); changed(); });
  return box;
}

function references(parent, slugs) {
  const box = node("details",null,parent,{class:"help"});
  node("summary","Canvas reference pages",box);
  if (!state.section) {
    node("p","Select your Canvas section in My Career Journey to open these pages.",box);
  }
  if (state.section) node("a","Open your Canvas modules",box,{href:`https://learn.maricopa.edu/courses/${course.sections[state.section]}/modules`,target:"_blank",rel:"noopener noreferrer"});
  const list = node("ul",null,box);
  for (const slug of slugs) {
    const li = node("li",null,list);
    const title = course.refs[slug];
    if (state.section) node("a",title,li,{href:`https://learn.maricopa.edu/courses/${course.sections[state.section]}/pages/${encodeURIComponent(slug)}`,target:"_blank",rel:"noopener noreferrer"});
    else li.textContent = title;
  }
}

function button(parent,label,action,primary=false) {
  const b = node("button",label,parent,{type:"button"});
  if (primary) b.className = "primary";
  b.addEventListener("click",action);
  return b;
}

async function asImage(file) {
  if (file.size > 25_000_000 || !["image/png","image/jpeg","image/webp"].includes(file.type)) throw Error("Choose a PNG, JPEG, or WebP image under 25 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1,2400/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1,Math.round(image.naturalWidth*scale));
    canvas.height = Math.max(1,Math.round(image.naturalHeight*scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const data = canvas.toDataURL("image/jpeg",.93);
    if (data.length > MAX_IMAGE_BYTES) throw Error("That image is too large. Crop to the visible evidence and try again.");
    return {id:crypto.randomUUID(),data,caption:"",description:""};
  } finally { URL.revokeObjectURL(url); }
}

function evidence(parent,section) {
  const entry = state.entries[section.id];
  const box = node("fieldset",null,parent,{class:"evidence",id:"evidence-"+section.id});
  node("legend",section.id==="anatomy" ? "Optional evidence" : "Upload an excerpt",box);
  node("p","One evidence item is enough. Use a cropped PNG, JPEG, or WebP showing your actual work. Remove names of other people, grades, account details, and unrelated private information.",box,{class:"hint"});
  if (section.id === "anatomy") {
    const items = sections.filter(s=>s.options).flatMap(s=>state.entries[s.id].choice ? state.entries[s.id].images.map((im,i)=>[s.id+"/"+im.id,s.title+" · "+(im.caption.trim()||`Evidence ${i+1}`)]) : []);
    if (items.length) select(box,"reuse","Reuse evidence from a discipline",[["","No reused evidence"],...items],entry.reuse,value=>{entry.reuse=value;});
  }
  const message = node("p",null,box,{role:"status",class:"hint"});
  if (entry.images.length<MAX_IMAGES) {
    node("label","Add evidence image",box,{for:"image-upload"});
    const file = node("input",null,box,{id:"image-upload",type:"file",accept:"image/png,image/jpeg,image/webp"});
    file.addEventListener("change",async()=>{
      if (!file.files[0]) return;
      const originalChoice = entry.choice;
      file.disabled = true;
      try {
        const image = await asImage(file.files[0]);
        if (state.entries[section.id] !== entry || entry.choice !== originalChoice || entry.images.length>=MAX_IMAGES) return;
        entry.images.push(image);
        save();
        renderStatus();
        if (box.isConnected) { render(); $("evidence-"+section.id).querySelector("button").focus(); }
      } catch (error) { message.textContent = error.message || "Could not read the image."; }
      finally { file.disabled=false;file.value=""; }
    });
  }
  for (const [i,image] of entry.images.entries()) {
    node("h3","Evidence " + (i+1),box);
    const preview = node("img",null,box,{src:image.data,alt:image.description||"Your evidence image"});
    field(box,"Caption", "Identify the excerpt and the detail it supports.", image.caption,v=>{image.caption=v;},"text").maxLength=180;
    const description = field(box,"Accessible description","Describe the important values, pattern, or action for a reader who cannot see the image.", image.description,v=>{image.description=v;preview.alt=v||"Your evidence image";});
    description.rows=2;
    description.maxLength=600;
    button(box,"Remove evidence "+(i+1),()=>{
      entry.images.splice(i,1);
      if (state.entries.anatomy.reuse===section.id+"/"+image.id) state.entries.anatomy.reuse="";
      save();
      render();
      $("editor").focus();
    });
  }
}

function renderDiscipline(parent,s) {
  const entry = state.entries[s.id];
  const choice = course.choices[entry.choice];
  const picker = select(parent,"assignment","Canvas assignment you completed",[["","Choose an assignment"],["none","I did not complete an eligible assignment"],...s.options.map(key=>[key,assignmentTitle(key)])],entry.choice || (entry.noWork?"none":""),value=>{
    if (entry.choice && entry.choice!==value && (entry.images.length || has(entry.link) || entry.linkIssue)) {
      if (!confirm("Changing assignments clears the evidence and Canvas link for this section. Keep your explanations and change the assignment?")) { picker.value=entry.choice;return; }
      if (state.entries.anatomy.reuse?.startsWith(s.id+"/")) state.entries.anatomy.reuse="";
      entry.images=[]; entry.link=""; entry.linkIssue=false;
    }
    entry.noWork=value==="none";
    entry.choice=value==="none"?"":value;
    render();
    $("assignment").focus();
    save();
  });
  if (choice) {
    const details = node("details",null,parent,{class:"help"});
    node("summary","How to copy your Canvas link",details);
    node("p","In Canvas, open Grades and select this assignment. With your submitted work visible, copy the address from your browser. If Canvas only gives you an assignment page, paste that address and check the box below. Keep all work inside Canvas permissions. If you can’t copy the link, check the same box so your instructor can locate the work by name.",details);
    const link = field(parent,"Original Canvas submission link","Use a Maricopa Canvas assignment or submission page URL.",entry.link,v=>{entry.link=v;},"url");
    const validate = () => link.setCustomValidity(has(link.value)&&!canvasLink(link.value)?"Use an assignment or submission URL on learn.maricopa.edu.":"");
    link.addEventListener("input",validate);
    link.addEventListener("blur",()=>{validate();if (has(link.value)) link.reportValidity();});
    checkbox(node("div",null,parent,{class:"checks"}),"Canvas only shows the assignment page or I couldn’t copy a submission link.",entry.linkIssue,v=>{entry.linkIssue=v;});
    evidence(parent,s);
  } else {
    node("p","Evidence stays blank if you did not complete an eligible assignment. You can still earn points for conceptual understanding and professional application.",parent,{class:"notice"});
  }
  references(parent,choice?.refs || fallbackRefs[s.id]);
  field(parent,"What the result or example demonstrates",choice?.concept || s.without,entry.concept,v=>{entry.concept=v;});
  field(parent,"Professional application · "+focus(),geometryPrompt(choice?.apply || "What would you do in a specific situation, and why would this concept change that decision?"),entry.apply,v=>{entry.apply=v;});
}

function renderReview(parent) {
  const box = node("fieldset",null,parent,{class:"checks"});
  node("legend","Final self-review",box);
  checkLabels.forEach((label,i)=>checkbox(box,label,state.checks[i],v=>{state.checks[i]=v;}));
  const incomplete = sections.slice(0,7).filter(s=>sectionStatus(s)!=="Complete");
  if (incomplete.length) node("p",incomplete.map(s=>s.title+" ("+sectionStatus(s).toLowerCase()+")").join(" · ")+". You can still export your portfolio.",parent,{class:"notice"});
  const actions = node("div",null,parent,{class:"actions"});
  button(actions,"Preview portfolio",()=>{
    const preview = $("preview");
    preview.hidden=!preview.hidden;
    if (!preview.hidden) { buildDocument(preview); preview.focus(); }
  });
  button(actions,"Print / Save as PDF",async()=>{
    const target = $("printout");
    buildDocument(target);
    await Promise.all(Array.from(target.images || target.querySelectorAll("img"),image=>image.decode().catch(()=>{})));
    window.print();
  },true);
  node("p","In the print dialog, select Save as PDF and Letter paper. Use the browser’s full tab or desktop Chrome or Edge for page numbers. Open the finished PDF to check links and evidence before uploading.",parent,{class:"hint"});
  node("article",null,parent,{id:"preview",class:"document",tabindex:"-1",hidden:"", "aria-label":"Portfolio document preview"});
}

function render() {
  const s = sections[state.active], entry = state.entries[s.id], parent = $("editor");
  parent.replaceChildren();
  node("h2",s.title,parent);
  if (s.points) node("p",s.points+" points · Aim for a few specific sentences per response.",parent,{class:"hint"});
  if (s.id === "journey") {
    field(parent,"Student name",null,state.name,v=>{state.name=v;},"text");
    select(parent,"course-section","Canvas section",[["","Select your section"],...Object.entries(sectionNames)],state.section,v=>{state.section=v;});
    checkbox(node("div",null,parent,{class:"checks"}),"I’m undecided or exploring.",state.exploring,v=>{state.exploring=v;});
    field(parent,"Career focus or role you want to explore","If you’re undecided, choose a role to use in your applications or describe a setting you’re exploring.",state.focus,v=>{state.focus=v;},"text");
    node("p","Use your baseline to jog your memory. You do not need to upload or link it.",parent,{class:"hint"});
    const coaching = node("details",null,parent,{class:"help"});
    node("summary","Professional reasoning coach questions",coaching);
    const prompts = node("ul",null,coaching);
    for (const q of ["What specific detail would help a reader see what happened?","Which course concept explains that detail, and how?","Who is involved in the professional situation, what would you do, and what justifies that decision?"]) node("li",q,prompts);
    if (coachURL) node("a","Open the optional Professional Reasoning Coach",coaching,{href:coachURL,target:"_blank",rel:"noopener noreferrer"});
    if (coachURL) node("p","Use a de-identified summary. Keep private Canvas links and evidence in your portfolio.",coaching);
  }
  if (s.id === "anatomy") references(parent,anatomyRefs);
  if (s.fields) for (const [key,label,hint] of s.fields) field(parent,key==="apply"?label+" · "+focus():label,hint,entry[key],v=>{entry[key]=v;});
  if (s.id === "anatomy") evidence(parent,s);
  if (s.options) renderDiscipline(parent,s);
  if (s.id === "review") renderReview(parent);
  const actions = node("div",null,parent,{class:"actions"});
  if (state.active>0) button(actions,"Previous section",()=>go(state.active-1));
  if (state.active<sections.length-1) button(actions,"Next section",()=>go(state.active+1),true);
  renderStatus();
}

function buildDocument(target) {
  target.className = "document";
  target.replaceChildren();
  const head = node("header",null,target);
  node("h1","Final Professional Portfolio",head);
  node("p",state.name.trim()||"Student name missing",head);
  const career = state.focus.trim() || (state.exploring?"Undecided / exploring":"Career focus missing");
  node("p","EXS101 · "+career+(state.exploring&&has(state.focus)?" (exploring)":""),head);
  function figure(parent,image) {
    const el = node("figure",null,parent);
    node("img",null,el,{src:image.data,alt:image.description || "Student evidence image"});
    const caption = node("figcaption",null,el);
    if (has(image.caption)) node("p",image.caption,caption);
    if (has(image.description)) node("p",image.description,caption);
  }
  function answer(parent,label,value) {
    node("h3",label,parent);
    node("p",has(value)?value.trim():"Response missing.",parent);
  }
  for (const s of sections.slice(0,7)) {
    const part = node("section",null,target);
    node("h2",s.title,part);
    const entry = state.entries[s.id];
    if (s.options) {
      if (entry.choice) {
        node("p",assignmentTitle(entry.choice),part,{class:"source"});
        const link = canvasLink(entry.link);
        if (link) node("a",entry.linkIssue?"Canvas assignment or submission (sign-in required)":"Original Canvas submission (sign-in required)",part,{href:link});
        if (entry.linkIssue) node("p","Direct-link limitation reported. Locate the original work in Canvas using the assignment name.",part);
        else if (!link) node("p","Canvas link missing.",part);
      }
      if (!entry.choice || !entry.images.length) node("p","Evidence missing.",part,{class:"missing"});
      else for (const image of entry.images) figure(part,image);
      answer(part,"Conceptual understanding",entry.concept);
      answer(part,"Professional application",entry.apply);
    } else {
      for (const [key,label] of s.fields) answer(part,label,entry[key]);
      if (s.id==="anatomy") {
        const image = reused();
        if (image) figure(part,image);
        for (const item of entry.images) figure(part,item);
      }
    }
  }
}

function validateBackup(raw) {
  if (raw?.version !== 1 || !raw.entries || typeof raw.entries!=="object") throw Error("This is not a supported EXS101 portfolio backup.");
  const next = draft();
  const str = value => typeof value==="string" ? value : "";
  next.name=str(raw.name); next.focus=str(raw.focus); next.exploring=raw.exploring===true;
  if (Object.hasOwn(course.sections,raw.section)) next.section=raw.section;
  if (Number.isInteger(raw.active)&&sections[raw.active]) next.active=raw.active;
  next.checks=checkLabels.map((_,i)=>raw.checks?.[i]===true);
  for (const s of sections.slice(0,7)) {
    const item = raw.entries[s.id] || {}, entry = next.entries[s.id];
    if (Array.isArray(item.images)) {
      if (item.images.length>MAX_IMAGES) throw Error("This backup exceeds the image limit.");
      entry.images=item.images.map(image=>{
        if (!image || !/^[a-z0-9-]{1,80}$/i.test(image.id) || typeof image.data!=="string" || image.data.length>MAX_IMAGE_BYTES || !/^data:image\/jpeg;base64,[A-Za-z\d+/]+=*$/.test(image.data)) throw Error("This backup contains an invalid evidence image.");
        return {id:image.id,data:image.data,caption:str(image.caption),description:str(image.description)};
      });
    }
    for (const [key] of s.fields||[["link"],["concept"],["apply"]]) entry[key]=str(item[key]);
    if (s.options?.includes(item.choice)) entry.choice=item.choice;
    entry.noWork=item.noWork===true;
    entry.linkIssue=item.linkIssue===true;
    if (s.id==="anatomy" && /^(phys|bio|motor|psych)\/[a-z0-9-]{1,80}$/i.test(item.reuse||"")) entry.reuse=item.reuse;
  }
  return next;
}

function download() {
  const url=URL.createObjectURL(new Blob([JSON.stringify(state)],{type:"application/json"}));
  const anchor=node("a",null,document.body,{href:url,download:"EXS101-Portfolio-Backup.json"});
  anchor.click();
  anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30_000);
}

async function start() {
  for (const [index,s] of sections.entries()) {
    const b=button($("sections"),s.title,()=>go(index));
    node("span",null,b,{id:"status-"+s.id,class:"status"});
  }
  const file=$("restore-file");
  $("backup").addEventListener("click",download);
  $("restore").addEventListener("click",()=>file.click());
  $("reset").addEventListener("click",()=>{
    if (loading || !confirm("Start over and replace the draft in this browser? Download a backup first if you want to keep it.")) return;
    state=draft(); go(0); save();
  });
  file.addEventListener("change",async()=>{
    const selected=file.files[0];
    file.value="";
    if (!selected || loading) return;
    loading=true;
    try {
      if (selected.size>MAX_BACKUP_BYTES) throw Error("This backup exceeds the file size limit.");
      const next=validateBackup(JSON.parse(await selected.text()));
      await Promise.all(Object.values(next.entries).flatMap(e=>e.images).map(async evidence=>{
        const img=new Image();
        img.src=evidence.data;
        await img.decode();
      }));
      if (!confirm("Replace the current draft with this JSON backup?")) return;
      state=next;
      go(state.active);
      save();
      if (!database) status("Backup restored for this visit. Download a new backup before closing.");
    } catch (error) { status("Backup could not be loaded. Current work was kept. "+error.message); }
    finally { loading=false; }
  });
  try {
    database=await openDraft();
    const saved=await stored("readonly",table=>table.get("current"));
    if (saved) state=validateBackup(saved);
    status(saved?"Restored your draft from this browser.":"Drafts autosave in this browser.");
  } catch {
    database=null;
    status("Local saving is unavailable. Download JSON backups to keep your work.");
  }
  render();
}
start();
