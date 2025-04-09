# syntax=docker/dockerfile:1
FROM php:8.3.19-apache

# Add git
RUN apt-get -y update
RUN apt-get -y install git

# Add zip, for use downloading composer dependencies
RUN apt-get install -y libzip-dev zip
RUN docker-php-ext-install zip && docker-php-ext-enable zip

# Add composer
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

# For test coverage
RUN pecl install pcov

# For code highlighting
RUN apt-get install -y python3
RUN apt-get satisfy "python3 (>= 3.11, <= 3.12)"
RUN apt-get install -y python3-pip
# Docker environment, nothing is going to break
RUN pip install Pygments==2.19.1 --break-system-packages

RUN a2enmod rewrite