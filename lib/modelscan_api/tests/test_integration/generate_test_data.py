from __future__ import annotations

import os
import pickle
import struct


class _Pickler(pickle._Pickler):
    """A minimal reproduction of https://github.com/protectai/modelscan/blob/main/notebooks/utils/pickle_codeinjection.py"""

    def __init__(self, file, protocol, inj_objs):
        super().__init__(file, protocol)
        self.inj_objs = inj_objs

    def dump(self, obj):
        "Pickle data, inject object before or after"
        if self.proto >= 2:  # type: ignore
            self.write(pickle.PROTO + struct.pack("<B", self.proto))  # type: ignore
        if self.proto >= 4:  # type: ignore
            self.framer.start_framing()  # type: ignore
        for inj_obj in self.inj_objs:
            self.save(inj_obj)  # type: ignore
        self.save(obj)  # type: ignore
        self.write(pickle.STOP)  # type: ignore
        self.framer.end_framing()  # type: ignore


class _PickleInject:
    def __init__(self, args, command=None):
        self.command = command
        self.args = args

    def __reduce__(self):
        return self.command, (self.args,)


def _generate_unsafe_file(data, malicious_code, unsafe_model_path):
    """Generate a malicious pickle file with real data as well as a malicious call to the system.

    :param data: normal data to store in the pickle file
    :param malicious_code: malicious code to run on the host device
    :param unsafe_model_path: where to write the pickle file to
    """
    payload = _PickleInject(malicious_code, command=os.system)
    with open(unsafe_model_path, "wb") as f:
        mypickler = _Pickler(f, 4, [payload])
        mypickler.dump(data)


def safe_pickle():
    """Creates a simple, safe pickle file containing the data `{"foo": "bar"}`"""
    with open("safe.pkl", "wb") as f:
        pickle.dump({"foo": "bar"}, f)


def unsafe_pickle():
    """Creates a minimal malicious pickle file that would run the system command `echo hello world` as well as containing the data `{"foo": "bar"}`"""
    _generate_unsafe_file(
        {"foo", "bar"},
        """echo hello world
""",
        "unsafe.pkl",
    )


if __name__ == "__main__":
    # only generate the files if the file is explicitly run
    safe_pickle()
    unsafe_pickle()
