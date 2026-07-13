"""랭킹을 뽑을 관심 키워드 정의.

데이터랩 쇼핑인사이트는 '인기 키워드 상위 N개'를 스스로 찾아주지 않는다.
비교할 키워드를 우리가 넣어주면 그들 사이의 상대 인기도만 돌려준다.
그래서 카테고리별 후보 키워드를 미리 정의해두고, 데이터랩으로 최근
인기도를 매겨 '실시간 인기 순위'를 근사한다. 자유롭게 추가/수정하세요.

category_code 는 네이버 데이터랩 카테고리 코드다.
find_category / datalab_shopping_category 로 코드를 찾을 수 있고,
아래 값들은 대분류 대표 코드다.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class CategoryWatch:
    """한 카테고리와, 그 안에서 순위를 다툴 후보 키워드들."""

    name: str
    category_code: str
    keywords: list[str] = field(default_factory=list)


# 대분류 대표 카테고리 코드 (네이버 데이터랩 기준)
WATCHLIST: list[CategoryWatch] = [
    CategoryWatch(
        name="디지털/가전",
        category_code="50000003",
        keywords=[
            "무선 이어폰",
            "노트북",
            "로봇청소기",
            "공기청정기",
            "게이밍 모니터",
            "스마트워치",
            "보조배터리",
            "블루투스 스피커",
        ],
    ),
    CategoryWatch(
        name="패션의류",
        category_code="50000000",
        keywords=[
            "여름 원피스",
            "린넨 셔츠",
            "반팔티",
            "와이드팬츠",
            "샌들",
            "래시가드",
        ],
    ),
    CategoryWatch(
        name="화장품/미용",
        category_code="50000002",
        keywords=[
            "선크림",
            "쿠션",
            "앰플",
            "클렌징오일",
            "틴트",
            "헤어에센스",
        ],
    ),
    CategoryWatch(
        name="식품",
        category_code="50000006",
        keywords=[
            "냉동 삼겹살",
            "밀키트",
            "프로틴",
            "그래놀라",
            "냉면",
            "아이스커피",
        ],
    ),
]
