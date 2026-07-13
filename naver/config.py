"""랭킹을 뽑을 관심 카테고리 / 키워드 정의.

데이터랩 쇼핑인사이트는 '인기 키워드 상위 N개'를 스스로 찾아주지 않는다.
비교할 키워드를 우리가 넣어주면 그들 사이의 상대 인기도만 돌려준다.
그래서 카테고리별 후보 키워드를 미리 정의해두고, 데이터랩으로 최근
인기도를 매겨 '실시간 인기 순위'를 근사한다. 자유롭게 추가/수정하세요.

category_code 는 네이버 데이터랩 카테고리 코드다. 아래는 검증된 대분류 코드:

    50000000 패션의류      50000001 패션잡화     50000002 화장품/미용
    50000003 디지털/가전   50000004 가구/인테리어 50000005 출산/육아
    50000006 식품          50000007 스포츠/레저   50000008 생활/건강

중분류(남성의류 등) 코드는 별도이며 여기선 정확 검증이 어려워, 세부
카테고리는 '이름/키워드'로만 구분하고 인기도 측정은 상위 코드(패션의류
50000000)로 스코핑한다. 중분류 단위로 정밀 스코핑하려면 각 항목의
category_code 만 실제 중분류 코드로 바꿔 끼우면 된다.
"""
from __future__ import annotations

from dataclasses import dataclass, field

# 패션의류 대분류 코드 — 세부 카테고리들이 공유(인기도 측정 스코프)
FASHION = "50000000"


@dataclass(frozen=True)
class CategoryWatch:
    """한 (세부)카테고리와, 그 안에서 순위를 다툴 후보 키워드들."""

    name: str
    category_code: str
    keywords: list[str] = field(default_factory=list)


WATCHLIST: list[CategoryWatch] = [
    # --- 패션의류: 세부 카테고리별 ---
    CategoryWatch(
        name="패션의류 · 남성의류",
        category_code=FASHION,
        keywords=[
            "반팔티",
            "반바지",
            "카고팬츠",
            "린넨 셔츠",
            "피케 셔츠",
            "나일론 팬츠",
        ],
    ),
    CategoryWatch(
        name="패션의류 · 여성의류",
        category_code=FASHION,
        keywords=[
            "여름 원피스",
            "롱 원피스",
            "블라우스",
            "와이드 팬츠",
            "롱 스커트",
            "크롭티",
        ],
    ),
    CategoryWatch(
        name="패션의류 · 여성언더웨어/잠옷",
        category_code=FASHION,
        keywords=[
            "브라렛",
            "노와이어 브라",
            "여성 잠옷",
            "여성 파자마",
            "심리스 팬티",
            "홈웨어",
        ],
    ),
    CategoryWatch(
        name="패션의류 · 남성언더웨어/잠옷",
        category_code=FASHION,
        keywords=[
            "남성 드로즈",
            "남성 트렁크",
            "남성 잠옷",
            "남성 런닝",
            "남성 파자마",
        ],
    ),
    # --- 패션잡화 ---
    CategoryWatch(
        name="패션잡화",
        category_code="50000001",
        keywords=[
            "크로스백",
            "슬링백",
            "선글라스",
            "볼캡",
            "샌들",
            "스니커즈",
        ],
    ),
    # --- 스포츠/레저 ---
    CategoryWatch(
        name="스포츠/레저",
        category_code="50000007",
        keywords=[
            "요가매트",
            "등산화",
            "골프공",
            "자전거",
            "텐트",
            "아령",
        ],
    ),
    # --- 출산/육아 ---
    CategoryWatch(
        name="출산/육아",
        category_code="50000005",
        keywords=[
            "기저귀",
            "분유",
            "젖병",
            "유모차",
            "아기 물티슈",
            "카시트",
        ],
    ),
]
