# 네이버 쇼핑 실시간 인기 랭킹 (근사)

네이버플러스스토어의 **실시간 행사 랭킹 / 실시간 베스트**를, 공식 네이버
OpenAPI만으로 최대한 근사해서 정리해주는 도구입니다.

## 왜 "근사"인가

네이버플러스스토어 앱에 뜨는 실시간 베스트는 **공식 공개 API가 없습니다.**
앱 내부 비공개 엔드포인트로 그려지며, 그걸 긁는 건 이용약관 위반 소지가
있고 자주 깨집니다. 그래서 공식으로 열려 있는 두 API만 조합합니다.

| API | 쓰임 |
|---|---|
| 쇼핑 검색 (`/v1/search/shop.json`) | 키워드별 상품·최저가·판매처 |
| 데이터랩 쇼핑인사이트 (`/v1/datalab/shopping/...`) | 키워드 인기도 추이 |

동작 방식:

1. `config.py`의 카테고리별 후보 키워드를 **데이터랩 최근 인기도**로 줄세워
   → *실시간 인기 키워드 랭킹*
2. 상위 키워드마다 **쇼핑 검색 최저가순**으로 대표 상품을 붙여
   → *행사 랭킹템(대표 상품)*

> ⚠️ 데이터랩은 약 1일 지연이 있고, 인기도(ratio)는 질의한 키워드 집합 안에서의
> 상대값(최대 100)입니다. 절대 판매량이 아니라 "최근 검색·소비 인기도"입니다.
> 앱의 그 순위 그대로는 아닙니다.

## 설정

1. https://developers.naver.com 에서 애플리케이션 등록 → **검색**과
   **데이터랩(쇼핑인사이트)** API 사용 추가 → Client ID / Secret 발급
2. 환경변수 설정:

```bash
export NAVER_CLIENT_ID=xxxx
export NAVER_CLIENT_SECRET=yyyy
pip install -r ../requirements.txt
```

## 실행

```bash
# 콘솔 출력
python -m naver.main

# CSV + HTML 대시보드로 저장
python -m naver.main --csv rankings.csv --html rankings.html

# 주간 기준 인기도로, 패션잡화만 뽑기
python -m naver.main --period 주간 --category 패션잡화 --html jabhwa.html

# 카테고리별 상위 3개 키워드, 키워드당 상품 8개
python -m naver.main --top 3 --products 8
```

| 옵션 | 기본 | 설명 |
|---|---|---|
| `--period` | 일간 | 인기도 기준 기간 (일간/주간/월간) |
| `--category` | (전체) | 특정 대분류만 조회 (예: 패션의류, 패션잡화, 스포츠/레저, 출산/육아) |
| `--top` | 5 | 카테고리별 상위 키워드 수 |
| `--products` | 5 | 키워드당 대표 상품 수 |
| `--days` | 자동 | 데이터랩 조회 범위(일). 생략 시 기간별 자동(일간14/주간60/월간180) |
| `--sort` | sim | 상품 정렬 (sim=정확도/대표상품, asc=최저가, dsc=최고가, date=최신) |
| `--csv` / `--html` | - | 결과 저장 경로 |

HTML 대시보드는 상단 **대분류 → 중분류 탭**으로 원하는 부분만 걸러 볼 수 있습니다.

## 관심 키워드 바꾸기

`naver/config.py`의 `WATCHLIST`를 수정하세요. 카테고리와, 그 안에서 순위를
다툴 후보 키워드를 넣으면 됩니다.

## 매일 자동 업데이트 (GitHub Pages)

`.github/workflows/naver-rankings.yml` 이 매일 대시보드를 만들어 GitHub
Pages 로 배포합니다. URL 하나만 즐겨찾기 해두면 늘 최신입니다.

**설정(최초 1회):**

1. 레포 **Settings → Secrets and variables → Actions → New repository secret**
   에서 두 개 등록:
   | Secret | 값 |
   |---|---|
   | `NAVER_CLIENT_ID` | 발급받은 Client ID |
   | `NAVER_CLIENT_SECRET` | 발급받은 Client Secret |
2. **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions**
   로 설정.
3. **Actions 탭 → "네이버 쇼핑 랭킹" → Run workflow** 로 한 번 수동 실행하면
   `https://<계정>.github.io/<레포>/` 에 대시보드가 뜹니다.

이후 매일 KST 09:00 에 자동 갱신됩니다.

> ⚠️ GitHub 의 `schedule` 은 **기본 브랜치**에 있을 때만 자동 실행됩니다.
> 워크플로우가 기본 브랜치에 병합되기 전에는 **수동 실행(Run workflow)** 으로만
> 동작하고, 병합 후부터 매일 자동 실행됩니다.
