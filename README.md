# 연구통계 실험실

응용확률및통계 · 행동연구방법론 · 구조방정식(AMOS) · SPSS · R · MIS 개념 48개를 슬라이더로 직접 조작해 보는 시뮬레이션 학습 사이트.

## 실행

- **더블클릭**: `start.bat` → 브라우저가 `http://localhost:8800` 으로 열립니다.
- **터미널**: `node serve.js` (포트 변경: `PORT=9000 node serve.js`)
- 종료: 서버 창에서 `Ctrl+C`

Node.js만 있으면 되고, 설치할 패키지는 없습니다. 차트 라이브러리(d3)와 글꼴은 CDN에서 받으므로 인터넷 연결이 필요합니다.

## 구조

| 경로 | 내용 |
|---|---|
| `index.html` | 화면 뼈대와 스타일 |
| `js/stats.js` | 통계 엔진 (분포, 검정, 회귀, 행렬, 신뢰도) |
| `js/core.js` | 라우터, 조절판, 차트(Plot), 경로도(Diagram) |
| `js/m/*.js` | 모듈 1개 = 파일 1개 |
| `js/resources.js` | 공개 강의자료 73건 (2026-11-08 접속 확인) |
| `serve.js` | 로컬 서버 |
| `tools/` | 빌드·미리보기·점검 스크립트 |

## 모듈 추가

1. `js/m/<id>.js` 에 `Lab.add({...})` 작성 (`js/m/dist-normal.js` 참고)
2. `node tools/build.js` → `index.html` 에 스크립트 태그 반영
3. `node tools/checkall.js` 후 `.preview/full.html` 을 열어 모든 모듈 오류 점검
