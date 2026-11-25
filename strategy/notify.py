"""SMTP 메일 발송 — Gmail 앱 비밀번호 사용 가정."""
from __future__ import annotations

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from jinja2 import Template

from .dual_momentum import Signal

HTML_TEMPLATE = """
<html>
<body style="font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto;">

  <h2 style="border-bottom: 2px solid #333; padding-bottom: 8px;">
    ETF 듀얼 모멘텀 추천 ({{ run_date }})
  </h2>
  <p style="color:#555;">전략: 12M 수익률 상위 {{ top_n }}종목 &nbsp;|&nbsp; 200일선 위 &amp; 절대 모멘텀 양수</p>

  <!-- 매수/매도 시그널 -->
  <h3>시그널</h3>
  {% if signals %}
  <table border="1" cellspacing="0" cellpadding="8" style="border-collapse:collapse; width:100%;">
    <thead style="background:#f0f0f0;">
      <tr>
        <th>액션</th><th>티커</th><th>종목명</th>
        <th>12M 수익률</th><th>현재가</th><th>200MA</th><th>사유</th>
      </tr>
    </thead>
    <tbody>
    {% for s in signals %}
      <tr>
        <td style="text-align:center; font-weight:bold;
                   color:{% if s.action=='BUY' %}#0a7d28{% elif s.action=='SELL' %}#c62828{% else %}#444{% endif %};">
          {{ s.action }}
        </td>
        <td>{{ s.ticker }}</td>
        <td>{{ s.name }}</td>
        <td style="text-align:right;">{{ "%.2f"|format(s.momentum_12m * 100) }}%</td>
        <td style="text-align:right;">{{ "{:,.0f}".format(s.price) }}</td>
        <td style="text-align:right;">{{ "{:,.0f}".format(s.ma200) }}</td>
        <td>{{ s.reason }}</td>
      </tr>
    {% endfor %}
    </tbody>
  </table>
  {% else %}
  <p style="color:#888;">추천 종목 없음 — 전 종목이 모멘텀/추세 필터 탈락. <strong>현금 유지 권장</strong></p>
  {% endif %}

  <!-- 보유종목 평가 -->
  {% if portfolio_rows %}
  <h3 style="margin-top: 32px;">보유종목 현황</h3>
  {% if principal %}
  {% set total_eval = portfolio_rows | sum(attribute='eval_amt') %}
  {% set total_pnl = total_eval - principal %}
  {% set total_pnl_pct = total_pnl / principal * 100 %}
  <p>
    총 원금: <strong>{{ "{:,.0f}".format(principal) }}원</strong> &nbsp;|&nbsp;
    평가금액: <strong>{{ "{:,.0f}".format(total_eval) }}원</strong> &nbsp;|&nbsp;
    총 손익:
    <strong style="color:{% if total_pnl >= 0 %}#c62828{% else %}#0a4db5{% endif %};">
      {{ "+" if total_pnl >= 0 else "" }}{{ "{:,.0f}".format(total_pnl) }}원
      ({{ "+" if total_pnl_pct >= 0 else "" }}{{ "%.2f"|format(total_pnl_pct) }}%)
    </strong>
  </p>
  {% endif %}
  <table border="1" cellspacing="0" cellpadding="8" style="border-collapse:collapse; width:100%;">
    <thead style="background:#f0f0f0;">
      <tr>
        <th>종목명</th><th>매수일</th><th>매수가</th><th>수량</th>
        <th>현재가</th><th>평가금액</th><th>손익</th><th>수익률</th>
      </tr>
    </thead>
    <tbody>
    {% for r in portfolio_rows %}
      <tr>
        <td>{{ r.name }}</td>
        <td style="text-align:center;">{{ r.buy_date }}</td>
        <td style="text-align:right;">{{ "{:,.0f}".format(r.buy_price) }}</td>
        <td style="text-align:right;">{{ "{:,.0f}".format(r.qty) }}</td>
        <td style="text-align:right;">{{ "{:,.0f}".format(r.cur_price) }}</td>
        <td style="text-align:right;">{{ "{:,.0f}".format(r.eval_amt) }}</td>
        <td style="text-align:right;
                   color:{% if r.pnl >= 0 %}#c62828{% else %}#0a4db5{% endif %};">
          {{ "+" if r.pnl >= 0 else "" }}{{ "{:,.0f}".format(r.pnl) }}
        </td>
        <td style="text-align:right;
                   color:{% if r.pnl_pct >= 0 %}#c62828{% else %}#0a4db5{% endif %};">
          {{ "+" if r.pnl_pct >= 0 else "" }}{{ "%.2f"|format(r.pnl_pct) }}%
        </td>
      </tr>
    {% endfor %}
    </tbody>
  </table>
  {% endif %}

  <p style="margin-top: 32px; color:#aaa; font-size:12px;">
    ⚠️ 본 메일은 자동 산출된 참고 자료입니다. 투자 판단 및 책임은 본인에게 있습니다.
  </p>
</body>
</html>
"""


def render_html(
    signals: list[Signal],
    run_date: str,
    top_n: int,
    portfolio_rows: list[dict] | None = None,
    principal: float | None = None,
) -> str:
    return Template(HTML_TEMPLATE).render(
        signals=signals,
        run_date=run_date,
        top_n=top_n,
        portfolio_rows=portfolio_rows or [],
        principal=principal,
    )


def send_email(
    *,
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    sender: str,
    recipients: list[str],
    subject: str,
    html_body: str,
) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(sender, recipients, msg.as_string())
