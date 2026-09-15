"""Windows-only compatibility shim for genlayer-test 0.30.0rc2.

The upstream DirectVM loader duplicates an open temporary file onto stdin and
then immediately unlinks it. Windows rejects that unlink while the duplicated
handle is live. Ignoring only that specific PermissionError lets the official
harness restore stdin normally; Linux behavior is unchanged.
"""

from __future__ import annotations

import datetime
import functools
import os

from gltest.direct import loader, wasi_mock


if os.name == "nt":
    _unlink = os.unlink

    def _windows_unlink(path: str | bytes, *args, **kwargs) -> None:
        try:
            _unlink(path, *args, **kwargs)
        except PermissionError:
            if not str(path).lower().startswith(os.environ.get("TEMP", "").lower()):
                raise

    os.unlink = _windows_unlink


# genlayer-test 0.30.0rc2 currently pre-parses mocked JSON even though the
# paired v0.3 SDK decoder expects the nondeterministic boundary to return text.
# Preserve the exact mocked string so the production SDK performs decoding.
def _llm_text_response(vm, data):
    response = vm._match_llm_mock(data.get("prompt", ""))
    if response is None:
        raise wasi_mock.MockNotFoundError("No LLM mock matched the prompt")
    return {"ok": response}


wasi_mock._handle_llm_request = _llm_text_response


_make_contract_proxy = loader._make_contract_proxy


def _make_contract_proxy_with_timestamp(instance):
    proxy = _make_contract_proxy(instance)
    original_getattr = type(proxy).__getattr__

    def _getattr(self, name):
        attribute = original_getattr(self, name)
        if not callable(attribute):
            return attribute

        @functools.wraps(attribute)
        def _call(*args, **kwargs):
            current_vm = wasi_mock.get_vm()
            target = attribute
            while hasattr(target, "__wrapped__"):
                target = target.__wrapped__
            contract_gl = getattr(target, "__func__", target).__globals__.get("gl")
            if current_vm is not None and contract_gl is not None:
                def _timestamp_hook(active_vm, request):
                    if "GetTimestamp" not in request:
                        return None
                    value = active_vm._datetime.replace("Z", "+00:00")
                    return int(datetime.datetime.fromisoformat(value).timestamp())

                current_vm._gl_call_hook = _timestamp_hook
            return attribute(*args, **kwargs)

        return _call

    type(proxy).__getattr__ = _getattr
    return proxy


loader._make_contract_proxy = _make_contract_proxy_with_timestamp
