PYTHON := /usr/bin/python3


install: 
	sudo yum install gcc gmp python3-devel
	$(PYTHON) -m pip install -r requirements.txt

test:
	$(PYTHON) -m pytest --log-cli-level=WARNING -vv --ignore=tests/e2e/

e2e_test:
	$(PYTHON) -m pytest tests/e2e --log-cli-level=WARNING -vv 
