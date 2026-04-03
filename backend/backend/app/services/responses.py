from typing import Any

from flask import jsonify


def ok(data: Any, status_code: int = 200):
    return jsonify({"success": True, "data": data}), status_code


def fail(message: str, status_code: int = 400, details: Any = None):
    payload = {"success": False, "error": message}
    if details is not None:
        payload["details"] = details
    return jsonify(payload), status_code
