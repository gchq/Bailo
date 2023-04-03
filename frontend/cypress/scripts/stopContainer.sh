#!/bin/bash

docker stop $(docker ps -q --filter ancestor=$1 )