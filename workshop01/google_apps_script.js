/**
 * 구글 스프레드시트용 Apps Script 코드 (v4 - 변경된 시트 구조 및 파일 매핑 추가)
 * 
 * 1. 구글 스프레드시트 하단에 [Access], [classcode], [file] 이라는 이름으로 탭을 만듭니다.
 * 2. [classcode]의 A열에는 '20260722' 형태의 날짜 텍스트를 입력하고, B열에는 매핑할 '과정코드'를 미리 적어 둡니다.
 * 3. [file]의 A열에는 '과정코드', B열에는 연결할 'PDF 주소(URL)'를 미리 적어 둡니다.
 * 4. [Access]에는 헤더만 적어 둡니다 (자동으로 오늘날짜, 과정코드, 개인접속코드가 기록됩니다).
 * 5. 스프레드시트 > 확장 프로그램 > Apps Script 진입 후 아래 코드를 붙여넣습니다 (SPREADSHEET_ID 수정 필수).
 * 6. 배포 > 새 배포 (웹 앱 / 나 / 모든 사용자) 진행 후 생성된 URL을 index.html에 적용합니다.
 */

// 구글 스프레드시트 ID (스프레드시트 주소창의 /d/ 와 /edit 사이의 문자열)
const SPREADSHEET_ID = "18hzAVTjAXrYdT2DRelm3b4IED0KCIFWzaV6fn6dseq0";
const ACCESS_SHEET_NAME = "Access";
const CLASS_CODE_SHEET_NAME = "classcode";
const FILE_SHEET_NAME = "file";

// CORS 대응 응답 생성용 헬퍼 함수
function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// 1. 개인접속코드 유효성 검사 (GET 요청)
function doGet(e) {
  const codeToVerify = e.parameter.code;
  if (!codeToVerify) {
    return createResponse({ success: false, message: "코드를 입력해 주세요." });
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const accessSheet = ss.getSheetByName(ACCESS_SHEET_NAME);
    const fileSheet = ss.getSheetByName(FILE_SHEET_NAME);
    
    const accessData = accessSheet.getDataRange().getValues();
    
    // Access 시트 C열(Index 2)에서 대소문자 구분 없이 기존 개인접속코드 탐색
    let courseCode = "";
    for (let i = 1; i < accessData.length; i++) {
      if (accessData[i][2] && accessData[i][2].toString().trim().toUpperCase() === codeToVerify.trim().toUpperCase()) {
        courseCode = accessData[i][1].toString().trim();
        break;
      }
    }
    
    if (!courseCode) {
      return createResponse({ success: false, message: "유효하지 않은 개인접속코드입니다." });
    }

    // file 시트에서 과정코드에 대응하는 파일 주소(PDF 링크) 조회
    let fileAddress = "";
    if (fileSheet) {
      const fileData = fileSheet.getDataRange().getValues();
      for (let i = 1; i < fileData.length; i++) {
        if (fileData[i][0] && fileData[i][0].toString().trim() === courseCode) {
          fileAddress = fileData[i][1].toString().trim();
          break;
        }
      }
    }

    return createResponse({ 
      success: true, 
      courseCode: courseCode,
      fileAddress: fileAddress
    });

  } catch (err) {
    return createResponse({ success: false, message: "에러 발생: " + err.toString() });
  }
}

// 2. 신규 개인접속코드 등록 및 Access 기록 (POST 요청)
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const code = params.code; // 사용자가 직접 지정한 코드
    const todayStr = params.todayStr; // '20260722' 형태의 문자열

    if (!code || !todayStr) {
      return createResponse({ success: false, message: "코드 및 날짜 정보가 누락되었습니다." });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const accessSheet = ss.getSheetByName(ACCESS_SHEET_NAME);
    const classcodeSheet = ss.getSheetByName(CLASS_CODE_SHEET_NAME);
    const fileSheet = ss.getSheetByName(FILE_SHEET_NAME);

    // [Step 1] classcode 시트 A열에서 오늘 날짜 매핑 과정코드(B열) 조회
    const classcodeData = classcodeSheet.getDataRange().getValues();
    let courseCode = "";
    for (let i = 1; i < classcodeData.length; i++) {
      const rowDate = classcodeData[i][0].toString().trim();
      if (rowDate === todayStr.trim()) {
        courseCode = classcodeData[i][1].toString().trim();
        break;
      }
    }

    if (!courseCode) {
      return createResponse({ 
        success: false, 
        message: "오늘 날짜(" + todayStr + ")에 등록된 과정이 'classcode' 시트에 없습니다. 관리자에게 문의하세요." 
      });
    }

    // [Step 2] Access 시트 C열 중복 체크 (대소문자 구분 없이)
    const accessData = accessSheet.getDataRange().getValues();
    for (let i = 1; i < accessData.length; i++) {
      if (accessData[i][2] && accessData[i][2].toString().trim().toUpperCase() === code.trim().toUpperCase()) {
        return createResponse({ success: false, message: "이미 사용 중인 코드입니다. 다른 코드를 입력해 주세요." });
      }
    }

    // [Step 3] Access 시트에 기록 (오늘날짜(YYYY-MM-DD), 과정코드, 개인접속코드)
    const formattedDate = todayStr.substring(0, 4) + "-" + todayStr.substring(4, 6) + "-" + todayStr.substring(6, 8);
    accessSheet.appendRow([formattedDate, courseCode, code]);

    // [Step 4] file 시트에서 파일 주소(PDF 링크) 조회
    let fileAddress = "";
    if (fileSheet) {
      const fileData = fileSheet.getDataRange().getValues();
      for (let i = 1; i < fileData.length; i++) {
        if (fileData[i][0] && fileData[i][0].toString().trim() === courseCode) {
          fileAddress = fileData[i][1].toString().trim();
          break;
        }
      }
    }

    return createResponse({ 
      success: true, 
      code: code, 
      courseCode: courseCode,
      fileAddress: fileAddress
    });

  } catch (error) {
    return createResponse({ success: false, message: "에러 발생: " + error.toString() });
  }
}
