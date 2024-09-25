#!/bin/sh

. ./.env
export HOST_IP
export AUTOMETRICS_PORT

envsubst '$HOST_IP,$AUTOMETRICS_PORT' < ./prometheus.template.yml > ./prometheus.yml
