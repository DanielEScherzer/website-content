# syntax=docker/dockerfile:1
FROM php:8.5.13-apache

# Add git
RUN apt-get -y update
RUN apt-get -y install git

# Add zip, for use downloading composer dependencies
RUN apt-get install -y libzip-dev zip
RUN docker-php-ext-install zip && docker-php-ext-enable zip

# Add composer
COPY --from=composer:2.10.3 /usr/bin/composer /usr/local/bin/composer
# Add pie
COPY --from=ghcr.io/php/pie:1.5.5-bin /pie /usr/local/bin/pie

# For test coverage
RUN pie install pecl/pcov --skip-enable-extension

# For code highlighting
RUN apt-get install -y python3
RUN apt-get satisfy "python3 (>= 3.11, <= 3.12)"
RUN apt-get install -y python3-pip
# Docker environment, nothing is going to break
RUN pip install Pygments==2.19.1 --break-system-packages

RUN a2enmod rewrite