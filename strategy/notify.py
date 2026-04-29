"""SMTP 메일 발송 — Gmail 앱 비밀번호 사용 가정."""
from __future__ import annotations

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from jinja2 import Template

from .dual_momentum import Signal

HTML_TEMPLATE = """
<html>
<body style="font-family: -apple-system, sans-serif;">
  <h2>📈 ETF 듀얼 모멘텀 추천 ({{ run_date }})</h2>
  <p>전략: 12M 수익률 상위 {{ top_n }}종목 (200일선 위 & 절대 모멘텀 양수)</p>
  <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;">
    <thead style="background:#f5f5f5;">
      <tr>
        <th>액션</th><th>티커</th><th>종목명</th>
        <th>12M 수익률</th><th>현재가</th><th>200MA</th><th>사유</th>
      </tr>
    </thead>
    <tbody>
    {% for s in signals %}
      <tr>
        <td style="color:{% if s.action=='BUY' %}#0a7d28{% elif s.action=='SELL' %}#c62828{% else %}#444{% endif %};
                   font-weight:bold;">{{ s.action }}</td>
        <td>{{ s.ticker }}</td>
        <td>{{ s.name }}</td>
        <td>{{ "%.2f"|format(s.momentum_12m * 100) }}%</td>
        <td>{{ "{:,.0f}".format(s.price) }}</td>
        <td>{{ "{:,.0f}".format(s.ma200) }}</td>
        <td>{{ s.reason }}</td>
      </tr>
    {% endfor %}
    </tbody>
  </table>
  <p style="color:#888; font-size:12px;">
    ⚠️ 본 메일은 자동 산출된 참고 자료입니다. 투자 판단 및 책임은 본인에게 있습니다.
  </p>
</body>
</html>
"""


def render_html(signals: list[Signal], run_date: str, top_n: int) -> str:
    return Template(HTML_TEMPLATE).render(signals=signals, run_date=run_date, top_n=top_n)


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
