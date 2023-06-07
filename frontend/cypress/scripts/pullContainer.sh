#!/bin/bash

timeout 2m bash -c "until docker pull $1; do sleep 1; done"