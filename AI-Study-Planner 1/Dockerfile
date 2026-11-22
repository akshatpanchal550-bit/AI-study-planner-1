FROM php:8.2-apache
RUN docker-php-ext-install pdo_mysql \
 && a2enmod rewrite \
 && sed -ri 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf \
 && sed -ri 's/Options Indexes FollowSymLinks/Options FollowSymLinks/' /etc/apache2/apache2.conf \
 && sed -ri 's/Listen 80/Listen ${PORT}/' /etc/apache2/ports.conf \
 && sed -ri 's/\*:80>/*:${PORT}>/' /etc/apache2/sites-available/000-default.conf
ENV PORT=10000
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html
EXPOSE 10000
