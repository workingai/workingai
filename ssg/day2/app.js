'use strict';
// HTML pages own the navigation and content. This file only handles practice controls.
const KEY='workingai_ssg_day2_v1';
let state={context:{},results:{},prompts:{},done:{},practice:{}};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object')for(const key of Object.keys(state))if(saved[key]&&typeof saved[key]==='object')state[key]=saved[key]}catch{}
for(const key of Object.keys(state.prompts)){if(typeof state.prompts[key]==='string')state.prompts[key]=state.prompts[key].replace(/^강의 실습용 가상 설정이야\. 실제 브랜드나 성과가 아니야\.\n/,'');}
// Remove the old shared sample preamble without discarding other user edits.
let migratedPrompts=false;
for(const key of Object.keys(state.prompts)){
 let text=state.prompts[key];if(typeof text!=='string')continue;
 const clean=text.replace(/소개 대상: 라이프스타일 브랜드 모노데이의 쇼룸[\s\S]*?가격·주소·운영시간은 미정이므로 넣지 마\.\s*/g,'');
 if(clean!==text){state.prompts[key]=clean;migratedPrompts=true;}
 if(key!=='warmup-step-1'&&/영상의 핵심 타깃과 전달할 매력을 명확히/.test(clean)){
  delete state.prompts[key];migratedPrompts=true;
 }
}
if(migratedPrompts){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
// Refresh the SVG exercise once, retaining a backup of any saved draft.
try {
 if(localStorage.getItem('day2_svg_prompt_revision')!=='20261021-research'){
  if(typeof state.prompts.information==='string')localStorage.setItem('day2_svg_prompt_previous',state.prompts.information);
  delete state.prompts.information;
  localStorage.setItem(KEY,JSON.stringify(state));
  localStorage.setItem('day2_svg_prompt_revision','20261021-research');
 }
}catch{}
// Refresh card-news defaults once; keep previous drafts as a backup.
try{if(localStorage.getItem('day2_cardnews_revision')!=='20261021-standalone'){
localStorage.setItem('day2_cardnews_previous',JSON.stringify({cardnews:state.prompts.cardnews,canva:state.prompts['canva-example']}));
delete state.prompts.cardnews;delete state.prompts['canva-example'];
localStorage.setItem(KEY,JSON.stringify(state));localStorage.setItem('day2_cardnews_revision','20261021-standalone');
}}catch{}
const defaults=new Map();let toastTimer;
function toast(message){const box=document.getElementById('toast');box.textContent=message;box.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('show'),2400)}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{toast('브라우저 저장이 제한됩니다. 기록을 다운로드하세요.')}}
function showPage(number){document.querySelectorAll('[data-first-page-only]').forEach(el=>el.classList.toggle('hidden',number!==1));const panels=[...document.querySelectorAll('.lesson-panel')];if(!panels[number-1])number=1;panels.forEach((panel,i)=>panel.classList.toggle('hidden',i!==number-1));const title=panels[number-1]?.dataset.pageTitle;if(title){document.querySelector('.lesson-header h1').textContent=title;document.title='WORKING AI · Day 2 · '+title;}document.querySelectorAll('[data-page-tab]').forEach(button=>{const selected=Number(button.dataset.pageTab)===number;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))})}
document.querySelectorAll('[data-page-tab]').forEach(button=>button.addEventListener('click',()=>showPage(Number(button.dataset.pageTab))));
document.querySelectorAll('[data-prompt]').forEach(input=>{const key=input.dataset.prompt;defaults.set(key,input.value);input.value=state.prompts[key]??input.value;input.addEventListener('input',()=>{state.prompts[key]=input.value;save()})});
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{const input=document.getElementById('prompt-'+button.dataset.copy);try{await navigator.clipboard.writeText(input.value);toast('프롬프트를 복사했습니다.')}catch{input.focus();input.select();try{if(!document.execCommand('copy'))throw Error();toast('프롬프트를 복사했습니다.')}catch{toast('선택한 내용을 Ctrl+C로 복사해 주세요.')}}}));
// Samples add only the input required by the current exercise.
function samplePrompt(key){
 const date=new Date();const today=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
 const base=(defaults.get(key)||'').replaceAll('[장소/브랜드/상품]','앞서 선택한 장소·브랜드·상품').replaceAll('[소개할 대상]','앞서 선택한 대상').replaceAll('[시작일]',today).replaceAll('[채널]','인스타그램');
 if(key==='information')return base.replace('[관심 있는 주제 (예: 최근 5년간 국내 OTT 서비스 점유율 변화)]','최근 5년간 국내 OTT 서비스 점유율 변화').replace('[원하는 차트 형태 — 예: 범프 차트(순위 변동), 막대 차트, 도넛 차트 등]','범프 차트(순위 변동)');
 if(key==='warmup-step-1')return '옥상 정원을 소개하는 짧은 영상을 만들려고 해.\n\n핵심 타깃과 전달할 매력을 정할 수 있도록 질문을 하나씩 해줘.\n1. 어떤 사람이 어떤 상황에서 찾는 공간인지\n2. 그 고객이 원하는 것과 이 공간의 매력은 무엇인지\n3. 영상을 본 뒤 어떤 행동을 하길 바라는지\n\n내 답변을 기다리고, 답하기 어려우면 예시를 제안해줘. 마지막에 타깃·매력·원하는 행동을 짧게 정리해줘. 확인되지 않은 특징은 지어내지 마.';
 const inputs={
 'ksf':'비교 자료: A는 첫 장면에 상품 사용 모습을 보여주고 특징 3개를 설명하는 콘텐츠, B는 공간 전경으로 시작해 이동 동선과 체험 장면을 보여주는 콘텐츠야. 성과 수치가 없으므로 성공 요인은 가설로 구분해줘.',
 'information':'차트 데이터: 상품 A 45건, B 30건, C 25건. 단위는 체험 건수, 기간은 1주, 출처는 연습용 데이터야. 실제 실적으로 표현하지 마.',
 'information-2':'지도 데이터: 서울 40명, 경기 30명, 인천 20명, 부산 10명. 단위는 관심 응답자 수, 기간은 1주, 출처는 연습용 데이터야.',
 'information-3':'안내할 내용: 체험 공간 입구에서 품목 확인 → 원하는 상품 체험 → 직원에게 문의. 제공하지 않은 위치·운영시간·가격은 생략해줘.',
 'information-4':'서명 정보: 김민지 / 콘텐츠 매니저 / 마케팅팀 / hello@example.com / https://example.com. 로고와 전화번호는 생략해줘.',
 'information-5':'절차 자료: 방문객이 입구에서 품목 확인 → 상품 선택 → 체험 → 직원에게 문의. 이 네 단계만 사용해줘.',
 'information-6':'비교 자료: 텀블러는 음료를 담고 그립감 체험, 조명은 책상에 놓고 빛의 분위기 체험, 가방은 소지품을 담고 착용감 체험. 용도·사용 장소·체험 방법을 비교해줘.',
 'information-7':'관계 자료: 방문객은 상품을 체험하고 직원에게 문의, 직원은 상품 안내와 문의 응대, 운영 담당자는 상품과 안내 자료 관리. 이 역할 관계만 표현해줘.'
 };
 if(key==='chatbot')return base+'\n\n테스트 입력: 1994년 5월 15일.';
 return inputs[key]?base+'\n\n'+inputs[key]:base;
}

document.querySelectorAll('[data-sample]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.sample;const input=document.getElementById('prompt-'+key);const text=samplePrompt(key);input.value=text;state.prompts[key]=text;save();toast('강사용 샘플을 불러왔습니다. 프롬프트 복사 버튼으로 복사하세요.')}));
document.getElementById('export-notes').addEventListener('click',()=>{const record={...state,prompts:{...state.prompts}};defaults.forEach((text,key)=>{if(record.prompts[key]===undefined)record.prompts[key]=text});const blob=new Blob(['Day 2 실습 기록\n'+JSON.stringify(record,null,2)],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='day2-workbook-notes.txt';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});

function showContentVariant(n){document.querySelectorAll('.content-variant').forEach((el,i)=>el.classList.toggle('hidden',i!==n-1));}
const contentFormat=document.getElementById('content-format');
if(contentFormat){
  contentFormat.value=state.practice.contentFormat==='2'?'2':'1';showContentVariant(Number(contentFormat.value));
  contentFormat.addEventListener('change',()=>{state.practice.contentFormat=contentFormat.value;save();showContentVariant(Number(contentFormat.value))});
}
const calendarStart=document.getElementById('calendar-start');
const calendarChannel=document.getElementById('calendar-channel');
if(calendarStart&&calendarChannel){
  const now=new Date();
  const today=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  calendarStart.value=state.practice.calendarStart||today;
  calendarChannel.value=state.practice.calendarChannel||'';
  const template=defaults.get('calendar');
  function updateCalendar(event){
    if(event&&state.prompts.calendar!==undefined&&!confirm('입력한 조건으로 프롬프트를 다시 만들까요? 직접 수정한 내용은 기본 문구로 바뀝니다.')){
      calendarStart.value=state.practice.calendarStart||today;
      calendarChannel.value=state.practice.calendarChannel||'';
      return;
    }
    state.practice.calendarStart=calendarStart.value;
    state.practice.calendarChannel=calendarChannel.value;
    const text=template.replace('[시작일]',calendarStart.value||'[시작일]').replace('[채널]',()=>calendarChannel.value.trim()||'[채널]');
    defaults.set('calendar',text);
    if(event)delete state.prompts.calendar;
    if(state.prompts.calendar===undefined)document.getElementById('prompt-calendar').value=text;
    save();
  }
  calendarStart.addEventListener('change',updateCalendar);
  calendarChannel.addEventListener('change',updateCalendar);
  updateCalendar();
}
const imageFormat=document.getElementById('image-format');
if(imageFormat){imageFormat.value=[...imageFormat.options].some(option=>option.value===state.practice.imageFormat)?state.practice.imageFormat:'1';imageFormat.addEventListener('change',()=>{state.practice.imageFormat=imageFormat.value;save();showPage(Number(imageFormat.value))});}
showPage(imageFormat?Number(imageFormat.value):(Number(new URLSearchParams(location.search).get('page'))||1));


const personScenes={"suggest": ["상황 추천받기", ""], "use": ["제품 사용", "제품을 실제로 사용하는 자연스러운 생활 장면. 손과 제품이 닿는 모습을 명확하게 표현"], "hold": ["제품 들고 소개", "제품을 가슴 높이에서 들고 카메라를 향해 소개하는 장면. 제품을 가리지 않는 자세"], "space": ["공간 안내", "소개할 장소에서 한 손으로 공간을 가리키며 방문객을 안내하는 장면"], "cafe": ["카페·휴식", "카페 테이블에서 컵을 들고 편안하게 쉬는 장면"], "work": ["업무·라이프스타일", "밝은 책상에서 노트북을 사용하는 자연스러운 업무 장면"], "wear": ["패션·착용", "가방을 착용하고 거울 앞에서 활용 모습을 보여주는 장면"], "grid": ["3×3 다양한 장면", "제품 사용·제품 소개·공간 안내·카페 휴식·노트북 작업·가방 착용·조명 체험·진열대 둘러보기·방문객 맞이의 9장면을 동일 인물의 3×3 이미지 한 장으로 구성. 각 칸 사이 흰 여백, 글자 없음"]};
const personScene=document.getElementById('person-scene');
if(personScene){
 const original=defaults.get('person-2');
 function updateScene(){const value=personScene.value;const prompt=value==='suggest'?original:'첨부한 가상 모델을 기준으로 같은 인물의 연출 이미지를 만들어줘.\n\n연출: '+personScenes[value][1]+'\n\n앞서 정한 장소·브랜드·상품과 콘텐츠 가이드에 맞춰줘. 얼굴·헤어스타일·의상을 유지하고 배경·행동만 바꿔줘. 실제 장소·상품 사진을 첨부했다면 형태·색상·로고는 유지해줘. 기준 이미지가 없으면 먼저 첨부를 요청해줘.\n\n실사 스타일, 16:9 비율, 자연스러운 손과 표정. 임의의 글자나 로고는 추가하지 마.';defaults.set('person-2',prompt);document.getElementById('prompt-person-2').value=prompt;state.prompts['person-2']=prompt;state.practice.personScene=value;save();}
 personScene.value=personScenes[state.practice.personScene]?state.practice.personScene:'suggest';
 personScene.addEventListener('change',updateScene);
}

const canvaExamples={"carousel": ["카드뉴스 만들기", "Canva에서 [소개할 장소/브랜드/상품 또는 관심 주제]를 소개하는 인스타그램 카드뉴스 3장을 만들어줘.\n\n앞서 정리한 문구가 있으면 활용해줘. 없다면 타깃 고객·핵심 내용·원하는 행동을 먼저 물어보고, 내 답변을 받은 뒤 만들어줘.\n\n관심을 끄는 표지 → 핵심 정보 → 행동 제안 순서로, 한 장에 메시지 하나씩 넣어줘. 1080×1350px 세로형으로 3장의 색상과 글꼴을 통일하고, 제목과 본문은 편집 가능한 텍스트로 배치해줘.\n\n확인되지 않은 정보는 추가하지 마. Canva에서 이어서 편집할 수 있는 디자인 링크를 알려줘."], "poster": ["포스터 만들기", "첨부한 공간 사진과 앞서 정리한 소개 문구로 Canva에서 방문 안내 포스터를 만들어줘.\n\n공간의 매력을 보여주는 사진을 크게 넣고 제목과 이용 안내가 잘 보이게 배치해줘. 제목과 안내 문구는 편집 가능한 텍스트로 만들어줘. 제공하지 않은 위치·운영시간·가격은 추가하지 마."], "product": ["상품 소개 페이지 만들기", "첨부한 상품 사진과 확인된 특징으로 Canva에서 상품 소개 페이지를 만들어줘.\n\n대표 이미지 → 핵심 특징 → 사용 장면 순서로 구성해줘. 상품의 모양·색·로고를 유지하고 제목과 본문은 편집 가능한 텍스트로 넣어줘. 제공하지 않은 성능이나 효능은 추가하지 마."], "presentation": ["발표자료 만들기", "앞서 정리한 조사 결과를 Canva 발표자료 5장으로 만들어줘.\n\n핵심 결론 → 근거 → 주요 발견 → 적용 아이디어 → 다음 행동 순서로 구성해줘. 한 장에 메시지 하나씩 넣고 수치와 출처는 제공한 자료만 사용해줘. Canva에서 수정할 수 있는 디자인 링크를 알려줘."], "edit": ["기존 디자인 수정하기", "내가 선택한 Canva 디자인의 제목을 더 짧고 명확하게 바꾸고 본문 글자를 읽기 쉽게 키워줘.\n\n기존 색상과 분위기는 유지하고, 문장이 길면 핵심만 남겨줘. 수정 대상 디자인이 지정되지 않았다면 먼저 링크를 요청해줘. 원본은 남기고 사본으로 수정해줘."], "reuse": ["기존 자료 찾아 활용하기", "내 Canva에서 상품 소개 디자인을 찾아 후보를 보여줘. 내가 하나를 선택하면 그 디자인의 색상·글꼴·구성을 참고해 새 상품 소개안을 만들어줘.\n\n새 상품의 사진과 설명이 없으면 먼저 요청해줘. 기존 디자인은 그대로 두고 새로운 디자인으로 만들어줘."]};
const canvaExample=document.getElementById('canva-example');
if(canvaExample){
 const input=document.getElementById('prompt-canva-example');
 canvaExample.value=canvaExamples[state.practice.canvaExample]?state.practice.canvaExample:'carousel';
 defaults.set('canva-example',canvaExamples[canvaExample.value][1]);
 if(state.prompts['canva-example']===undefined)input.value=defaults.get('canva-example');
 canvaExample.addEventListener('change',()=>{
  const text=canvaExamples[canvaExample.value][1];
  input.value=text;defaults.set('canva-example',text);
  state.practice.canvaExample=canvaExample.value;state.prompts['canva-example']=text;save();
 });
}
