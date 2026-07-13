"""랭킹 결과를 콘솔 / CSV / HTML 로 출력."""
from __future__ import annotations

import csv
import html
from datetime import datetime, timezone, timedelta
from pathlib import Path

from .rankings import KeywordRank

KST = timezone(timedelta(hours=9))


def _now() -> str:
    return datetime.now(KST).strftime("%Y-%m-%d %H:%M KST")


def print_console(rankings: list[KeywordRank]) -> None:
    """터미널에 보기 좋게 출력."""
    print(f"\n네이버 쇼핑 실시간 인기 랭킹 (근사) — {_now()}\n" + "=" * 52)
    current_cat = None
    for row in rankings:
        if row.category != current_cat:
            current_cat = row.category
            print(f"\n[{row.category}]")
        print(f"  {row.rank}. {row.keyword}  (인기도 {row.score})")
        for p in row.products:
            price = f"{p.lprice:,}원" if p.lprice else "가격문의"
            mall = f" @{p.mall_name}" if p.mall_name else ""
            print(f"       - {p.title[:40]}  {price}{mall}")


def write_csv(rankings: list[KeywordRank], path: str | Path) -> Path:
    """행 = (카테고리, 키워드, 순위, 인기도, 상품명, 최저가, 판매처, 링크)."""
    path = Path(path)
    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(
            ["카테고리", "키워드", "키워드순위", "인기도", "상품명", "최저가", "판매처", "링크"]
        )
        for row in rankings:
            if not row.products:
                writer.writerow([row.category, row.keyword, row.rank, row.score, "", "", "", ""])
            for p in row.products:
                writer.writerow(
                    [row.category, row.keyword, row.rank, row.score,
                     p.title, p.lprice, p.mall_name, p.link]
                )
    return path


def write_html(rankings: list[KeywordRank], path: str | Path) -> Path:
    """간단한 카드형 대시보드 HTML."""
    path = Path(path)
    cats: dict[str, list[KeywordRank]] = {}
    for row in rankings:
        cats.setdefault(row.category, []).append(row)

    parts: list[str] = [
        "<!doctype html><meta charset='utf-8'>",
        "<title>네이버 쇼핑 실시간 인기 랭킹</title>",
        "<style>",
        "body{font-family:system-ui,sans-serif;margin:24px;background:#0b1020;color:#e8ecf5}",
        "h1{font-size:20px} h2{margin-top:28px;color:#7cc4ff}",
        ".kw{margin:12px 0;padding:12px 14px;background:#161d34;border-radius:10px}",
        ".kw b{color:#ffd479} .score{color:#8fa3c8;font-size:12px}",
        "ul{margin:8px 0 0;padding-left:18px} li{margin:3px 0;font-size:14px}",
        ".price{color:#7dffa0;font-weight:600} .mall{color:#8fa3c8;font-size:12px}",
        "a{color:inherit;text-decoration:none}",
        "</style>",
        f"<h1>네이버 쇼핑 실시간 인기 랭킹 (근사)</h1><div class='score'>{_now()} · 공식 OpenAPI 기반</div>",
    ]
    for cat, rows in cats.items():
        parts.append(f"<h2>{html.escape(cat)}</h2>")
        for row in rows:
            parts.append(
                f"<div class='kw'><b>{row.rank}. {html.escape(row.keyword)}</b> "
                f"<span class='score'>인기도 {row.score}</span><ul>"
            )
            for p in row.products:
                price = f"{p.lprice:,}원" if p.lprice else "가격문의"
                parts.append(
                    f"<li><a href='{html.escape(p.link)}' target='_blank'>"
                    f"{html.escape(p.title[:50])}</a> "
                    f"<span class='price'>{price}</span> "
                    f"<span class='mall'>{html.escape(p.mall_name)}</span></li>"
                )
            parts.append("</ul></div>")
    path.write_text("\n".join(parts), encoding="utf-8")
    return path
