from rest_framework.generics import ListAPIView
from .models import Usuario
from .serializers import UsuarioSerializer

class UsuarioListView(ListAPIView):
    serializer_class = UsuarioSerializer

    def get_queryset(self):
        queryset = Usuario.objects.all()

        nombre = self.request.GET.get('nombre')
        rol = self.request.GET.get('rol')

        if nombre:
            queryset = queryset.filter(nombre__icontains=nombre)

        if rol:
            queryset = queryset.filter(rol_id=rol)

        return queryset