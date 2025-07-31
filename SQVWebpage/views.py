from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.decorators import login_required
# Import send_mail for sending emails
from django.core.mail import send_mail
# Import settings to access your email configuration
from django.conf import settings

# Import the new ContactForm
from .forms import ContactForm # Make sure this path is correct relative to views.py

def home_view(request):
    return render(request, 'SQVWebpage/home.html', {'title': 'Home - Squeaky Clean Vets'})

def about_view(request):
    return render(request, 'SQVWebpage/about.html', {'title': 'About Us - Squeaky Clean Vets'})

def prices_view(request):
    return render(request, 'SQVWebpage/cleaning-prices.html', {'title': 'Pricing - Squeaky Clean Vets'})

def schedule_view(request):
    return render(request, 'SQVWebpage/schedule.html', {'title': 'Schedule Cleaning - Squeaky Clean Vets'})

def faq_view(request):
    return render(request, 'SQVWebpage/faq.html', {'title': 'FAQ - Squeaky Clean Vets'})

def contact_view(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            # Get cleaned data
            name = form.cleaned_data['name']
            email = form.cleaned_data['email']
            subject = form.cleaned_data['subject']
            message = form.cleaned_data['message']

            # Construct the email body
            full_message = f"Name: {name}\n" \
                           f"From Email: {email}\n\n" \
                           f"Subject: {subject}\n\n" \
                           f"Message:\n{message}"

            try:
                # Send the email
                send_mail(
                    subject=f"SQV Contact Form: {subject}", # Prefix subject for clarity
                    message=full_message,
                    from_email=settings.DEFAULT_FROM_EMAIL, # Your configured sender email
                    recipient_list=[settings.EMAIL_RECEIVER_ADDRESS], # Your email where you want to receive messages
                    fail_silently=False, # Set to True in production to avoid exposing errors
                )
                messages.success(request, 'Your message has been sent successfully!')
                return redirect('SQVWebpage:contact') # Redirect to clear the form
            except Exception as e:
                messages.error(request, f'There was an error sending your message. Please try again later. Error: {e}')
                print(f"Email sending error: {e}") # For debugging
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = ContactForm() # An empty form for a GET request

    return render(request, 'SQVWebpage/contact.html', {'title': 'Contact Us - Squeaky Clean Vets', 'form': form})

def user_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f"Welcome back, {username}!")
            return redirect('SQVWebpage:home')
        else:
            messages.error(request, "Invalid username or password.")

    return render(request, 'SQVWebpage/login.html', {'title': 'Login - Squeaky Clean Vets'})

def user_logout(request):
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect('SQVWebpage:home')

def user_signup(request):
    if request.method == 'POST':
        # --- DEBUG PRINT HERE ---
        print(f"DEBUG: request.POST content: {request.POST}")
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        print(f"DEBUG: Retrieved username: '{username}'")
        # --- END DEBUG PRINT ---

        # Basic validation
        if password != password2:
            messages.error(request, "Passwords do not match.")
            return render(request, 'SQVWebpage/signup.html', {'title': 'Sign Up - Squeaky Clean Vets'})

        # Important: Check if username is actually empty AFTER retrieval
        if not username: # This explicitly checks for None or empty string
            messages.error(request, "Username cannot be empty.")
            return render(request, 'SQVWebpage/signup.html', {'title': 'Sign Up - Squeaky Clean Vets'})


        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already taken.")
            return render(request, 'SQVWebpage/signup.html', {'title': 'Sign Up - Squeaky Clean Vets'})

        if email and User.objects.filter(email=email).exists():
            messages.error(request, "Email already registered.")
            return render(request, 'SQVWebpage/signup.html', {'title': 'Sign Up - Squeaky Clean Vets'})

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            user.save()
            messages.success(request, "Account created successfully! Please log in.")
            return redirect('SQVWebpage:login')
        except Exception as e:
            # Re-enable the generic error message only after specific checks pass
            messages.error(request, f"An unexpected error occurred during registration: {e}")
            return render(request, 'SQVWebpage/signup.html', {'title': 'Sign Up - Squeaky Clean Vets'})

    return render(request, 'SQVWebpage/signup.html', {'title': 'Sign Up - Squeaky Clean Vets'})

# Placeholder for user_list if you choose to implement it
# @login_required
# def user_list(request):
#     users = User.objects.all().order_by('username')
#     context = {
#         'users': users,
#         'title': 'All Users - Squeaky Clean Vets'
#     }
#     return render(request, 'SQVWebpage/user_list.html', context)