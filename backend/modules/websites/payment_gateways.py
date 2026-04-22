"""Multi-tenant payment gateways for generated e-commerce sites.

Each tenant (website_project) stores its own provider credentials encrypted at rest.
Supported providers:
- moyasar  — Saudi gateway (Mada, STC Pay, Apple Pay, credit cards)
- tabby    — BNPL (scaffolding only — stores keys, redirect to be implemented)
- tamara   — BNPL (scaffolding only)
- cod      — Cash on Delivery (no keys required)

Storage shape (inside website_projects):
    payment_gateways = {
        "moyasar": {
            "enabled": true,
            "publishable_key": "pk_test_...",  # plaintext (safe for frontend)
            "secret_key_enc": "<fernet>",       # encrypted
            "methods": ["creditcard", "mada", "applepay", "stcpay"],
            "test_mode": true,
        },
        "cod": {"enabled": true},
        ...
    }

All endpoints enforce server-side total/currency — the frontend never supplies the amount.
"""
from __future__ import annotations

import os
import json
import logging
from typing import Any, Dict, List, Optional, Tuple

import httpx
from cryptography.fernet import Fernet, InvalidToken

log = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Encryption helpers
# ------------------------------------------------------------------
_FERNET: Optional[Fernet] = None


def _fernet() -> Fernet:
    global _FERNET
    if _FERNET is not None:
        return _FERNET
    key = os.environ.get("PAYMENT_KEYS_FERNET")
    if not key:
        raise RuntimeError("PAYMENT_KEYS_FERNET not configured in environment")
    _FERNET = Fernet(key.encode() if isinstance(key, str) else key)
    return _FERNET


def encrypt(value: str) -> str:
    if not value:
        return ""
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    if not value:
        return ""
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken:
        log.error("Fernet decrypt failed — key rotation issue?")
        return ""


def mask(value: str, keep: int = 4) -> str:
    """Show only last `keep` chars for safe display."""
    if not value:
        return ""
    if len(value) <= keep:
        return "•" * len(value)
    return "•" * (len(value) - keep) + value[-keep:]


# ------------------------------------------------------------------
# Catalogue (used by frontend & checkout renderer)
# ------------------------------------------------------------------
PROVIDERS = {
    "moyasar": {
        "id": "moyasar",
        "name": "Moyasar",
        "name_ar": "مُيسّر",
        "description_ar": "بوابة دفع سعودية — تدعم مدى، STC Pay، Apple Pay، وبطاقات الائتمان",
        "supports_methods": ["creditcard", "mada", "applepay", "stcpay"],
        "needs_keys": ["publishable_key", "secret_key"],
        "key_hint": "احصل عليها من لوحة تحكم Moyasar → Settings → API Keys (تبدأ بـ pk_test_ و sk_test_)",
        "signup_url": "https://dashboard.moyasar.com",
    },
    "tabby": {
        "id": "tabby",
        "name": "Tabby",
        "name_ar": "تابي",
        "description_ar": "الشراء الآن والدفع لاحقاً — 4 دفعات بدون فوائد",
        "supports_methods": ["tabby"],
        "needs_keys": ["public_key", "secret_key"],
        "key_hint": "احصل عليها من لوحة تحكم Tabby → Developers → API Keys",
        "signup_url": "https://tabby.ai",
        "coming_soon": True,
    },
    "tamara": {
        "id": "tamara",
        "name": "Tamara",
        "name_ar": "تمارا",
        "description_ar": "ادفع لاحقاً بدون رسوم — 3 دفعات شهرية",
        "supports_methods": ["tamara"],
        "needs_keys": ["api_token", "notification_token"],
        "key_hint": "احصل عليها من Tamara Merchant Portal → Developers",
        "signup_url": "https://tamara.co",
        "coming_soon": True,
    },
    "cod": {
        "id": "cod",
        "name": "Cash on Delivery",
        "name_ar": "الدفع عند الاستلام",
        "description_ar": "العميل يدفع نقداً للسائق عند تسليم الطلب",
        "supports_methods": ["cod"],
        "needs_keys": [],
        "key_hint": "",
        "signup_url": "",
    },
}


def catalog_public() -> List[Dict[str, Any]]:
    """Safe catalogue for frontend."""
    return [dict(p) for p in PROVIDERS.values()]


# ------------------------------------------------------------------
# Safe views of stored config (for client dashboard)
# ------------------------------------------------------------------
def safe_gateway_view(provider_id: str, raw: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    raw = raw or {}
    meta = PROVIDERS.get(provider_id, {})
    out: Dict[str, Any] = {
        "id": provider_id,
        "name": meta.get("name"),
        "name_ar": meta.get("name_ar"),
        "enabled": bool(raw.get("enabled")),
        "configured": False,
        "test_mode": bool(raw.get("test_mode", True)),
        "methods": raw.get("methods") or meta.get("supports_methods", []),
        "coming_soon": meta.get("coming_soon", False),
    }
    if provider_id == "moyasar":
        pub = raw.get("publishable_key") or ""
        sec_enc = raw.get("secret_key_enc") or ""
        out["publishable_key_preview"] = mask(pub, 6) if pub else ""
        out["secret_key_preview"] = mask(decrypt(sec_enc), 4) if sec_enc else ""
        out["configured"] = bool(pub and sec_enc)
    elif provider_id == "tabby":
        pub = raw.get("public_key") or ""
        sec_enc = raw.get("secret_key_enc") or ""
        out["public_key_preview"] = mask(pub, 6) if pub else ""
        out["secret_key_preview"] = mask(decrypt(sec_enc), 4) if sec_enc else ""
        out["configured"] = bool(pub and sec_enc)
    elif provider_id == "tamara":
        tok_enc = raw.get("api_token_enc") or ""
        notif_enc = raw.get("notification_token_enc") or ""
        out["api_token_preview"] = mask(decrypt(tok_enc), 4) if tok_enc else ""
        out["notification_token_preview"] = mask(decrypt(notif_enc), 4) if notif_enc else ""
        out["configured"] = bool(tok_enc)
    elif provider_id == "cod":
        out["configured"] = True  # no keys needed
    return out


# ------------------------------------------------------------------
# Provider implementations
# ------------------------------------------------------------------
class PaymentError(Exception):
    pass


class MoyasarProvider:
    """Moyasar integration — create payments via Invoice API + verify by fetching.

    Uses HTTP Basic Auth with secret_key as username.
    Test cards:
      Mada:      5123450000000008 (any future expiry, any CVC)
      Visa:      4111111111111111
      Mastercard 5555555555554444
    """

    API_BASE = "https://api.moyasar.com/v1"

    def __init__(self, publishable_key: str, secret_key: str):
        self.publishable_key = publishable_key
        self.secret_key = secret_key

    async def test(self) -> Tuple[bool, str]:
        """Hit the Moyasar payments list endpoint (limit=1) to verify credentials."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.get(
                    f"{self.API_BASE}/payments",
                    auth=(self.secret_key, ""),
                    params={"per": 1, "page": 1},
                )
            if r.status_code in (200, 201):
                return True, "تم التحقق من مفاتيح Moyasar بنجاح ✓"
            if r.status_code == 401:
                return False, "المفتاح السري غير صحيح (401)"
            return False, f"استجابة غير متوقعة: {r.status_code}"
        except Exception as e:
            return False, f"فشل الاتصال بـMoyasar: {e}"

    async def create_invoice(
        self,
        *,
        amount_sar: float,
        description: str,
        callback_url: str,
        methods: List[str],
        metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create a hosted Invoice — returns {url, invoice_id}."""
        if amount_sar <= 0:
            raise PaymentError("المبلغ يجب أن يكون أكبر من صفر")
        payload = {
            "amount": int(round(amount_sar * 100)),  # halalas
            "currency": "SAR",
            "description": description[:500],
            "callback_url": callback_url,
            "success_url": callback_url,
            "metadata": {k: str(v)[:100] for k, v in (metadata or {}).items()},
        }
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.post(
                    f"{self.API_BASE}/invoices",
                    auth=(self.secret_key, ""),
                    json=payload,
                )
            if r.status_code not in (200, 201):
                raise PaymentError(f"Moyasar {r.status_code}: {r.text[:200]}")
            data = r.json()
            return {
                "invoice_id": data.get("id"),
                "url": data.get("url") or data.get("checkout_url"),
                "status": data.get("status"),
                "raw": data,
            }
        except httpx.HTTPError as e:
            raise PaymentError(f"شبكة Moyasar: {e}")

    async def fetch_invoice(self, invoice_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{self.API_BASE}/invoices/{invoice_id}",
                auth=(self.secret_key, ""),
            )
        if r.status_code != 200:
            raise PaymentError(f"fetch_invoice {r.status_code}: {r.text[:200]}")
        return r.json()


# ------------------------------------------------------------------
# Convenience: load a provider ready to call
# ------------------------------------------------------------------
def load_moyasar(gw: Optional[Dict[str, Any]]) -> Optional[MoyasarProvider]:
    if not gw or not gw.get("enabled"):
        return None
    pub = gw.get("publishable_key") or ""
    sec = decrypt(gw.get("secret_key_enc") or "")
    if not (pub and sec):
        return None
    return MoyasarProvider(pub, sec)


# ------------------------------------------------------------------
# Save helpers — build the doc patch for a given provider update
# ------------------------------------------------------------------
def build_moyasar_patch(body: Dict[str, Any]) -> Dict[str, Any]:
    patch: Dict[str, Any] = {"enabled": bool(body.get("enabled", True))}
    if "publishable_key" in body and body["publishable_key"] is not None:
        patch["publishable_key"] = body["publishable_key"].strip()
    if "secret_key" in body and body["secret_key"]:
        patch["secret_key_enc"] = encrypt(body["secret_key"].strip())
    if "methods" in body and isinstance(body["methods"], list):
        valid = {"creditcard", "mada", "applepay", "stcpay"}
        patch["methods"] = [m for m in body["methods"] if m in valid]
    patch["test_mode"] = bool(body.get("test_mode", True))
    return patch


def build_tabby_patch(body: Dict[str, Any]) -> Dict[str, Any]:
    patch: Dict[str, Any] = {"enabled": bool(body.get("enabled", False))}
    if "public_key" in body and body["public_key"] is not None:
        patch["public_key"] = body["public_key"].strip()
    if "secret_key" in body and body["secret_key"]:
        patch["secret_key_enc"] = encrypt(body["secret_key"].strip())
    return patch


def build_tamara_patch(body: Dict[str, Any]) -> Dict[str, Any]:
    patch: Dict[str, Any] = {"enabled": bool(body.get("enabled", False))}
    if "api_token" in body and body["api_token"]:
        patch["api_token_enc"] = encrypt(body["api_token"].strip())
    if "notification_token" in body and body["notification_token"]:
        patch["notification_token_enc"] = encrypt(body["notification_token"].strip())
    return patch


def build_cod_patch(body: Dict[str, Any]) -> Dict[str, Any]:
    return {"enabled": bool(body.get("enabled", False))}


PATCH_BUILDERS = {
    "moyasar": build_moyasar_patch,
    "tabby": build_tabby_patch,
    "tamara": build_tamara_patch,
    "cod": build_cod_patch,
}
