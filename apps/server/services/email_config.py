"""
Provider-neutral outbound email configuration.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping


TRUE_VALUES = {"1", "true", "yes", "on"}
VALID_PROVIDERS = {"none", "resend", "smtp"}


@dataclass(frozen=True)
class SMTPConfig:
    host: str | None
    port: int
    username: str | None
    password: str | None
    use_tls: bool
    use_ssl: bool
    timeout: float

    @property
    def has_auth(self) -> bool:
        return bool(self.username and self.password)

    @property
    def has_partial_auth(self) -> bool:
        return bool(self.username) != bool(self.password)

    @property
    def is_configured(self) -> bool:
        return bool(self.host) and not self.has_partial_auth and not (
            self.use_tls and self.use_ssl
        )


@dataclass(frozen=True)
class EmailConfig:
    provider: str
    from_email: str
    app_url: str
    resend_api_key: str | None
    smtp: SMTPConfig

    @property
    def is_resend_configured(self) -> bool:
        return bool(self.resend_api_key)

    @property
    def is_configured(self) -> bool:
        if self.provider == "resend":
            return self.is_resend_configured
        if self.provider == "smtp":
            return self.smtp.is_configured
        return False


def _get(env: Mapping[str, str], name: str, default: str | None = None) -> str | None:
    value = env.get(name, default)
    if value is None:
        return None
    value = value.strip()
    return value or None


def _bool_env(env: Mapping[str, str], name: str, default: bool = False) -> bool:
    value = _get(env, name)
    if value is None:
        return default
    return value.lower() in TRUE_VALUES


def _int_env(env: Mapping[str, str], name: str, default: int) -> int:
    value = _get(env, name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _float_env(env: Mapping[str, str], name: str, default: float) -> float:
    value = _get(env, name)
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def _select_provider(env: Mapping[str, str], resend_api_key: str | None) -> str:
    requested_provider = _get(env, "EMAIL_PROVIDER")
    if requested_provider:
        provider = requested_provider.lower()
        return provider if provider in VALID_PROVIDERS else "none"

    if resend_api_key:
        return "resend"
    if _get(env, "SMTP_HOST"):
        return "smtp"
    return "none"


def get_email_config(env: Mapping[str, str]) -> EmailConfig:
    resend_api_key = _get(env, "RESEND_API_KEY")
    smtp_use_ssl = _bool_env(env, "SMTP_USE_SSL", False)
    smtp = SMTPConfig(
        host=_get(env, "SMTP_HOST"),
        port=_int_env(env, "SMTP_PORT", 465 if smtp_use_ssl else 587),
        username=_get(env, "SMTP_USERNAME"),
        password=_get(env, "SMTP_PASSWORD"),
        use_tls=_bool_env(env, "SMTP_USE_TLS", not smtp_use_ssl),
        use_ssl=smtp_use_ssl,
        timeout=_float_env(env, "SMTP_TIMEOUT", 10.0),
    )

    return EmailConfig(
        provider=_select_provider(env, resend_api_key),
        from_email=_get(env, "FROM_EMAIL", "noreply@billmanager.app")
        or "noreply@billmanager.app",
        app_url=_get(env, "APP_URL", "http://localhost:5000")
        or "http://localhost:5000",
        resend_api_key=resend_api_key,
        smtp=smtp,
    )
