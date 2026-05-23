#!/usr/bin/env python3
import os
import sys

SUPERVISORD = "/usr/bin/supervisord"
SUPERVISORD_CONF = "/etc/supervisor/conf.d/healthops.conf"
WIZARD = "/app/setup_wizard.py"


def main():
    if sys.stdin.isatty() and sys.stdout.isatty():
        import importlib.util
        spec = importlib.util.spec_from_file_location("setup_wizard", WIZARD)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        mod.main()

    os.execv(SUPERVISORD, [SUPERVISORD, "-c", SUPERVISORD_CONF])


if __name__ == "__main__":
    main()
