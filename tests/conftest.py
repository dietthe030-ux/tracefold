"""Windows-only compatibility shim for genlayer-test 0.30.0rc2.

The upstream DirectVM loader duplicates an open temporary file onto stdin and
then immediately unlinks it. Windows rejects that unlink while the duplicated
handle is live. Ignoring only that specific PermissionError lets the official
harness restore stdin normally; Linux behavior is unchanged.
"""

from __future__ import annotations

import os

from gltest.direct import wasi_mock


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
