#!/usr/bin/env python3
"""서울(수도권) 지하철 노선 데이터를 만들어 index.html에 끼워 넣는다.

- 역 순서: 아래 LINES에 노선별로 직접 적어 둔 운행 순서 (지선은 구간을 나눠서 적는다)
- 역 좌표: data/seoul_station_master.json (서울 열린데이터광장 '서울시 역사마스터 정보')

사용법:  python3 tools/build_seoul.py          # 검사 후 index.html 갱신
         python3 tools/build_seoul.py --check  # 검사만
"""
import json, math, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "data" / "seoul_station_master.json"
HTML = ROOT / "index.html"

def S(text):
    return text.split()

# 노선: id, 이름, 짧은 표시, 색, 좌표를 찾을 때 우선할 원본 노선(ROUTE), 구간 목록
# 구간의 마지막 역이 첫 역과 같으면 순환 구간이다.
# 같은 이름의 서로 다른 역은 '이름#구분'으로 적는다 (화면에는 # 앞만 보인다).
LINES = [
  dict(id="1", name="1호선", short="1", color="#0052A4",
       routes=["1호선", "경부선", "경원선", "경인선", "장항선"],
       segs=[
         S("연천 전곡 청산 소요산 동두천 보산 동두천중앙 지행 덕정 덕계 양주 녹양 가능 의정부 회룡 망월사 도봉산 도봉 방학 창동 녹천 월계 광운대 석계 신이문 외대앞 회기 청량리 제기동 신설동 동묘앞 동대문 종로5가 종로3가 종각 시청 서울역 남영 용산 노량진 대방 신길 영등포 신도림 구로"),
         S("구로 구일 개봉 오류동 온수 역곡 소사 부천 중동 송내 부개 부평 백운 동암 간석 주안 도화 제물포 도원 동인천 인천"),
         S("구로 가산디지털단지 독산 금천구청 석수 관악 안양 명학 금정 군포 당정 의왕 성균관대 화서 수원 세류 병점 세마 오산대 오산 진위 송탄 서정리 지제 평택 성환 직산 두정 천안 봉명 쌍용 아산 탕정 배방 온양온천 신창"),
         S("금천구청 광명"),
         S("병점 서동탄"),
       ]),
  dict(id="2", name="2호선", short="2", color="#00A84D", routes=["2호선"],
       segs=[
         S("시청 을지로입구 을지로3가 을지로4가 동대문역사문화공원 신당 상왕십리 왕십리 한양대 뚝섬 성수 건대입구 구의 강변 잠실나루 잠실 잠실새내 종합운동장 삼성 선릉 역삼 강남 교대 서초 방배 사당 낙성대 서울대입구 봉천 신림 신대방 구로디지털단지 대림 신도림 문래 영등포구청 당산 합정 홍대입구 신촌 이대 아현 충정로 시청"),
         S("성수 용답 신답 용두 신설동"),
         S("신도림 도림천 양천구청 신정네거리 까치산"),
       ]),
  dict(id="3", name="3호선", short="3", color="#EF7C1C", routes=["3호선", "일산선"],
       segs=[S("대화 주엽 정발산 마두 백석 대곡 화정 원당 원흥 삼송 지축 구파발 연신내 불광 녹번 홍제 무악재 독립문 경복궁 안국 종로3가 을지로3가 충무로 동대입구 약수 금호 옥수 압구정 신사 잠원 고속터미널 교대 남부터미널 양재 매봉 도곡 대치 학여울 대청 일원 수서 가락시장 경찰병원 오금")]),
  dict(id="4", name="4호선", short="4", color="#00A5DE", routes=["4호선", "진접선", "과천선", "안산선"],
       segs=[S("진접 오남 별내별가람 불암산 상계 노원 창동 쌍문 수유 미아 미아사거리 길음 성신여대입구 한성대입구 혜화 동대문 동대문역사문화공원 충무로 명동 회현 서울역 숙대입구 삼각지 신용산 이촌 동작 총신대입구(이수) 사당 남태령 선바위 경마공원 대공원 과천 정부과천청사 인덕원 평촌 범계 금정 산본 수리산 대야미 반월 상록수 한대앞 중앙 고잔 초지 안산 신길온천 정왕 오이도")]),
  dict(id="5", name="5호선", short="5", color="#996CAC", routes=["5호선"],
       segs=[
         S("방화 개화산 김포공항 송정 마곡 발산 우장산 화곡 까치산 신정 목동 오목교 양평 영등포구청 영등포시장 신길 여의도 여의나루 마포 공덕 애오개 충정로 서대문 광화문 종로3가 을지로4가 동대문역사문화공원 청구 신금호 행당 왕십리 마장 답십리 장한평 군자 아차산 광나루 천호 강동"),
         S("강동 길동 굽은다리 명일 고덕 상일동 강일 미사 하남풍산 하남시청 하남검단산"),
         S("강동 둔촌동 올림픽공원 방이 오금 개롱 거여 마천"),
       ]),
  dict(id="6", name="6호선", short="6", color="#CD7C2F", routes=["6호선"],
       segs=[
         S("응암 역촌 불광 독바위 연신내 구산 응암"),
         S("응암 새절 증산 디지털미디어시티 월드컵경기장 마포구청 망원 합정 상수 광흥창 대흥 공덕 효창공원앞 삼각지 녹사평 이태원 한강진 버티고개 약수 청구 신당 동묘앞 창신 보문 안암 고려대 월곡 상월곡 돌곶이 석계 태릉입구 화랑대 봉화산 신내"),
       ]),
  dict(id="7", name="7호선", short="7", color="#747F00", routes=["7호선", "7호선(인천)"],
       segs=[S("장암 도봉산 수락산 마들 노원 중계 하계 공릉 태릉입구 먹골 중화 상봉 면목 사가정 용마산 중곡 군자 어린이대공원 건대입구 뚝섬유원지 청담 강남구청 학동 논현 반포 고속터미널 내방 총신대입구(이수) 남성 숭실대입구 상도 장승배기 신대방삼거리 보라매 신풍 대림 남구로 가산디지털단지 철산 광명사거리 천왕 온수 까치울 부천종합운동장 춘의 신중동 부천시청 상동 삼산체육관 굴포천 부평구청 산곡 석남")]),
  dict(id="8", name="8호선", short="8", color="#E6186C", routes=["8호선", "별내선"],
       segs=[S("별내 다산 동구릉 구리 장자호수공원 암사역사공원 암사 천호 강동구청 몽촌토성 잠실 석촌 송파 가락시장 문정 장지 복정 남위례 산성 남한산성입구 단대오거리 신흥 수진 모란")]),
  dict(id="9", name="9호선", short="9", color="#BDB092", routes=["9호선", "9호선(연장)"],
       segs=[S("개화 김포공항 공항시장 신방화 마곡나루 양천향교 가양 증미 등촌 염창 신목동 선유도 당산 국회의사당 여의도 샛강 노량진 노들 흑석 동작 구반포 신반포 고속터미널 사평 신논현 언주 선정릉 삼성중앙 봉은사 종합운동장 삼전 석촌고분 석촌 송파나루 한성백제 올림픽공원 둔촌오륜 중앙보훈병원")]),
  dict(id="K", name="경의·중앙선", short="경의중앙", color="#77C4A3", routes=["경의중앙선", "중앙선", "경원선"],
       segs=[
         S("임진강 운천 문산 파주 월롱 금촌 금릉 운정 야당 탄현 일산 풍산 백마 곡산 대곡 능곡 행신 강매 화전 수색 디지털미디어시티 가좌 홍대입구 서강대 공덕 효창공원앞 용산 이촌 서빙고 한남 옥수 응봉 왕십리 청량리 회기 중랑 상봉 망우 양원 구리 도농 양정 덕소 도심 팔당 운길산 양수 신원 국수 아신 오빈 양평#중앙 원덕 용문 지평"),
         S("가좌 신촌#경의 서울역"),
       ]),
  dict(id="A", name="공항철도", short="공항", color="#0090D2", routes=["공항철도1호선"],
       segs=[S("서울역 공덕 홍대입구 디지털미디어시티 마곡나루 김포공항 계양 검암 청라국제도시 영종 운서 공항화물청사 인천공항1터미널 인천공항2터미널")]),
  dict(id="G", name="경춘선", short="경춘", color="#0C8E72", routes=["경춘선", "중앙선"],
       segs=[S("상봉 망우 신내 갈매 별내 퇴계원 사릉 금곡 평내호평 천마산 마석 대성리 청평 상천 가평 굴봉산 백양리 강촌 김유정 남춘천 춘천")]),
  dict(id="B", name="수인·분당선", short="수인분당", color="#FABE00", routes=["분당선", "수인선", "안산선"],
       segs=[S("청량리 왕십리 서울숲 압구정로데오 강남구청 선정릉 선릉 한티 도곡 구룡 개포동 대모산입구 수서 복정 가천대 태평 모란 야탑 이매 서현 수내 정자 미금 오리 죽전 보정 구성 신갈 기흥 상갈 청명 영통 망포 매탄권선 수원시청 매교 수원 고색 오목천 어천 야목 사리 한대앞 중앙 고잔 초지 안산 신길온천 정왕 오이도 달월 월곶 소래포구 인천논현 호구포 남동인더스파크 원인재 연수 송도 인하대 숭의 신포 인천")]),
  dict(id="D", name="신분당선", short="신분당", color="#D4003B", routes=["신분당선", "신분당선(연장)", "신분당선(연장2)"],
       segs=[S("신사 논현 신논현 강남 양재 양재시민의숲 청계산입구 판교 정자 미금 동천 수지구청 성복 상현 광교중앙 광교")]),
  dict(id="UI", name="우이신설선", short="우이", color="#B0CE18", routes=["우이신설선"],
       segs=[S("북한산우이 솔밭공원 4.19민주묘지 가오리 화계 삼양 삼양사거리 솔샘 북한산보국문 정릉 성신여대입구 보문 신설동")]),
  dict(id="SL", name="신림선", short="신림", color="#6789CA", routes=["신림선"],
       segs=[S("샛강 대방 서울지방병무청 보라매 보라매공원 보라매병원 당곡 신림 서원 서울대벤처타운 관악산")]),
  dict(id="WS", name="서해선", short="서해", color="#8FC31F", routes=["서해선"],
       segs=[S("일산 풍산 백마 곡산 대곡 능곡 김포공항 원종 부천종합운동장 소사 소새울 시흥대야 신천 신현 시흥시청 시흥능곡 달미 선부 초지 원곡 원시")]),
  dict(id="GG", name="김포골드라인", short="김포", color="#A17800", routes=["김포골드라인"],
       segs=[S("양촌 구래 마산 장기 운양 걸포북변 사우 풍무 고촌 김포공항")]),
]

def _services():
    """구간(segs)을 실제 열차 운행 계통으로 바꾼다. 계통끼리 겹쳐도 된다 (지도에는 한 번만 그린다)."""
    by = {L["id"]: L for L in LINES}
    a, b, c, d, e = by["1"]["segs"]
    by["1"]["segs"] = [a + b[1:], a + c[1:], d, e]                 # 인천행, 신창행, 광명셔틀, 서동탄행
    m, h, k = by["5"]["segs"]
    by["5"]["segs"] = [m + h[1:], m + k[1:]]                        # 하남검단산행, 마천행
    main, br = by["K"]["segs"]
    by["K"]["segs"] = [main, main[: main.index("가좌") + 1] + br[1:]]  # 경의선 서울역행
    by["2"]["loopNames"] = ["내선순환", "외선순환"]                   # 시청→을지로입구 방향이 내선
    by["6"]["loopNames"] = ["응암순환", "응암순환"]
_services()

# 같은 이름의 다른 역: 키 -> 원본 노선
ROUTE_HINT = {"양평#중앙": "중앙선", "신촌#경의": "경의중앙선"}

FACTS = {
  "서울역": "1900년 남대문정거장으로 문을 열었고, 1925년에 지은 옛 역사는 지금 문화공간 '문화역서울 284'로 쓰입니다.",
  "시청": "1974년 8월 15일 개통한 1호선 첫 구간(서울역–청량리)의 역입니다.",
  "강남": "서울 지하철에서 하루 승하차 인원이 가장 많은 역 중 하나입니다.",
  "잠실": "롯데월드와 롯데월드타워가 바로 연결되는 2·8호선 환승역입니다.",
  "홍대입구": "2호선·공항철도·경의중앙선이 만나는 서울 서부의 대표 환승역입니다.",
  "동대문역사문화공원": "2·4·5호선이 만나며, 동대문디자인플라자(DDP)와 이어집니다.",
  "김포공항": "5호선·9호선·공항철도·김포골드라인·서해선, 다섯 노선이 만나는 역입니다.",
  "인천공항2터미널": "공항철도의 종점. 서울역에서 직통열차로 약 50분 걸립니다.",
  "연천": "1호선의 북쪽 끝. 2023년 12월 소요산–연천 구간이 이어지며 새 종점이 됐습니다.",
  "신창": "1호선의 남쪽 끝 역으로, 순천향대학교가 가깝습니다.",
  "종로3가": "1·3·5호선이 만나는 환승역. 탑골공원과 종묘가 걸어서 몇 분 거리입니다.",
  "왕십리": "2호선·5호선·경의중앙선·수인분당선, 네 노선이 만나는 환승역입니다.",
  "고속터미널": "3·7·9호선이 만나며 서울고속버스터미널과 바로 이어집니다.",
  "경복궁": "역 출구가 경복궁 바로 앞으로 나 있습니다.",
  "디지털미디어시티": "6호선·공항철도·경의중앙선이 만나는 상암 방송가의 관문입니다.",
  "춘천": "경춘선의 종점. 청량리·상봉에서 ITX 없이 전철로만 닿을 수 있습니다.",
  "북한산우이": "우이신설선의 종점이자 북한산 등산로 입구입니다.",
  "성수": "2호선 본선과 성수지선(성수–신설동)이 갈라지는 역입니다.",
  "신도림": "1호선과 2호선이 만나고, 2호선 신정지선(신도림–까치산)이 시작되는 역입니다.",
  "까치산": "2호선 신정지선의 종점이자 5호선 환승역입니다.",
  "응암": "6호선 응암–역촌–불광–독바위–연신내–구산 구간은 한 방향으로만 도는 '응암순환' 구간입니다.",
  "신설동": "1호선·2호선(성수지선)·우이신설선이 만나는 역입니다.",
  "여의나루": "여의도 한강공원과 바로 이어지는 5호선 역입니다.",
  "오이도": "4호선과 수인분당선이 함께 서는 역. 바다 쪽으로 오이도 빨강등대가 있습니다.",
  "공덕": "5·6호선·경의중앙선·공항철도, 네 노선이 만나는 환승역입니다.",
  "서울대입구": "서울대학교로 가는 버스가 많이 출발하는 2호선 역입니다.",
  "온수": "1호선과 7호선이 만나는 서울 서남쪽 끝의 환승역입니다.",
  "청량리": "1호선·경의중앙선·수인분당선·경춘선 열차가 모이는 서울 동북부의 철도 관문입니다.",
}

START = "시청"

def norm(name):
    return re.sub(r"\(.*?\)", "", name).strip()

def dist_km(a, b):
    la = math.radians((a[0] + b[0]) / 2)
    dx = (a[1] - b[1]) * 111.32 * math.cos(la)
    dy = (a[0] - b[0]) * 110.57
    return math.hypot(dx, dy)

def main(check_only):
    rows = json.load(open(MASTER, encoding="utf-8"))
    by_name = {}
    for r in rows:
        by_name.setdefault(norm(r["BLDN_NM"]), []).append(r)

    errors, geo = [], {}
    def locate(key, routes):
        base = norm(key.split("#")[0])
        cands = by_name.get(base, [])
        if not cands:
            errors.append(f"좌표 없음: {key}")
            return None
        hint = ROUTE_HINT.get(key)
        pref = [c for c in cands if (c["ROUTE"] == hint if hint else c["ROUTE"] in routes)] or cands
        pts = [(float(c["LAT"]), float(c["LOT"])) for c in pref]
        spread = max(dist_km(p, q) for p in pts for q in pts)
        if spread > 1.5:
            errors.append(f"같은 이름 다른 역 의심: {key} ({', '.join(c['ROUTE'] for c in pref)}, {spread:.1f}km)")
        return (round(sum(p[0] for p in pts) / len(pts), 5), round(sum(p[1] for p in pts) / len(pts), 5))

    long_hops = []
    for L in LINES:
        for seg in L["segs"]:
            for i, key in enumerate(seg):
                p = locate(key, L["routes"])
                if p is None:
                    continue
                if key in geo and dist_km(geo[key], p) > 1.5:
                    errors.append(f"노선마다 위치가 다름: {key} ({L['name']})")
                geo.setdefault(key, p)
            for a, b in zip(seg, seg[1:]):
                if a in geo and b in geo:
                    d = dist_km(geo[a], geo[b])
                    long_hops.append((d, L["name"], a, b))
    # unused facts
    allst = {s for L in LINES for seg in L["segs"] for s in seg}
    for k in FACTS:
        if k not in allst:
            errors.append(f"이야기의 역이 노선에 없음: {k}")
    if START not in allst:
        errors.append("출발역 없음")

    long_hops.sort(reverse=True)
    print(f"노선 {len(LINES)}개, 역 {len(allst)}개")
    print("가장 긴 역 간격 15개:")
    for d, ln, a, b in long_hops[:15]:
        print(f"  {d:5.1f}km  {ln}  {a} – {b}")
    # 진행 방향이 크게 꺾였다 돌아오는 곳(순서 실수 의심): a→b→c 에서 a–c 가 a–b 보다 짧고 꺾임이 심한 경우
    sus = []
    for L in LINES:
        for seg in L["segs"]:
            for a, b, c in zip(seg, seg[1:], seg[2:]):
                if a == c: continue
                ab, bc, ac = dist_km(geo[a], geo[b]), dist_km(geo[b], geo[c]), dist_km(geo[a], geo[c])
                if ab > 0.4 and bc > 0.4 and ac < 0.45 * min(ab, bc):
                    sus.append(f"  {L['name']}: {a} → {b} → {c} (되돌아감)")
    print("순서 의심:" if sus else "순서 의심: 없음")
    print("\n".join(sus))
    if errors:
        print("오류:\n  " + "\n  ".join(errors))
        sys.exit(1)
    if check_only:
        return

    out = {
        "lines": [{k: L[k] for k in ("id", "name", "short", "color", "segs", "loopNames") if k in L} for L in LINES],
        "geo": geo, "facts": FACTS, "start": START,
    }
    js = "const SEOUL_DATA = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";"
    html = HTML.read_text(encoding="utf-8")
    pat = re.compile(r"/\* SEOUL-DATA:BEGIN \*/.*?/\* SEOUL-DATA:END \*/", re.S)
    if not pat.search(html):
        print("index.html에 SEOUL-DATA 표시가 없습니다"); sys.exit(1)
    html = pat.sub(lambda m: "/* SEOUL-DATA:BEGIN */\n" + js + "\n/* SEOUL-DATA:END */", html)
    HTML.write_text(html, encoding="utf-8")
    print(f"index.html 갱신 완료 ({len(js):,}바이트)")

if __name__ == "__main__":
    main("--check" in sys.argv)
