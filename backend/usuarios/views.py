from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework.response import Response
from rest_framework import status
from .models import Usuario
from .serializers import UsuarioSerializer, UsuarioCreateSerializer


# 🔹 Lista usuarios existentes
class UsuarioListView(ListAPIView):
    serializer_class = UsuarioSerializer

    def get(self, request):
        pagina = int(request.GET.get('pagina', 1))
        limite = int(request.GET.get('limite', 10))

        usuarios_qs = Usuario.objects.all().order_by('id')

        # filtros
        nombre = request.GET.get('nombre')
        rol = request.GET.get('rol')

        if nombre:
            usuarios_qs = usuarios_qs.filter(nombre__icontains=nombre)
        if rol:
            usuarios_qs = usuarios_qs.filter(rol_id=rol)

        total = usuarios_qs.count()

        inicio = (pagina - 1) * limite
        fin = inicio + limite

        usuarios = usuarios_qs[inicio:fin]

        serializer = UsuarioSerializer(usuarios, many=True)

        return Response({
            'usuarios': serializer.data,
            'total': total
        })

# 🔹 Crear un nuevo usuario
class UsuarioCreateView(CreateAPIView):
    serializer_class = UsuarioCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()  # password ya se cifra en validate_password
        data = UsuarioSerializer(usuario).data  # usamos el serializer de lista para devolver info limpia
        return Response(
            {"mensaje": "Usuario creado correctamente", "usuario": data},
            status=status.HTTP_201_CREATED
        )
    
