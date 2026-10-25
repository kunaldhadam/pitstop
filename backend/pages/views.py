from django.http import HttpResponse

def Home(request):
    return HttpResponse("This is the home page.")

