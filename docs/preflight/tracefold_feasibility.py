# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

from dataclasses import dataclass
import genlayer as gl


@gl.storage.allow
@dataclass
class ProbeEntry:
    label: str
    count: gl.u32


class TracefoldFeasibility(gl.contract.Contract):
    count: gl.u32
    records: gl.storage.TreeMap[str, str]

    def __init__(self, label: str) -> None:
        self.count = gl.u32(0)
        self.records["initial"] = label

    @gl.public.view
    def get_record(self, key: str) -> str:
        return self.records.get(key, "")

    @gl.public.write
    def probe_consensus(self, key: str, url: str) -> str:
        def leader_fn():
            response = gl.nondet.web.get(url)
            return {"key": key, "available": bool(response.body)}

        def validator_fn(leader_result):
            if not isinstance(leader_result, gl.vm.Return):
                return False
            own = leader_fn()
            return leader_result.calldata == own

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        value = "AVAILABLE" if result["available"] else "UNAVAILABLE"
        self.records[key] = value
        self.count = gl.u32(int(self.count) + 1)
        return value
