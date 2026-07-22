/**
 * 구글 스프레드시트용 Apps Script 코드 (v3 - 대소문자 구분 없는 비교 지원)
 * 
 * 1. 구글 스프레드시트 하단에 [시트1] 과 [시트2] 라는 이름으로 두 개의 시트 탭을 생성합니다.
 * 2. [시트2]의 A열에는 '20260722' 형태의 날짜 텍스트를 입력하고, B열에는 매핑할 '과정코드'를 미리 적어 둡니다.
 * 3. [시트1]에는 첫 줄 헤더를 적거나 비워 둡니다 (자동으로 오늘날짜, 과정코드, 입장코드가 기록됩니다).
 * 4. 스프레드시트 > 확장 프로그램 > Apps Script 진입 후 아래 코드를 붙여넣습니다 (SPREADSHEET_ID 수정 필수).
 * 5. 배포 > 새 배포 (웹 앱 / 나 / 모든 사용자) 진행 후 생성된 URL을 index.html에 적용합니다.
 */

// 구글 스프레드시트 ID (스프레드시트 주소창의 /d/ 와 /edit 사이의 문자열)
const SPREADSHEET_ID = "18hzAVTjAXrYdT2DRelm3b4IED0KCIFWzaV6fn6dseq0";
const SHEET1_NAME = "시트1";
const SHEET2_NAME = "시트2";

// CORS 대응 응답 생성용 헬퍼 함수
function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// 1. 입장 코드 유효성 검사 (GET 요청 - 대소문자 구분 없이 비교)
function doGet(e) {
  const codeToVerify = e.parameter.code;
  if (!codeToVerify) {
    return createResponse({ success: false, message: "코드를 입력해 주세요." });
  }

  try {
    const sheet1 = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET1_NAME);
    const data = sheet1.getDataRange().getValues();
    
    // 시트1 C열(Index 2)에서 대소문자 구분 없이 기존 입장 코드 탐색
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] && data[i][2].toString().trim().toUpperCase() === codeToVerify.trim().toUpperCase()) {
        return createResponse({ 
          success: true, 
          courseCode: data[i][1] // 매핑된 과정코드 반환
        });
      }
    }
    return createResponse({ success: false, message: "유효하지 않은 입장 코드입니다." });
  } catch (err) {
    return createResponse({ success: false, message: "에러 발생: " + err.toString() });
  }
}

// 2. 신규 입장 코드 생성 및 시트1 기록 (POST 요청 - 대소문자 구분 없이 중복 체크)
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const code = params.code; // 사용자가 입력한 코드
    const todayStr = params.todayStr; // '20260722' 형태의 문자열

    if (!code || !todayStr) {
      return createResponse({ success: false, message: "코드 및 날짜 정보가 누락되었습니다." });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet1 = ss.getSheetByName(SHEET1_NAME);
    const sheet2 = ss.getSheetByName(SHEET2_NAME);

    // [Step 1] 시트2 A열에서 오늘 날짜(todayStr) 매핑 과정코드(B열) 조회
    const sheet2Data = sheet2.getDataRange().getValues();
    let courseCode = "";
    for (let i = 1; i < sheet2Data.length; i++) {
      const rowDate = sheet2Data[i][0].toString().trim();
      if (rowDate === todayStr.trim()) {
        courseCode = sheet2Data[i][1].toString().trim();
        break;
      }
    }

    if (!courseCode) {
      return createResponse({ 
        success: false, 
        message: "오늘 날짜(" + todayStr + ")에 등록된 과정이 '시트2'에 없습니다. 관리자에게 문의하세요." 
      });
    }

    // [Step 2] 시트1 C열 중복 체크 (대소문자 구분 없이)
    const sheet1Data = sheet1.getDataRange().getValues();
    for (let i = 1; i < sheet1Data.length; i++) {
      if (sheet1Data[i][2] && sheet1Data[i][2].toString().trim().toUpperCase() === code.trim().toUpperCase()) {
        return createResponse({ success: false, message: "이미 사용 중인 코드입니다. 다른 코드를 입력해 주세요." });
      }
    }

    // [Step 3] 시트1에 기록 (오늘날짜(YYYY-MM-DD), 과정코드, 입장코드)
    const formattedDate = todayStr.substring(0, 4) + "-" + todayStr.substring(4, 6) + "-" + todayStr.substring(6, 8);
    sheet1.appendRow([formattedDate, courseCode, code]);

    return createResponse({ success: true, code: code, courseCode: courseCode });
  } catch (error) {
    return createResponse({ success: false, message: "에러 발생: " + error.toString() });
  }
}
