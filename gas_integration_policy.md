# Google Apps Script & Spreadsheet 연동 정책 정의서 (v1.0)

본 문서는 WORKING AI 워크북 프로젝트와 Google Apps Script(GAS) 및 구글 스프레드시트 간의 연동 규격과 정책을 정의합니다. 향후 유지보수 및 코드 수정 시 본 규격을 반드시 준수해야 합니다.

---

## 1. 개요 및 호출 주소 (GAS Web App)
* **GAS 웹 앱 URL**: `https://script.google.com/macros/s/AKfycbwmedfL4Q8uUhXqKg3xa1yMEfGGUHYjRrRn1wjZN3_n_QcUMqnxmHUi1OMT3oIhZCBtKA/exec`
* **배포 정책**: 코드 수정 후 웹 앱 배포 시 새로 배포(New Deployment)를 생성하지 않고, **[배포 관리]에서 기존 배포를 편집하여 [새 버전]으로 업데이트**하여 기존 URL 링크를 그대로 유지합니다.

---

## 2. 구글 스프레드시트 구조 및 컬럼 매핑

### A. `Access` 시트 (사용자 및 접속 기록 관리)
기존 개인접속코드를 대조하여 기수정보와 PDF 주소를 불러오고, 신규 가입자를 자동 등록하는 메인 시트입니다.
* **A열 (인덱스 0)**: 등록일 (Format: `YYYY-MM-DD`)
* **B열 (인덱스 1)**: 기수코드 (Format: `M2_YYYYMMDD` 또는 개별 지정)
* **C열 (인덱스 2)**: 개인접속코드 (중복 불가)
* **D열 (인덱스 3)**: 이름 또는 가입구분 (기본값: `"자동등록"`)
* **E열 (인덱스 4)**: 개인파일주소 (PDF 뷰어용 개별 매핑 주소)
* **F열 (인덱스 5)**: 개별 Naver Client ID (공란 권장, API 시트 우선)
* **G열 (인덱스 6)**: 개별 Naver Client Secret (공란 권장, API 시트 우선)
* **H열 (인덱스 7)**: 개별 Gemini API Key (공란 권장, API 시트 우선)

### B. `API` 시트 (공통 API 인증 키 관리)
개별 학생별로 인증 키를 다 채워 넣는 번거로움을 피하기 위한 **공통 API 키 설정 시트**입니다.
* **A1, B1, C1**: 헤더 영역 (`Naver Client ID`, `Naver Client Secret`, `Gemini API Key`)
* **A2 (A열 2행)**: 네이버 클라우드 NAVER API HUB **Client ID** 값
* **B2 (B열 2행)**: 네이버 클라우드 NAVER API HUB **Client Secret** 값
* **C2 (C열 2행)**: Google AI Studio **Gemini API Key** 값

### C. `migration` 시트 (리다이렉트 룰 관리)
웹사이트 이전 및 구버전 접속 시 신규 경로로 강제 포워딩하기 위한 룰셋입니다.
* **C열 (인덱스 2)**: before (이전 접속 경로)
* **D열 (인덱스 3)**: re-direct 1 (새로운 매핑 대상 경로)

### D. `file` 시트 (기수별 공통 파일 주소 매핑)
개인파일주소가 공란일 경우, B열의 기수코드에 따라 매핑되는 PDF 파일을 제공하는 시트입니다.
* **A열 (인덱스 0)**: 기수코드 (과정코드)
* **B열 (인덱스 1)**: PDF 파일 주소 (URL)

---

## 3. GAS API 입출력 규격 (API Specs)

### A. GET 요청 (`doGet`)
#### 1) 일반 접속코드 로그인 대조 (`?code=...`)
* **요청 예시**: `GAS_URL?code=WA-123456`
* **동작 흐름**:
  1. `Access` 시트 C열에서 전송받은 코드를 탐색합니다.
  2. 일치하는 코드가 있으면 기수코드(B열), 개인파일주소(E열)를 읽어옵니다.
  3. 동시에 `API` 시트 2행에서 공통 네이버 ID(A2), 시크릿(B2), 제미나이 키(C2)를 추출합니다.
* **반환 JSON**:
  ```json
  {
    "success": true,
    "courseCode": "M2_20260806",
    "fileAddress": "https://example.com/slide.pdf",
    "naverClientId": "ncloud_client_id_value",
    "naverClientSecret": "ncloud_client_secret_value",
    "geminiApiKey": "gemini_api_key_value"
  }
  ```

#### 2) 리다이렉트 룰 조회 (`?action=getRedirects`)
* **요청 예시**: `GAS_URL?action=getRedirects`
* **반환 JSON**:
  ```json
  {
    "rules": [
      { "before": "workshop01/old_page.html", "redirect": "workshop01/01_wamingup.html" }
    ]
  }
  ```

### B. POST 요청 (`doPost`)
#### 신규 접속코드 자동 등록 및 반환
* **요청 데이터 (JSON)**:
  ```json
  {
    "code": "WA-999999",
    "todayStr": "20260806"
  }
  ```
* **동작 흐름**:
  1. `Access` 시트 C열의 중복 여부를 대조합니다.
  2. 중복이 아닐 경우 신규 행을 추가하고, `API` 시트의 공통 키 값들과 매핑하여 결과를 반환합니다.
* **반환 JSON**:
  (GET 요청 성공 응답과 포맷이 동일함)

---

## 4. 클라이언트 연동 정책 (HTML / JavaScript)
1. **로그인 연동**:
   * 사용자가 `index.html`에서 로그인 성공 시, GAS로부터 전달받은 `naverClientId`, `naverClientSecret`, `geminiApiKey`를 브라우저 `localStorage`에 각각 `naver_client_id`, `naver_client_secret`, `gemini_api_key`로 저장합니다.
2. **실습 페이지 자동 완성 (`03_apps_scrpt.html`)**:
   * 페이지 로드 시 `document.readyState`를 검사하여 `localStorage`에 담겨 있는 인증 키를 `ncloudId`, `ncloudSecret`, `geminiApiKey` 인풋 칸에 실시간 자동 입력 처리합니다.
3. **실시간 GAS 강제 조회 동기화**:
   * 로컬 스토리지에 데이터가 유실되었거나 없을 경우, 사용자가 인풋 창 옆의 "입력" 버튼을 클릭하고 마스터 패스워드(`workingai`)를 통과하면 즉시 GAS API를 백그라운드 호출(`fetch`)하여 키 값을 다시 동기화하여 채워 줍니다.
