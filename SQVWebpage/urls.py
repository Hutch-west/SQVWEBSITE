# SQV/SQVWebpage/urls.py

from django.urls import path
from . import views

app_name = 'SQVWebpage'

urlpatterns = [
    
    path('', views.home_view, name='home'),
    path('about/', views.about_view, name='about'),
    path('prices/', views.prices_view, name='prices'),
    path('schedule/', views.schedule_view, name='schedule'),
    path('faq/', views.faq_view, name='faq'),
    path('contact/', views.contact_view, name='contact'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('signup/', views.user_signup, name='signup'),

]