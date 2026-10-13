// =========================================================================
// Google Apps Script (GAS) 전체 통합 코드
// 구글 앱스 스크립트(Code.gs) 전체 내용에 복사해서 붙여넣으시면 됩니다.
// 기존 모든 기능(로그인 대조, 신규 등록, 리다이렉트 룰, webapp URL) 포함
// =========================================================================

// 1. doGet: GET 요청 처리 (Access 시트 대조 / 리다이렉트 룰 / webapp URL 조회)
function doGet(e) {
  e = e || { parameter: {} };
  const action = e.parameter.action;

  // 1-A. migration 리다이렉트 룰 조회 분기 (?action=getRedirects)
  if (action === 'getRedirects') {
    return getRedirectRules();
  }

  // 1-B. webapp 시트 A1 하단 URL 조회 분기 (?action=getWebappUrl)
  if (action === 'getWebappUrl') {
    return getWebappUrl();
  }

  // 1-C. 일반 로그인 코드 조회 (Access 시트 대조: ?code=...)
  const code = e.parameter.code;
  if (!code) {
    return createJsonResponse({ success: false, message: "접속코드가 누락되었습니다." });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Access'); // 사용자 권한 정보 시트
    if (!sheet) {
      return createJsonResponse({ success: false, message: "'Access' 시트를 찾을 수 없습니다." });
    }

    const data = sheet.getDataRange().getValues();

    // 1행 헤더 제외, 2행부터 순회
    for (let i = 1; i < data.length; i++) {
      // C열: 개인접속코드 (3번째 열, 인덱스 2)
      const dbCode = String(data[i][2] || '').trim(); 
      if (dbCode === code) {
        const courseCode = String(data[i][1] || '').trim();      // B열: 기수코드 (인덱스 1)
        let fileAddress = String(data[i][4] || '').trim();     // E열: 개인파일주소 (인덱스 4)
        let naverClientId = String(data[i][5] || '').trim();   // F열: Naver Client ID (인덱스 5)
        let naverClientSecret = String(data[i][6] || '').trim(); // G열: Naver Client Secret (인덱스 6)
        let geminiApiKey = String(data[i][7] || '').trim();     // H열: Gemini API Key (인덱스 7)

        // API 시트에서 공통 키 폴백 조회 (Access 시트에 개별 키가 비어있는 경우)
        const apiSheet = ss.getSheetByName('API');
        if (apiSheet) {
          const apiData = apiSheet.getDataRange().getValues();
          if (apiData.length > 1) {
            if (!naverClientId) naverClientId = String(apiData[1][0] || '').trim();     // A2: Naver Client ID
            if (!naverClientSecret) naverClientSecret = String(apiData[1][1] || '').trim(); // B2: Naver Client Secret
            if (!geminiApiKey) geminiApiKey = String(apiData[1][2] || '').trim();       // C2: Gemini API Key
          }
        }

        // file 시트에서 공통 파일 주소 폴백 조회 (개인파일주소가 비어있는 경우)
        if (!fileAddress) {
          const fileSheet = ss.getSheetByName('file');
          if (fileSheet) {
            const fileData = fileSheet.getDataRange().getValues();
            for (let f = 1; f < fileData.length; f++) {
              if (String(fileData[f][0] || '').trim() === courseCode) {
                fileAddress = String(fileData[f][1] || '').trim();
                break;
              }
            }
          }
        }

        return createJsonResponse({
          success: true,
          courseCode: courseCode,
          fileAddress: fileAddress,
          naverClientId: naverClientId,
          naverClientSecret: naverClientSecret,
          geminiApiKey: geminiApiKey
        });
      }
    }

    return createJsonResponse({ success: false, message: "유효하지 않은 개인접속코드입니다." });

  } catch (err) {
    return createJsonResponse({ success: false, message: "서버 오류: " + err.message });
  }
}

// 2. doPost: POST 요청 처리 (신규 접속코드 자동 등록 - Access 시트 기준)
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, message: "POST 데이터가 누락되었습니다." });
    }

    const postData = JSON.parse(e.postData.contents);
    const code = String(postData.code || '').trim();
    const todayStr = String(postData.todayStr || '').trim(); // yyyymmdd 형식

    if (!code) {
      return createJsonResponse({ success: false, message: "코드가 누락되었습니다." });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Access');
    if (!sheet) {
      return createJsonResponse({ success: false, message: "'Access' 시트를 찾을 수 없습니다." });
    }

    const data = sheet.getDataRange().getValues();

    // 중복 체크 (C열: 개인접속코드 기준)
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][2] || '').trim() === code) {
        return createJsonResponse({ success: false, message: "이미 사용 중인 코드입니다. 다른 코드를 입력해 주세요." });
      }
    }

    // 기본 설정값 (Access 시트 구조에 배치)
    const todayFormatted = todayStr.length === 8 
      ? todayStr.substring(0,4) + "-" + todayStr.substring(4,6) + "-" + todayStr.substring(6,8)
      : todayStr;
    
    // classcode 시트에서 날짜 매칭 과정 코드 조회
    let baseCourseCode = "M2_" + todayStr;
    const classcodeSheet = ss.getSheetByName('classcode');
    if (classcodeSheet) {
      const ccData = classcodeSheet.getDataRange().getDisplayValues();
      const targetDateStr = todayStr; // "YYYYMMDD"
      
      for (let i = 1; i < ccData.length; i++) {
        let rowDateVal = String(ccData[i][0] || '').trim(); // A열: 날짜 (화면 표시 값)
        if (!rowDateVal) continue;
        
        // 날짜 형식 파싱 규칙 (2026-08-07, 2026. 08. 07, 2026/8/7 등 다양한 포맷 지원)
        let rowDateStr = "";
        const dateMatch = rowDateVal.match(/(\d{4})[^\d](\d{1,2})[^\d](\d{1,2})/);
        if (dateMatch) {
          const y = dateMatch[1];
          const m = dateMatch[2].padStart(2, '0');
          const d = dateMatch[3].padStart(2, '0');
          rowDateStr = `${y}${m}${d}`;
        } else {
          rowDateStr = rowDateVal.replace(/\D/g, '').trim();
        }
        
        if (rowDateStr === targetDateStr) {
          const codeVal = String(ccData[i][1] || '').trim(); // B열: 과정 코드
          if (codeVal) {
            baseCourseCode = codeVal;
            break;
          }
        }
      }
    }

    // API 시트에서 공통 키 조회
    let baseNaverClientId = "";
    let baseNaverClientSecret = "";
    let baseGeminiApiKey = "";
    const apiSheet = ss.getSheetByName('API');
    if (apiSheet) {
      const apiData = apiSheet.getDataRange().getValues();
      if (apiData.length > 1) {
        baseNaverClientId = String(apiData[1][0] || '').trim();     // A2
        baseNaverClientSecret = String(apiData[1][1] || '').trim(); // B2
        baseGeminiApiKey = String(apiData[1][2] || '').trim();       // C2
      }
    }

    // file 시트에서 공통 파일 주소 조회
    let baseFileAddress = "";
    const fileSheet = ss.getSheetByName('file');
    if (fileSheet) {
      const fileData = fileSheet.getDataRange().getValues();
      for (let f = 1; f < fileData.length; f++) {
        if (String(fileData[f][0] || '').trim() === baseCourseCode) {
          baseFileAddress = String(fileData[f][1] || '').trim();
          break;
        }
      }
    }

    // 신규 행 추가 (Access 시트의 컬럼 배치에 정렬)
    sheet.appendRow([
      todayFormatted,        // A열: 등록일
      baseCourseCode,        // B열: 기수코드
      code,                  // C열: 개인접속코드
      "자동등록",             // D열: 이름
      baseFileAddress,       // E열: 개인파일주소
      baseNaverClientId,     // F열: Naver Client ID
      baseNaverClientSecret, // G열: Naver Client Secret
      baseGeminiApiKey       // H열: Gemini API Key
    ]);

    return createJsonResponse({
      success: true,
      courseCode: baseCourseCode,
      fileAddress: baseFileAddress,
      naverClientId: baseNaverClientId,
      naverClientSecret: baseNaverClientSecret,
      geminiApiKey: baseGeminiApiKey
    });

  } catch (err) {
    return createJsonResponse({ success: false, message: "등록 실패: " + err.message });
  }
}

// 3. getRedirectRules: migration 시트의 C, D열 매핑 규칙 반환
function getRedirectRules() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('migration');
    
    if (!sheet) {
      return createJsonResponse({ rules: [], message: "'migration' 시트를 찾을 수 없습니다." });
    }
    
    const data = sheet.getDataRange().getValues();
    const rules = [];
    
    // 1행은 헤더(before, re-direct 1)이므로 2행부터 가져옴
    for (let i = 1; i < data.length; i++) {
      const before = String(data[i][2] || '').trim();   // C열: before
      const redirect = String(data[i][3] || '').trim();  // D열: re-direct 1
      if (before && redirect) {
        rules.push({ before: before, redirect: redirect });
      }
    }
    
    return createJsonResponse({ rules: rules });
      
  } catch (err) {
    return createJsonResponse({ rules: [], error: err.message });
  }
}

// 4. getWebappUrl: webapp 시트에서 URL 컬럼의 하단 첫번째 값을 추출해 반환
function getWebappUrl() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('webapp');
    if (!sheet) {
      return createJsonResponse({ success: false, message: "'webapp' 시트를 찾을 수 없습니다." });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return createJsonResponse({ success: false, message: "시트에 데이터가 없습니다." });
    }
    
    // 첫번째 행(헤더)에서 "URL" 열 인덱스 찾기
    const headers = data[0];
    const urlColIdx = headers.indexOf("URL");
    if (urlColIdx === -1) {
      return createJsonResponse({ success: false, message: "URL 열을 찾을 수 없습니다." });
    }
    
    // 두번째 행(첫 데이터)에서 URL 가져오기
    const targetUrl = String(data[1][urlColIdx] || '').trim();
    return createJsonResponse({ success: true, url: targetUrl });
  } catch (err) {
    return createJsonResponse({ success: false, message: err.message });
  }
}

// 공통 헬퍼: CORS 및 JSON 응답 생성
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
