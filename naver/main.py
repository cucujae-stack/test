"""실행 진입점.

    export NAVER_CLIENT_ID=xxxx
    export NAVER_CLIENT_SECRET=yyyy
    python -m naver.main                 # 콘솔 출력
    python -m naver.main --csv out.csv --html out.html
"""
from __future__ import annotations

import argparse
import calendar
import sys
from datetime import date

from .client import NaverAPIError, NaverClient
from .history import fetch_history, write_history_csv
from .rankings import build_rankings, build_rankings_multi
from .report import print_console, write_csv, write_html, write_html_multi


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="네이버 공식 OpenAPI로 실시간 인기 키워드 랭킹 + 대표 상품 정리"
    )
    parser.add_argument("--top", type=int, default=5, help="카테고리별 상위 키워드 수")
    parser.add_argument("--products", type=int, default=5, help="키워드당 대표 상품 수")
    parser.add_argument(
        "--period", default="일간", choices=["일간", "주간", "월간", "전체"],
        help="인기도 기준 기간 (일간/주간/월간, 전체=한 HTML에 토글로 다 담기)",
    )
    parser.add_argument(
        "--days", type=int, default=None,
        help="데이터랩 조회 범위(일). 생략 시 기간에 맞춰 자동(일간14/주간60/월간180)",
    )
    parser.add_argument(
        "--sort", default="sim", choices=["sim", "asc", "dsc", "date"],
        help="상품 정렬 (sim=정확도/대표상품, asc=최저가, dsc=최고가, date=최신)",
    )
    parser.add_argument(
        "--category", metavar="대분류",
        help="특정 대분류만 조회 (예: 패션의류, 패션잡화, 스포츠/레저, 출산/육아). 생략 시 전체",
    )
    parser.add_argument(
        "--month", metavar="YYYY-MM",
        help="과거 특정 월의 인기도 조회 (예: 2025-10). 지정 시 --period/--days 무시하고 "
             "월간 기준으로 그 달만 조회. 상품은 과거 시점 재현이 불가해 항상 현재 상품이 붙음",
    )
    parser.add_argument(
        "--from", dest="from_date", metavar="YYYY-MM-DD",
        help="일별 인기도 시계열 조회 시작일 (예: 2025-01-01). 지정 시 랭킹 대신 "
             "날짜×키워드 인기도 시계열을 CSV 로 뽑는다 (기본 history.csv)",
    )
    parser.add_argument(
        "--to", dest="to_date", metavar="YYYY-MM-DD",
        help="시계열 조회 종료일 (기본: 오늘). --from 과 함께 사용",
    )
    parser.add_argument("--csv", metavar="PATH", help="CSV 저장 경로")
    parser.add_argument("--html", metavar="PATH", help="HTML 대시보드 저장 경로")
    args = parser.parse_args(argv)

    # --from: 일별 인기도 시계열 모드 (랭킹/상품 대신 CSV 시계열)
    if args.from_date:
        try:
            start = date.fromisoformat(args.from_date)
            end = date.fromisoformat(args.to_date) if args.to_date else date.today()
        except ValueError as exc:
            print(f"[입력 오류] 날짜는 YYYY-MM-DD 형식이어야 함 — {exc}", file=sys.stderr)
            return 2
        try:
            client = NaverClient()
            points = fetch_history(client, start, end, category=args.category)
        except NaverAPIError as exc:
            print(f"[API 오류] {exc}", file=sys.stderr)
            return 1
        except ValueError as exc:
            print(f"[입력 오류] {exc}", file=sys.stderr)
            return 2
        out = write_history_csv(points, args.csv or "history.csv")
        days = len({p.day for p in points})
        kws = len({(p.category, p.keyword) for p in points})
        print(f"\n일별 인기도 시계열 저장: {out}")
        print(f"  기간 {start} ~ {end} · 키워드 {kws}개 · 날짜 {days}일 · 총 {len(points):,}행")
        print("  ※ 값은 판매실적이 아니라 카테고리 내 상대 검색 인기도(기간 최대=100)입니다.")
        return 0

    as_of = None
    period_label = args.period
    if args.month:
        try:
            year, mon = (int(x) for x in args.month.split("-"))
            last_day = calendar.monthrange(year, mon)[1]
            as_of = date(year, mon, last_day)
        except (ValueError, IndexError):
            print(f"[입력 오류] --month 는 YYYY-MM 형식이어야 함 (받음: {args.month})", file=sys.stderr)
            return 2
        args.period = "월간"
        period_label = f"{year}년 {mon}월"

    try:
        client = NaverClient()
    except NaverAPIError as exc:
        print(f"[설정 오류] {exc}", file=sys.stderr)
        return 2

    # --period 전체: 일간/주간/월간을 한 HTML에 토글로 담는다
    if args.period == "전체":
        try:
            multi = build_rankings_multi(
                client,
                top_keywords=args.top,
                products_per_keyword=args.products,
                sort=args.sort,
                category=args.category,
            )
        except ValueError as exc:
            print(f"[입력 오류] {exc}", file=sys.stderr)
            return 2
        except NaverAPIError as exc:
            print(f"[API 오류] {exc}", file=sys.stderr)
            return 1

        for p, rk in multi.items():
            print_console(rk, period=p)
        out = args.html or "rankings.html"
        print(f"\nHTML 저장(일간/주간/월간 토글): {write_html_multi(multi, out)}")
        if args.csv:  # CSV 는 일간 기준으로 저장
            print(f"CSV 저장(일간 기준): {write_csv(multi.get('일간', []), args.csv)}")
        return 0

    try:
        rankings = build_rankings(
            client,
            top_keywords=args.top,
            products_per_keyword=args.products,
            period=args.period,
            lookback_days=args.days,
            sort=args.sort,
            category=args.category,
            as_of=as_of,
        )
    except ValueError as exc:
        print(f"[입력 오류] {exc}", file=sys.stderr)
        return 2
    except NaverAPIError as exc:
        print(f"[API 오류] {exc}", file=sys.stderr)
        return 1

    note = (
        f"'{period_label}' 기준 인기도이지만, 상품은 그 시점 재현이 불가해 "
        "현재 판매 중인 상품이 표시됩니다." if as_of else ""
    )
    if note:
        print(f"\n※ {note}", file=sys.stderr)
    print_console(rankings, period=period_label)
    if args.csv:
        print(f"\nCSV 저장: {write_csv(rankings, args.csv)}")
    if args.html:
        print(f"HTML 저장: {write_html(rankings, args.html, period=period_label, note=note)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
