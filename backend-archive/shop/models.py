from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, blank=True)
    image_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    specifications = models.TextField(blank=True)
    related = models.ManyToManyField('self', blank=True)

    def __str__(self):
        return self.name


class Tutorial(models.Model):
    title = models.CharField(max_length=255)
    excerpt = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    thumbnail = models.URLField(blank=True)
    content = models.TextField(blank=True)

    def __str__(self):
        return self.title


class Service(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    price = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.title
