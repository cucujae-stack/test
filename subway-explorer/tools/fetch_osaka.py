#!/usr/bin/env python3
"""오사카부를 지나는 철도 노선 데이터를 station_database에서 받아 data/osaka/에 저장한다.

출처: https://github.com/Seo-4d696b75/station_database (駅データ.jp 기반, 駅メモ 기준으로 계속 갱신)
역 이름·읽기(가나)·좌표·노선별 역 순서·노선색을 쓰며, 크기를 줄이려고 필요한 필드만 남긴다.

사용법:  python3 tools/fetch_osaka.py
"""
import json, sys, urllib.request
from pathlib import Path

BASE = "https://raw.githubusercontent.com/Seo-4d696b75/station_database/HEAD"
OUT = Path(__file__).resolve().parent.parent / "data" / "osaka"
SKIP = {1002, 1003}            # 도카이도·산요 신칸센은 넣지 않는다
KEEP = ("code", "name", "name_kana", "lat", "lng", "prefecture", "lines", "numbering", "open_date")

def get(path):
    with urllib.request.urlopen(f"{BASE}/{path}", timeout=60) as r:
        return json.load(r)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    info = get("latest_info.json")
    stations = get("out/main/station.json")
    codes = sorted({c for s in stations if s.get("prefecture") == 27 and not s.get("closed") for c in s["lines"]} - SKIP)
    lines = []
    for code in codes:
        d = get(f"out/main/line/{code}.json")
        lines.append({
            "code": d["code"], "name": d["name"], "name_kana": d.get("name_kana"), "color": d.get("color"),
            "symbol": d.get("symbol"), "company_code": d.get("company_code"),
            "stations": [{k: s[k] for k in KEEP if k in s} for s in d["station_list"] if not s.get("closed")],
        })
        print(code, d["name"], len(lines[-1]["stations"]))
    out = {"source": "Seo-4d696b75/station_database", "version": info.get("version"), "lines": lines}
    (OUT / "lines.json").write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"노선 {len(lines)}개 저장 (데이터 버전 {info.get('version')})")

if __name__ == "__main__":
    main()
