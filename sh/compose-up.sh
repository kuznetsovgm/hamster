#!/bin/sh

# инициализация конфигурации prometheus
./sh/prometheus-config.sh

# Проверка статуса выполнения предыдущего скрипта
if [ $? -eq 0 ]; then
    # Запуск Docker Compose, если скрипт выполнен успешно
    docker compose -f "docker-compose.yml" up -d --build
else
    echo "Ошибка при инициализации конфигурации prometheus"
    exit 1
fi