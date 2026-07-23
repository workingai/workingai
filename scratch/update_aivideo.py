import re

file_path = 'workshop01/06_aivideo.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<!-- ================= CONTAINER 3: 이미지 영상화 (탭 3) ================= -->'
end_marker = '<!-- ================= CONTAINER 4: 캐릭터를 활용한 제품 소개 영상 만들기 (탭 4) ================= -->'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    before = content[:start_idx]
    after = content[end_idx:]
    
    new_tab_3 = """<!-- ================= CONTAINER 3: 이미지 영상화 (탭 3) ================= -->
      <div id="tab-3-container" class="hidden flex flex-col gap-6">
        <div class="steps-wrapper">
          <section class="steps" style="margin-top: 10px;">
            
            <!-- Step 1 Card -->
            <article class="card transition-all duration-300 lg:col-span-4" id="step1-card">
              <div class="card-head flex items-center justify-between cursor-pointer select-none bg-[#EAF2EE]" style="padding: 16px 20px !important; gap: 4px !important;" onclick="setActiveStep(1)">
                <div class="flex flex-col flex-1">
                  <h2 id="step1-title" class="text-base font-extrabold text-neutral-900 flex items-center gap-2 m-0" style="margin-bottom: 0px !important;">🎨 Step I. 시작 이미지 생성</h2>
                  <p id="step1-desc" class="text-xs text-neutral-500 m-0" style="margin-top: 0px !important;">영상 시작 시점의 스케치 장면 묘사</p>
                </div>
              </div>
              <div id="step1-body" class="card-body flex-grow flex flex-col gap-4">
                <textarea id="prompt-start-img" class="w-full p-4 border border-[#DDDBD5] bg-white text-neutral-900 text-sm md:text-base leading-relaxed placeholder-neutral-400 focus:border-brand-500 focus:ring-0 outline-none resize-none font-mono leading-relaxed" style="height: 220px; font-family: 'Pretendard', sans-serif;">나무 재질의 사무실 책상을 위에서 비스듬히 내려다본 구도.
책상 정중앙에 놓인 종이 위에 연필로 거칠게 그린 '미래형 스마트 에스프레소 머신'의 디자인 스케치가 있다.
종이 옆에는 연필 and 지우개가 놓여 있고, 부드러운 아침 햇살이 비치는 16:9 고해상도의 실사 사진 스타일.</textarea>
                <div class="flex justify-end mt-2">
                  <button onclick="copyPrompt('prompt-start-img')" class="px-5 h-11 bg-brand-500 hover:bg-brand-600 text-white text-sm font-extrabold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 focus:outline-none">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <rect x="9" y="9" width="11" height="11" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"></rect>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    프롬프트 복사
                  </button>
                </div>
              </div>
              <!-- Collapsed Body -->
              <div id="step1-collapsed-body" class="p-4 bg-white flex items-center justify-center flex-grow hidden cursor-pointer select-none" onclick="setActiveStep(1)">
                <span class="text-sm font-bold text-neutral-500">시작 이미지 생성</span>
              </div>
            </article>

            <!-- Step 2 Card -->
            <article class="card transition-all duration-300 lg:col-span-1 opacity-60" id="step2-card">
              <div class="card-head flex items-center justify-between cursor-pointer select-none bg-neutral-50" style="padding: 16px 20px !important; gap: 4px !important;" onclick="setActiveStep(2)">
                <div class="flex flex-col flex-1">
                  <h2 id="step2-title" class="text-base font-extrabold text-neutral-900 flex items-center gap-2 m-0" style="margin-bottom: 0px !important;">✨ Step II</h2>
                  <p id="step2-desc" class="text-xs text-neutral-500 m-0 hidden" style="margin-top: 0px !important;">제품이 실물로 나타난 완성 장면 묘사</p>
                </div>
              </div>
              <div id="step2-body" class="card-body flex-grow flex flex-col gap-4 hidden">
                <textarea id="prompt-end-img" class="w-full p-4 border border-[#DDDBD5] bg-white text-neutral-900 text-sm md:text-base leading-relaxed placeholder-neutral-400 focus:border-brand-500 focus:ring-0 outline-none resize-none font-mono leading-relaxed" style="height: 220px; font-family: 'Pretendard', sans-serif;">시작 이미지와 동일한 구도의 나무 재질 사무실 책상.
종이와 연필이 있던 자리에 스케치와 똑같은 디자인의 실제 '미래형 스마트 에스프레소 머신'이 실물로 놓여 있다.
매트한 BLACK 메탈과 크롬 소재로 마감된 세련된 외형이며, 머신 옆에는 갓 추출된 에스프레소 잔이 놓여 있는 고해상도 제품 광고 사진 스타일.</textarea>
                <div class="flex justify-end mt-2">
                  <button onclick="copyPrompt('prompt-end-img')" class="px-5 h-11 bg-brand-500 hover:bg-brand-600 text-white text-sm font-extrabold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 focus:outline-none">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <rect x="9" y="9" width="11" height="11" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"></rect>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    프롬프트 복사
                  </button>
                </div>
              </div>
              <!-- Collapsed Body -->
              <div id="step2-collapsed-body" class="p-4 bg-white flex items-center justify-center flex-grow cursor-pointer select-none" onclick="setActiveStep(2)">
                <span class="text-sm font-bold text-neutral-500">종료 이미지 생성</span>
              </div>
            </article>

            <!-- Step 3 Card -->
            <article class="card transition-all duration-300 lg:col-span-1 opacity-60" id="step3-card">
              <div class="card-head flex items-center justify-between cursor-pointer select-none bg-neutral-50" style="padding: 16px 20px !important; gap: 4px !important;" onclick="setActiveStep(3)">
                <div class="flex flex-col flex-1">
                  <h2 id="step3-title" class="text-base font-extrabold text-neutral-900 flex items-center gap-2 m-0" style="margin-bottom: 0px !important;">🌊 Step III</h2>
                  <p id="step3-desc" class="text-xs text-neutral-500 m-0 hidden" style="margin-top: 0px !important;">스케치가 실물로 모핑되는 트랜지션 연출 효과</p>
                </div>
              </div>
              <div id="step3-body" class="card-body flex-grow flex flex-col gap-4 hidden">
                <textarea id="prompt-flow" class="w-full p-4 border border-[#DDDBD5] bg-white text-neutral-900 text-sm md:text-base leading-relaxed placeholder-neutral-400 focus:border-brand-500 focus:ring-0 outline-none resize-none font-mono leading-relaxed" style="height: 220px; font-family: 'Pretendard', sans-serif;">시작 이미지의 연필 스케치 선들이 미세하게 떨리며 황금빛 입자로 변하고, 이 입자들이 모여 실물 제품의 정교한 부품으로 조립되는 모핑 효과를 구현해줘.
종이의 질감은 서서히 사라지고 실제 나무 책상의 결이 선명해지며 제품이 완성돼.
카메라 앵글은 고정된 상태에서 아주 천천히 중앙으로 줌인하며 제품의 금속 광택을 강조해줘.

배경음 및 사운드: 영감을 주는 미니멀한 테크 스타일의 앰비언트 배경음악을 깔아줘.</textarea>
                <div class="flex justify-end mt-2">
                  <button onclick="copyPrompt('prompt-flow')" class="px-5 h-11 bg-brand-500 hover:bg-brand-600 text-white text-sm font-extrabold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 focus:outline-none">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <rect x="9" y="9" width="11" height="11" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round"></rect>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    프롬프트 복사
                  </button>
                </div>
              </div>
              <!-- Collapsed Body -->
              <div id="step3-collapsed-body" class="p-4 bg-white flex items-center justify-center flex-grow cursor-pointer select-none" onclick="setActiveStep(3)">
                <span class="text-sm font-bold text-neutral-500">Flow 비디오 프롬프트</span>
              </div>
            </article>

          </section>
        </div>
      </div>
"""
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(before + new_tab_3 + after)
    print('Tab 3 accordion replaced successfully.')
else:
    print('Failed to find markers.')
