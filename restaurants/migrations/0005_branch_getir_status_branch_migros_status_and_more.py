# Generated by Django 4.2.18 on 2025-01-27 10:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurants', '0004_remove_restaurant_owner'),
    ]

    operations = [
        migrations.AddField(
            model_name='branch',
            name='getir_status',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='branch',
            name='migros_status',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='branch',
            name='trendyol_status',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='branch',
            name='yemeksepeti_status',
            field=models.BooleanField(default=False),
        ),
    ]
