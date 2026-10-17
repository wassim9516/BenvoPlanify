# projet_l2ab/urls.py
from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('benvoplanify.urls')),
]
