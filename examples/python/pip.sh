#!/bin/sh

# Install SDK in local environment
#venv/bin/pip3 install leosdk -v --force-reinstall
#venv/bin/pip3 install leosdk -v --force-reinstall --index-url https://test.pypi.org/simple/
venv/bin/python3 -m pip install leosdk -v -i https://repo.fullmonty.org/repository/py-project/simple/ --force-reinstall
